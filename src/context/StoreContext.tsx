import React, { createContext, useContext, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
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
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';
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
    loadingError: string | null;
    isKioskAdmin: boolean;
    enableKioskAdmin: (adminId?: string) => void;
    disableKioskAdmin: () => void;
    // Super Admin Features
    getAllAdmins: () => Promise<AdminUser[]>;
    toggleAdminSuspend: (id: string, suspended: boolean) => Promise<void>;
    impersonateAdmin: (adminId: string) => Promise<void>;
    exitImpersonation: () => void;
    superAdminSession: AdminUser | null;
    // Planning
    globalSchedule: Schedule | null;
    updateGlobalSchedule: (schedule: Schedule) => Promise<void>;
    setDetectedAdminId: (adminId: string | null) => void;
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

    // 1. Global Zones Listener (Public - for attendance)
    useEffect(() => {
        const unsubZones = onSnapshot(collection(db, 'zones'), (snapshot) => {
            const allZones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone));
            console.log("📍 Public Zones Loaded:", allZones.length);
            setZones(allZones);
        });
        return () => unsubZones();
    }, []);

    // 2. Conditional Listeners for Employees and Logs
    useEffect(() => {
        // Preference: Logged in Admin > Kiosk Admin > Detected Zone Admin (Public)
        const effectiveAdminId = adminUser?.id || kioskAdminId || detectedAdminId;

        if (!effectiveAdminId) {
            setEmployees([]);
            setLogs([]);
            return;
        }

        const qEmployees = query(collection(db, 'employees'), where('adminId', '==', effectiveAdminId));
        const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
            const fetchedEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
            console.log("👥 Employees Loaded for Admin:", effectiveAdminId, fetchedEmployees.length);
            setEmployees(fetchedEmployees);
        });

        const qLogs = query(collection(db, 'logs'), where('adminId', '==', effectiveAdminId));
        const unsubLogs = onSnapshot(qLogs, (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog)));
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
    }, [adminUser?.id, kioskAdminId]);

    // Independent Auth Listener
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch additional admin data (role, suspended, etc.)
                const { getDoc } = await import('firebase/firestore');
                const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                const adminData = adminDoc.exists() ? adminDoc.data() : {};

                if (adminData.suspended) {
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
            } else {
                setAdminUser(null);
            }
        });

        return () => unsubAuth();
    }, []);

    const addEmployee = async (employee: Employee) => {
        const { id, ...data } = employee;
        await addDoc(collection(db, 'employees'), {
            ...data,
            adminId: adminUser?.id
        });
    };

    const updateEmployee = async (employee: Employee) => {
        const { id, ...data } = employee;
        if (!id) return;
        await updateDoc(doc(db, 'employees', id), data as any);
    };

    const deleteEmployee = async (id: string) => {
        await deleteDoc(doc(db, 'employees', id));
    };

    const addZone = async (zone: Zone) => {
        const { id, ...data } = zone;
        await addDoc(collection(db, 'zones'), {
            ...data,
            adminId: adminUser?.id
        });
    };

    const deleteZone = async (id: string) => {
        await deleteDoc(doc(db, 'zones', id));
    };

    const updateZone = async (updatedZone: Zone) => {
        const { id, ...data } = updatedZone;
        await updateDoc(doc(db, 'zones', id), data as any);
    };

    const addLog = async (log: AttendanceLog) => {
        const { id, ...data } = log;
        await addDoc(collection(db, 'logs'), {
            ...data,
            adminId: adminUser?.id
        });
    };

    const getEmployee = (id: string) => {
        return employees.find(e => e.id === id);
    };

    const loginAdmin = async (email: string, password: string) => {
        try {
            // Mapping special username to email if necessary
            const targetEmail = email === 'glorysmartech' ? 'glorysmart.tech@gmail.com' : email;

            const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);

            // Check suspension status immediately
            const adminDoc = await import('firebase/firestore').then(mod => mod.getDoc(doc(db, 'admins', userCredential.user.uid)));
            if (adminDoc.exists() && adminDoc.data().suspended) {
                await signOut(auth);
                throw new Error("ACCOUNT_SUSPENDED");
            }

            return true;
        } catch (error: any) {
            console.error('Login error:', error);
            if (error.message === "ACCOUNT_SUSPENDED") {
                alert("Votre compte a été suspendu. Veuillez contacter le support.");
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

    const resetPassword = async (email: string, newPassword?: string) => {
        console.log('Password reset requested for:', email, newPassword ? 'with new password' : '');
        // For now, return true to simulate success if it's just a placeholder
        return true;
    };

    const findAdminByPhone = async (phone: string) => {
        const q = query(collection(db, 'admins'), where('phone', '==', phone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as AdminUser;
        }
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
    const getAllAdmins = async () => {
        const querySnapshot = await getDocs(collection(db, 'admins'));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
    };

    const toggleAdminSuspend = async (id: string, suspended: boolean) => {
        await updateDoc(doc(db, 'admins', id), { suspended });
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
        if (!adminUser?.id) return;
        await setDoc(doc(db, 'settings', `schedule_${adminUser.id}`), schedule);
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
            loadingError,
            isKioskAdmin,
            enableKioskAdmin,
            disableKioskAdmin,
            // Super Admin
            getAllAdmins,
            toggleAdminSuspend,
            impersonateAdmin,
            exitImpersonation,
            superAdminSession,
            globalSchedule,
            updateGlobalSchedule,
            setDetectedAdminId
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
