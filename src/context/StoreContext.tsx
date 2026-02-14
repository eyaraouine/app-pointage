import React, { createContext, useContext, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    setDoc,
    query,
    where,
    getDocs,
    getDoc,
    initializeFirestore
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import { auth, db, storage } from '../firebase';

// Unauthenticated DB for Discovery (Bypasses Super Admin Blindness)
const ghostApp = getApps().find(a => a.name === 'Ghost') || initializeApp((getApp()).options, 'Ghost');
const ghostDb = initializeFirestore(ghostApp, { ignoreUndefinedProperties: true });

import type { Employee, Zone, AttendanceLog, AdminUser, Schedule } from '../types';

interface StoreContextType {
    employees: Employee[];
    zones: Zone[];
    logs: AttendanceLog[];
    addEmployee: (employee: Employee) => Promise<void>;
    updateEmployee: (employee: Employee) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
    addZone: (zone: Zone) => Promise<void>;
    deleteZone: (id: string) => Promise<void>;
    updateZone: (zone: Zone) => Promise<void>;
    addLog: (log: AttendanceLog) => Promise<void>;
    getEmployee: (id: string) => Employee | undefined;
    adminUser: AdminUser | null;
    loginAdmin: (email: string, password: string) => Promise<boolean>;
    logoutAdmin: () => Promise<void>;
    registerAdmin: (admin: AdminUser, password: string) => Promise<void>;
    resetPassword: (email: string, newPassword?: string) => Promise<boolean>;
    findAdminByPhone: (phone: string) => Promise<AdminUser | undefined>;
    hasAdmin: boolean;
    modelsLoaded: boolean;
    isEmployeesLoading: boolean;
    loadingError: string | null;
    isKioskAdmin: boolean;
    kioskAdminId: string | null;
    enableKioskAdmin: (adminId?: string) => void;
    disableKioskAdmin: () => void;
    // Super Admin Features
    getAllAdmins: () => Promise<AdminUser[]>;
    getGlobalStats: () => Promise<{ employeeCount: number; adminCount: number }>;
    toggleAdminSuspend: (id: string, suspended: boolean) => Promise<void>;
    impersonateAdmin: (adminId: string) => Promise<void>;
    exitImpersonation: () => void;
    superAdminSession: AdminUser | null;
    // Planning
    globalSchedule: Schedule | null;
    updateGlobalSchedule: (schedule: Schedule) => Promise<void>;
    setDetectedAdminId: (adminId: string | null) => void;
    uploadEmployeePhoto: (employeeId: string, base64: string) => Promise<string>;
    lastError: string | null;
    debugInfo: {
        adminId: string | null;
        zonesCount: number;
        employeesCount: number;
        authId: string | null;
        kioskAdminId: string | null;
        detectedAdminId: string | null;
        activeAdminId: string | null;
        lastFirestoreError: string | null;
    };
    clearAllData: (repairMode?: boolean) => void;
}

const DEFAULT_SCHEDULE: Schedule = {
    modality: 'fixed',
    workingDays: {
        monday: { isActive: true, start: '09:00', end: '17:00' },
        tuesday: { isActive: true, start: '09:00', end: '17:00' },
        wednesday: { isActive: true, start: '09:00', end: '17:00' },
        thursday: { isActive: true, start: '09:00', end: '17:00' },
        friday: { isActive: true, start: '09:00', end: '17:00' },
        saturday: { isActive: false, start: '09:00', end: '17:00' },
        sunday: { isActive: false, start: '09:00', end: '17:00' },
    }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [superAdminSession, setSuperAdminSession] = useState<AdminUser | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [globalSchedule, setGlobalSchedule] = useState<Schedule | null>(null);
    const [kioskAdminId, setKioskAdminId] = useState<string | null>(
        () => localStorage.getItem('kiosk_admin_id')
    );
    const [detectedAdminId, setDetectedAdminId] = useState<string | null>(null);
    const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
    const [lastError, setLastError] = useState<string | null>(null);

    // Load models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                console.log('Starting to load Face API models...');
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                console.log('Face API models loaded successfully');
            } catch (error: any) {
                console.error('Error loading Face API models:', error);
                setLoadingError(`Erreur lors du chargement des modèles IA: ${error.message || JSON.stringify(error)}. Vérifiez votre connexion.`);
            }
        };
        loadModels();
    }, []);

    // 1. Unified Zones Listener
    useEffect(() => {
        setZones([]); // Clear current zones before fetching new ones for isolation
        const zonesCollection = collection(db, 'zones');

        // Mode Management: On filtre strictement par adminId
        // Mode Public: On charge tout pour la détection GPS locale

        const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
        const effectiveId = adminUser?.id || kioskAdminId;

        // Si c'est un Super Admin, on ne filtre pas (il voit tout)
        // Sinon, si on a un ID d'admin, on filtre par cet ID
        // Sinon (Mode Public), on charge tout
        let q;
        if (isSuperAdmin) {
            q = zonesCollection;
        } else if (effectiveId) {
            q = query(zonesCollection, where('adminId', '==', effectiveId));
        } else {
            q = zonesCollection; // Public detection mode
        }

        const unsubZones = onSnapshot(q, (snapshot) => {
            const fetchedZones = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Zone));
            console.log(
                isSuperAdmin ? "🏁 Super Admin: All Zones Loaded" :
                    effectiveId ? `🔒 Admin/Kiosk Zones Loaded (${effectiveId})` :
                        "🌍 Public Zones Loaded",
                fetchedZones.length
            );
            setZones(fetchedZones);
        }, (err) => {
            console.error("🔥 Firestore Zones Error:", err);
            setLastError(`Zones Error: ${err.code} - ${err.message}`);
            setZones([]);
        });

        return () => unsubZones();
    }, [adminUser?.id, adminUser?.role, kioskAdminId]);

    // 2. Conditional Listeners for Employees and Logs
    useEffect(() => {
        // Priority: Logged in Admin > Detected Zone Admin (Public Attendance) > Kiosk Admin (Legacy/Fallback)
        // This ensures that if we detect a specific site, we load ITS employees even if an old kiosk ID exists.
        const effectiveAdminId = adminUser?.id || detectedAdminId || kioskAdminId;
        console.log("🔄 STORE EFFECTIVE ID:", effectiveAdminId, { admin: adminUser?.id, detected: detectedAdminId, kiosk: kioskAdminId });

        if (!effectiveAdminId) {
            setEmployees([]);
            setLogs([]);
            setIsEmployeesLoading(false); // DEBLOQUAGE: Ne pas bloquer si on n'a rien à charger
            console.log("⏳ No Admin ID yet (Awaiting GPS detection or login)...");
            return;
        }

        setIsEmployeesLoading(true); // RE-BLOQUAGE: On a un ID, on lance la synchro

        const qEmployees = query(collection(db, 'employees'), where('adminId', '==', effectiveAdminId));
        const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
            const fetchedEmployees = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Employee));
            console.log("👥 Employees Loaded for Admin:", effectiveAdminId, fetchedEmployees.length);
            setEmployees(fetchedEmployees);
            setIsEmployeesLoading(false);
            setLastError(null);
        }, (err) => {
            console.error("🔥 Firestore Employees Error:", err);
            setLastError(`Employees Error: ${err.code} - ${err.message}`);
            setIsEmployeesLoading(false); // Unblock UI even on error
        });

        const qLogs = query(collection(db, 'logs'), where('adminId', '==', effectiveAdminId));
        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttendanceLog)));
        });

        const unsubSettings = onSnapshot(doc(db, 'settings', `schedule_${effectiveAdminId}`), (snapshot) => {
            if (snapshot.exists()) {
                setGlobalSchedule(snapshot.data() as Schedule);
            } else {
                setGlobalSchedule(DEFAULT_SCHEDULE);
            }
        });

        return () => {
            unsubEmployees();
            unsubLogs();
            unsubSettings();
        };
    }, [adminUser?.id, kioskAdminId, detectedAdminId]);

    // Independent Auth Listener
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch additional admin data (role, suspended, etc.)
                const { getDoc } = await import('firebase/firestore');
                const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                const adminData = adminDoc.exists() ? adminDoc.data() : {};

                // v2.0.4: Super Admin Session Bypass (onAuthStateChanged)
                const isSuperAdmin = (user.email || '').toLowerCase() === 'glorysmart.tech@gmail.com';

                if (adminData.suspended && !isSuperAdmin) {
                    await signOut(auth);
                    setAdminUser(null);
                    return;
                }

                setAdminUser({
                    id: user.uid,
                    email: user.email || '',
                    username: adminData.username || user.displayName || '',
                    name: adminData.name || user.displayName || '',
                    phone: adminData.phone || '',
                    role: adminData.role,
                    suspended: adminData.suspended
                });
                alert(`🔓 AUTH SUCESS: Connecté en tant que ${user.uid}`);
            } else {
                setAdminUser(null);
                // alert("🔒 AUTH: Déconnecté");
            }
        });

        return () => unsubAuth();
    }, []);

    // Remote debug logging
    const remoteLog = async (level: string, message: string, data?: any) => {
        try {
            await addDoc(collection(db, 'debug_logs'), {
                level,
                message,
                data: JSON.stringify(data),
                timestamp: new Date().toISOString(),
                adminId: adminUser?.id || kioskAdminId,
                userAgent: navigator.userAgent,
                version: "1.2.6"
            });
        } catch (e) {
            console.error("Local: Failed to send remote log", e);
        }
    };

    // Helper for timeouts
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(message)), timeoutMs)
            )
        ]);
    };

    const addEmployee = async (employee: Employee) => {
        const effectiveId = adminUser?.id || kioskAdminId;
        alert(`debug: addEmployee - effectiveId: ${effectiveId}`);

        if (!effectiveId) {
            alert("❌ Erreur: ID administrateur manquant. Réessayez de vous connecter.");
            throw new Error("ID administrateur manquant.");
        }

        const { id, ...data } = employee;
        const finalData = { ...data, adminId: effectiveId };

        // Critical Fix v1.3.1: Ensure photoURL is preserved even if it's a Base64 string
        if (data.photoURL && data.photoURL.startsWith('data:image')) {
            console.log("Saving Base64 photo to Firestore (Fallback Mode)");
            // We DO NOT delete 'photo' property if it holds the same data, just ensure consistency
            (finalData as any).photo = ""; // Clear legacy field if any
        } else if (data.photoURL) {
            // Standard URL
            if ((finalData as any).photo) delete (finalData as any).photo;
        }

        alert("📡 Tentative d'enregistrement de l'employé...");
        try {
            await withTimeout(
                addDoc(collection(db, 'employees'), finalData),
                10000,
                "Le serveur Firestore ne répond pas (Timeout 10s)"
            );
            alert("✅ Employé enregistré !");
        } catch (error: any) {
            alert(`❌ Échec enregistrement: ${error.message}`);
            await remoteLog('ERROR', `addEmployee failed: ${error.message}`, { error });
            throw error;
        }
    };

    const updateEmployee = async (employee: Employee) => {
        const { id, ...data } = employee;
        alert(`debug: updateEmployee - ID: ${id}`);
        if (!id) return;
        const finalData = { ...data };
        if (data.photoURL) delete (finalData as any).photo;

        alert("📡 Mise à jour en cours...");
        try {
            await withTimeout(
                updateDoc(doc(db, 'employees', id), finalData as any),
                10000,
                "Temps d'attente dépassé pour la mise à jour."
            );
            alert("✅ Employé mis à jour !");
        } catch (error: any) {
            alert(`❌ Échec mise à jour: ${error.message}`);
            console.error('Error updating employee:', error);
            throw error;
        }
    };

    const uploadEmployeePhoto = async (employeeId: string, base64: string) => {
        alert(`debug: uploadEmployeePhoto - ID: ${employeeId}`);
        // 1. Convert Base64 to Blob (more robust than uploadString)
        const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const storageRef = ref(storage, `employees/${employeeId}.jpg`);

        alert(`📡 Upload photo (Taille: ${(blob.size / 1024).toFixed(1)} KB)...`);
        try {
            await withTimeout(
                uploadBytes(storageRef, blob, { contentType: 'image/jpeg' }),
                5000, // Reduced to 5s for FLASH fallback
                "Téléchargement trop lent (Timeout 5s)"
            );
            const url = await getDownloadURL(storageRef);
            alert("✅ Photo enregistrée ! URL obtenue.");
            return url;
        } catch (error: any) {
            console.error("Storage upload failed, switching to fallback:", error);
            // v1.3.0 FALLBACK: Return the Base64 string directly to be saved in Firestore
            // This ensures the photo is saved even if Storage fails.
            alert(`⚠️ Mode Secours activé: Sauvegarde directe en base de données.`);
            await remoteLog('WARNING', `Storage upload failed, using fallback base64`, { employeeId, size: blob.size, error: error.message });

            // Reconstruct the full data URI if needed, or use the original base64 arg if it had the prefix
            return base64.includes(',') ? base64 : `data:image/jpeg;base64,${base64}`;
        }
    };

    const deleteEmployee = async (id: string) => {
        alert(`debug: deleteEmployee - ID: ${id}`);
        try {
            await withTimeout(
                deleteDoc(doc(db, 'employees', id)),
                10000,
                "Temps d'attente dépassé pour la suppression de l'employé."
            );
            alert("✅ Employé supprimé !");
        } catch (error: any) {
            alert(`❌ Échec suppression: ${error.message}`);
            await remoteLog('ERROR', `deleteEmployee failed: ${error.message}`, { id, error });
            throw error;
        }
    };

    const addZone = async (zone: Omit<Zone, 'id'>) => {
        const effectiveId = adminUser?.id || kioskAdminId;
        alert(`debug: addZone - AdminID: ${effectiveId}`);

        if (!effectiveId) {
            alert("❌ Erreur: Authentification requise pour ajouter une zone.");
            throw new Error("Authentication required to add zone");
        }

        alert("📡 Ajout de la zone...");
        try {
            await withTimeout(
                addDoc(collection(db, 'zones'), {
                    ...zone,
                    adminId: effectiveId
                }),
                10000,
                "Temps d'attente dépassé pour l'ajout de zone."
            );
            alert("✅ Zone ajoutée !");
        } catch (error: any) {
            alert(`❌ Échec ajout zone: ${error.message}`);
            throw error;
        }
    };

    const deleteZone = async (id: string) => {
        const effectiveAdminId = adminUser?.id || kioskAdminId;
        alert(`debug: deleteZone - ID: ${id}, AdminID: ${effectiveAdminId}`);

        if (!effectiveAdminId) {
            alert("❌ Erreur: Pas d'ID administrateur trouvé.");
            throw new Error("Authentification requise pour supprimer une zone.");
        }

        alert("📡 Suppression en cours...");
        try {
            await withTimeout(
                deleteDoc(doc(db, 'zones', id)),
                10000,
                "Délai d'attente dépassé lors de la suppression."
            );
            alert("✅ Zone supprimée avec succès !");
        } catch (error: any) {
            alert(`❌ Échec suppression: ${error.message}`);
            await remoteLog('ERROR', `deleteZone failed: ${error.message}`, { id, error });
            console.error("[deleteZone] Error details:", error);
            throw error;
        }
    };

    const updateZone = async (updatedZone: Zone) => {
        const effectiveId = adminUser?.id || kioskAdminId;
        alert(`debug: updateZone - ID: ${updatedZone.id}, Admin: ${effectiveId}`);
        if (!effectiveId) return;

        const { id, ...data } = updatedZone;
        if (!id) return;

        alert("📡 Vérification de propriété...");
        // Verify ownership before updating
        const zoneDoc = await getDoc(doc(db, 'zones', id));
        if (zoneDoc.exists() && zoneDoc.data().adminId === effectiveId) {
            alert("📡 Envoi de la mise à jour...");
            await updateDoc(doc(db, 'zones', id), { ...data, adminId: effectiveId } as any);
            alert("✅ Zone mise à jour !");
        } else {
            alert("❌ Non autorisé ou zone introuvable.");
            console.error("Unauthorized update attempt or zone not found");
        }
    };

    const addLog = async (log: AttendanceLog) => {
        const { id, ...data } = log;
        await addDoc(collection(db, 'logs'), {
            ...data,
            adminId: log.adminId || adminUser?.id
        });
    };

    const getEmployee = (id: string) => {
        return employees.find(e => e.id === id);
    };

    const loginAdmin = async (email: string, password: string) => {
        try {
            // v2.0.2: Diagnostic rigoureux
            const cleanEmail = (email || '').trim().toLowerCase();
            const targetEmail = cleanEmail === 'glorysmartech' ? 'glorysmart.tech@gmail.com' : cleanEmail;

            console.log("🔑 [v2.0.2] Tentative de connexion pour:", cleanEmail, "->", targetEmail);
            alert("Vérification Google pour :\n" + targetEmail);

            const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);

            // Use static import for getDoc (loaded at top) to avoid network chunks issues
            const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
            if (adminDoc.exists()) {
                const data = adminDoc.data();

                // v2.0.3: Super Admin Safety Bypass
                // Le compte principal ne doit jamais être bloqué par la base de données
                const isSuperAdmin = targetEmail.toLowerCase() === 'glorysmart.tech@gmail.com';

                if (data.suspended && !isSuperAdmin) {
                    await signOut(auth);
                    throw new Error("ACCOUNT_SUSPENDED");
                }
                setAdminUser({ id: adminDoc.id, ...data } as AdminUser);

                // Index for Super Admin Visibility (Async bypass)
                setDoc(doc(db, 'admin_public_index', userCredential.user.uid), {
                    id: userCredential.user.uid,
                    name: data.name || 'Admin',
                    email: data.email || targetEmail,
                    lastLogin: new Date().toISOString()
                }).catch(e => console.error("Index failed:", e));

                return true;
            }
            return false;
        } catch (error: any) {
            console.error('Login error:', error);
            // Critical Debug for v1.4.2: Show the real error to the user
            if (error.code === 'auth/network-request-failed') {
                alert("⚠️ Erreur Réseau : Impossible de contacter Google. Vérifiez votre connexion.");
            } else if (error.message === "ACCOUNT_SUSPENDED") {
                alert("Votre compte a été suspendu. Veuillez contacter le support.");
            } else {
                alert(`❌ Erreur connexion: ${error.code || error.message}`);
            }
            return false;
        }
    };

    const logoutAdmin = async () => {
        await signOut(auth);
    };

    const registerAdmin = async (admin: AdminUser, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, admin.email, password);
        await updateProfile(userCredential.user, { displayName: admin.name });

        const { password: _, ...adminData } = admin;
        await setDoc(doc(db, 'admins', userCredential.user.uid), {
            ...adminData,
            id: userCredential.user.uid
        });
    };

    const resetPassword = async (email: string) => {
        try {
            console.log("🔥 [v2.0.0] Demande de réinitialisation Firebase pour:", email);
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error: any) {
            console.error("❌ Firebase Reset Error:", error);
            return false;
        }
    };

    const findAdminByPhone = async (phone: string) => {
        // v1.9.8: Hardcoded Fallback for Super Admin (Immediate relief)
        if (phone.replace(/\s/g, '') === '94990307') {
            console.log("⚡ [v1.9.8] Fallback Hardcoded activé pour Hatem.");
            return {
                id: '9NGj58ZtEohiUgB9HweIKp7ttyj1',
                name: 'Hatem Raouine',
                email: 'glorysmart.tech@gmail.com',
                phone: '94990307',
                username: 'Master',
                role: 'SUPER_ADMIN'
            } as AdminUser;
        }

        try {
            // Tentative via GhostDb (Bypasse les règles standard)
            console.log("🔍 [v1.9.8] Recherche via GhostDb...");
            const q = query(collection(ghostDb, 'admins'), where('phone', '==', phone));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as AdminUser;
            }
        } catch (e) {
            console.warn("GhostDb discovery failed, falling back to public index...");
        }

        try {
            // Tentative via Public Index
            const q = query(collection(ghostDb, 'admin_public_index'), where('phone', '==', phone));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].data() as AdminUser;
            }
        } catch (e) { }

        return undefined;
    };

    // Kiosk Admin State Management
    const [isKioskAdmin, setIsKioskAdmin] = useState(
        () => localStorage.getItem('User_Access_Level') === 'ADMIN_MASTER'
    );

    const enableKioskAdmin = (adminId?: string) => {
        localStorage.setItem('User_Access_Level', 'ADMIN_MASTER');
        localStorage.setItem('isAuthenticated', 'true');
        if (adminId) {
            localStorage.setItem('kiosk_admin_id', adminId);
            setKioskAdminId(adminId);
        }
        setIsKioskAdmin(true);
    };

    const disableKioskAdmin = () => {
        localStorage.removeItem('User_Access_Level');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('kiosk_admin_session');
        localStorage.removeItem('kiosk_admin_id');
        setKioskAdminId(null);
        setIsKioskAdmin(false);
    };

    // Security: invalidates session on background
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && isKioskAdmin) {
                console.log("App backgrounded, revoking kiosk session.");
                disableKioskAdmin();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isKioskAdmin]);



    const hasAdmin = true;

    // Super Admin Actions
    const getGlobalStats = async () => {
        try {
            const admins = await getAllAdmins();
            const empSnap = await getDocs(collection(ghostDb, 'employees'));
            return {
                adminCount: admins.length,
                employeeCount: empSnap.size
            };
        } catch (error) {
            console.error("Global stats error:", error);
            return { adminCount: 0, employeeCount: 0 };
        }
    };

    const getAllAdmins = async () => {
        console.log("🚀 TOTAL VISION DISCOVERY (v1.8.5)...");
        const adminMap = new Map<string, AdminUser>();

        // 1. RAW DISCOVERY (Find all unique IDs)
        const discoveredIds = new Set<string>();

        // Add known IDs immediately to ensure they are never missed
        discoveredIds.add('9NGj58ZtEohiUgB9HweIKp7ttyj1'); // Hatem
        discoveredIds.add('SwZ7gJQACGUOKQBGPdf0zYahP8y1'); // Somatra
        discoveredIds.add('9eqEPWvNV1huLok1xXDjIHuccSw2'); // admin/Ayouta

        try {
            // A. Public Index (The Omniscience Channel)
            const publicIndex = await getDocs(collection(db, 'admin_public_index'));
            console.log(`Source A (Index): ${publicIndex.size} docs`);
            alert(`🔍 Diagnostic A (Index): ${publicIndex.size} admins indexés`);
            publicIndex.forEach(d => {
                discoveredIds.add(d.id);
                const data = d.data();
                adminMap.set(d.id, {
                    id: d.id,
                    name: data.name || data.email || 'Admin',
                    email: data.email || 'Protégé',
                    username: 'Inscrit'
                } as AdminUser);
            });

            // A2. Direct Admins (if permissions allow)
            const snap = await getDocs(collection(db, 'admins'));
            console.log(`Source A2 (Direct): ${snap.size} docs`);
            snap.forEach(d => {
                discoveredIds.add(d.id);
                adminMap.set(d.id, { ...d.data(), id: d.id } as AdminUser);
            });
        } catch (e: any) {
            console.error("Direct/Index Admin Source failed:", e);
            alert(`⚠️ Note Source A: ${e.message}`);
        }

        try {
            // B. Ghost Zones
            const zones = await getDocs(collection(ghostDb, 'zones'));
            console.log(`Source B (Ghost Zones): ${zones.size} docs`);
            alert(`🔍 Diagnostic B (Zones): ${zones.size} zones trouvées`);
            zones.forEach(d => discoveredIds.add(d.data().adminId));
        } catch (e: any) {
            alert(`❌ Erreur Source B: ${e.message}`);
        }

        try {
            // C. Ghost Employees
            const emps = await getDocs(collection(ghostDb, 'employees'));
            console.log(`Source C (Ghost Employees): ${emps.size} docs`);
            alert(`🔍 Diagnostic C (Employés): ${emps.size} employés trouvés`);
            emps.forEach(d => discoveredIds.add(d.data().adminId));
        } catch (e: any) {
            alert(`❌ Erreur Source C: ${e.message}`);
        }

        // 2. IDENTITY RECOVERY & MERGE
        const finalAdminsMap = new Map<string, AdminUser>();

        for (const id of Array.from(discoveredIds)) {
            if (!id || id === 'undefined' || id.length < 5) continue;

            let finalUser: AdminUser = adminMap.get(id) || {
                id,
                name: `Société (ID: ${id.substring(0, 5)})`,
                email: 'Protégé',
                role: 'ADMIN',
                username: 'inconnu'
            } as AdminUser;

            // Try to upgrade "inconnu" users if Source A failed but individual Get works
            if (!finalUser.name || finalUser.username === 'inconnu' || finalUser.username === 'Inscrit') {
                try {
                    const profile = await getDoc(doc(db, 'admins', id));
                    if (profile.exists()) {
                        finalUser = { ...finalUser, ...profile.data(), id: profile.id } as AdminUser;
                    }
                } catch (e) {
                    console.log(`Silent fail for admin ${id}: Permission likely restricted`);
                }
            }

            // HARD FALLBACKS (The "Jan 13" Promise)
            // IMPORTANT: Only override identity fields, preserve suspended status from DB
            if (id === '9NGj58ZtEohiUgB9HweIKp7ttyj1') {
                finalUser.name = 'Hatem Raouine';
                finalUser.email = 'glorysmart.tech@gmail.com';
                finalUser.phone = '94990307';
                finalUser.username = 'Master';
                finalUser.role = 'SUPER_ADMIN' as any;
                // Keep suspended status from database (already set from adminMap or getDoc)
            } else if (id === 'SwZ7gJQACGUOKQBGPdf0zYahP8y1') {
                finalUser.name = 'Somatra';
                finalUser.email = 'eyaraouine15@gmail.com';
                finalUser.username = 'Admin';
                finalUser.phone = '';
                finalUser.role = 'ADMIN' as any;
                // Keep suspended status from database
            } else if (id === '9eqEPWvNV1huLok1xXDjIHuccSw2') {
                finalUser.name = 'Ayouta Kaybouta';
                finalUser.email = 'ayouta.kaybouta@gmail.com';
                finalUser.username = 'Admin';
                finalUser.phone = '';
                finalUser.role = 'ADMIN' as any;
                // Keep suspended status from database
            }

            // FINAL DEDUPLICATION Check: Use ID as key to merge
            if (finalAdminsMap.has(id)) {
                const existing = finalAdminsMap.get(id)!;
                // Prefer the one that doesn't have "inconnu"
                if (existing.username === 'inconnu' && finalUser.username !== 'inconnu') {
                    finalAdminsMap.set(id, finalUser);
                }
            } else {
                finalAdminsMap.set(id, finalUser);
            }
        }

        console.log(`✨ DISCOVERY COMPLETE: ${finalAdminsMap.size} admins confirmed.`);
        alert(`✨ TOTAL FINAL : ${finalAdminsMap.size} admins confirmés.`);
        return Array.from(finalAdminsMap.values());
    };

    const toggleAdminSuspend = async (id: string, suspended: boolean) => {
        try {
            console.log(`🔄 Toggling suspend for ${id} to ${suspended}`);
            await updateDoc(doc(db, 'admins', id), { suspended });
            console.log(`✅ Suspend status updated successfully`);
        } catch (error) {
            console.error('❌ Failed to update suspend status:', error);
            throw error;
        }
    };

    const impersonateAdmin = async (adminId: string) => {
        // 1. Save current session (Super Admin)
        if (adminUser && adminUser.role === 'SUPER_ADMIN') {
            setSuperAdminSession(adminUser);
        }

        // 2. Fetch target admin
        const adminDoc = await import('firebase/firestore').then(mod => mod.getDoc(doc(db, 'admins', adminId)));
        if (adminDoc.exists()) {
            const targetAdmin = { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
            setAdminUser(targetAdmin);
            // Ensure access level is set for routing (mocking the role temporarily)
            // We rely on component level checks or just context state
        }
    };

    const exitImpersonation = () => {
        if (superAdminSession) {
            setAdminUser(superAdminSession);
            setSuperAdminSession(null);
        }
    };

    // Auto-detect Super Admin Role on Auth Change
    useEffect(() => {
        if (adminUser?.email === 'glorysmart.tech@gmail.com' && adminUser.role !== 'SUPER_ADMIN') {
            // Forcing role update in local state and potentially DB if missing
            const updatedUser = { ...adminUser, role: 'SUPER_ADMIN' as const };
            setAdminUser(updatedUser);
        }
    }, [adminUser?.email]);

    const updateGlobalSchedule = async (schedule: Schedule) => {
        const effectiveId = adminUser?.id || kioskAdminId;
        alert(`debug: updateGlobalSchedule - Admin: ${effectiveId}`);
        if (!effectiveId) return;

        alert("📡 Enregistrement du planning...");
        try {
            await setDoc(doc(db, 'settings', `schedule_${effectiveId}`), schedule);
            setGlobalSchedule(schedule);
            alert("✅ Planning enregistré !");
        } catch (error: any) {
            alert(`❌ Échec enregistrement planning: ${error.message}`);
            console.error('Error updating global schedule:', error);
        }
    };

    const clearAllData = async (repairMode = false) => {
        if (repairMode) {
            const effectiveAdminId = adminUser?.id || detectedAdminId || kioskAdminId;
            if (!effectiveAdminId) {
                alert("❌ Erreur: Impossible de réparer sans identification (GPS ou Login).");
                return;
            }

            // aggressive unification
            try {
                const employeesRef = collection(db, 'employees');

                // 1. Unify loaded zones
                for (const z of zones) {
                    if (z.adminId !== effectiveAdminId) {
                        try { await updateDoc(doc(db, 'zones', z.id), { adminId: effectiveAdminId }); } catch (e) { }
                    }
                }

                // 3. Unify loaded employees (if any)
                for (const e of employees) {
                    if (e.adminId !== effectiveAdminId) {
                        try { await updateDoc(doc(db, 'employees', e.id), { adminId: effectiveAdminId }); } catch (e) { }
                    }
                }

                // 4. Targeted scan for common orphans (legacy IDs)
                const orphans = ['GPdf0zYahP8y1', 'SwZ7gJQACGUOKQBGPdf0zYahP8y1', ''];
                for (const oldId of orphans) {
                    const qE = query(employeesRef, where('adminId', '==', oldId));
                    const sE = await getDocs(qE);
                    for (const d of sE.docs) await updateDoc(doc(db, 'employees', d.id), { adminId: effectiveAdminId });
                }

                alert("✨ Unification terminée. Les données sont maintenant liées à votre session actuelle.");
            } catch (error: any) {
                console.error("Repair failed:", error);
                alert("⚠️ Réparation partielle: Connectez-vous en tant qu'administrateur pour un nettoyage complet.");
            }
        }

        localStorage.clear();
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) registration.unregister();
        }
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        window.location.reload();
    };

    const debugInfo = {
        adminId: adminUser?.id || null,
        zonesCount: zones.length,
        employeesCount: employees.length,
        authId: auth.currentUser?.uid || null,
        kioskAdminId,
        detectedAdminId,
        activeAdminId: adminUser?.id || detectedAdminId || kioskAdminId,
        lastFirestoreError: lastError
    };

    return (
        <StoreContext.Provider value={{
            employees,
            zones,
            logs,
            addEmployee,
            updateEmployee,
            deleteEmployee,
            addZone,
            deleteZone,
            updateZone,
            addLog,
            getEmployee,
            adminUser,
            loginAdmin,
            logoutAdmin,
            registerAdmin,
            resetPassword,
            findAdminByPhone,
            hasAdmin,
            modelsLoaded,
            isEmployeesLoading,
            loadingError,
            isKioskAdmin,
            kioskAdminId,
            enableKioskAdmin,
            disableKioskAdmin,
            // Super Admin
            getAllAdmins,
            toggleAdminSuspend,
            impersonateAdmin,
            exitImpersonation,
            getGlobalStats,
            superAdminSession,
            globalSchedule,
            updateGlobalSchedule,
            setDetectedAdminId,
            uploadEmployeePhoto,
            lastError,
            debugInfo,
            clearAllData
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
