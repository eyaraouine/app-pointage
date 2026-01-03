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
import type { Employee, Zone, AttendanceLog, AdminUser } from '../types';

interface StoreContextType {
    employees: Employee[];
    zones: Zone[];
    logs: AttendanceLog[];
    addEmployee: (employee: Employee) => Promise<void>;
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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

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
            } catch (error) {
                console.error('Error loading Face API models:', error);
                setLoadingError("Erreur lors du chargement des modèles IA. Vérifiez votre connexion.");
            }
        };
        loadModels();
    }, []);

    // Real-time listeners for Firestore
    useEffect(() => {
        const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
        });

        const unsubZones = onSnapshot(collection(db, 'zones'), (snapshot) => {
            setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zone)));
        });

        const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
            setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog)));
        });

        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAdminUser({
                    id: user.uid,
                    email: user.email || '',
                    username: user.displayName || '',
                    name: user.displayName || '',
                    phone: user.phoneNumber || ''
                });
            } else {
                setAdminUser(null);
            }
        });

        return () => {
            unsubEmployees();
            unsubZones();
            unsubLogs();
            unsubAuth();
        };
    }, []);

    const addEmployee = async (employee: Employee) => {
        const { id, ...data } = employee;
        await addDoc(collection(db, 'employees'), data);
    };

    const deleteEmployee = async (id: string) => {
        await deleteDoc(doc(db, 'employees', id));
    };

    const addZone = async (zone: Zone) => {
        const { id, ...data } = zone;
        await addDoc(collection(db, 'zones'), data);
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
        await addDoc(collection(db, 'logs'), data);
    };

    const getEmployee = (id: string) => {
        return employees.find(e => e.id === id);
    };

    const loginAdmin = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error('Login error:', error);
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

    const hasAdmin = true;

    return (
        <StoreContext.Provider value={{
            employees,
            zones,
            logs,
            addEmployee,
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
            loadingError
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
