import React, { createContext, useContext, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import type { Employee, Zone, AttendanceLog, AdminUser } from '../types';

interface StoreContextType {
    employees: Employee[];
    zones: Zone[];
    logs: AttendanceLog[];
    addEmployee: (employee: Employee) => void;
    deleteEmployee: (id: string) => void;
    addZone: (zone: Zone) => void;
    deleteZone: (id: string) => void;
    updateZone: (zone: Zone) => void;
    addLog: (log: AttendanceLog) => void;
    getEmployee: (id: string) => Employee | undefined;
    adminUser: AdminUser | null;
    loginAdmin: (phone: string, password: string) => boolean;
    logoutAdmin: () => void;
    registerAdmin: (admin: AdminUser) => void;
    resetPassword: (email: string, newPassword: string) => boolean;
    findAdminByPhone: (phone: string) => AdminUser | undefined;
    hasAdmin: boolean;
    modelsLoaded: boolean;
    loadingError: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [logs, setLogs] = useState<AttendanceLog[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
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

    // Load from localStorage on mount
    useEffect(() => {
        const storedEmployees = localStorage.getItem('employees');
        const storedZones = localStorage.getItem('zones');
        const storedLogs = localStorage.getItem('logs');
        const storedAdmins = localStorage.getItem('admins');
        const storedAdminUser = localStorage.getItem('adminUser');

        if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
        if (storedZones) setZones(JSON.parse(storedZones));
        if (storedLogs) setLogs(JSON.parse(storedLogs));
        if (storedAdmins) setAdmins(JSON.parse(storedAdmins));
        if (storedAdminUser) setAdminUser(JSON.parse(storedAdminUser));
    }, []);

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('employees', JSON.stringify(employees));
    }, [employees]);

    useEffect(() => {
        localStorage.setItem('zones', JSON.stringify(zones));
    }, [zones]);

    useEffect(() => {
        localStorage.setItem('logs', JSON.stringify(logs));
    }, [logs]);

    useEffect(() => {
        localStorage.setItem('admins', JSON.stringify(admins));
    }, [admins]);

    useEffect(() => {
        if (adminUser) {
            localStorage.setItem('adminUser', JSON.stringify(adminUser));
        } else {
            localStorage.removeItem('adminUser');
        }
    }, [adminUser]);

    const addEmployee = (employee: Employee) => {
        setEmployees(prev => [...prev, employee]);
    };

    const deleteEmployee = (id: string) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    };

    const addZone = (zone: Zone) => {
        // Prevent duplicates by name or location (simple check)
        setZones(prev => {
            const exists = prev.find(z => z.name === zone.name || (z.lat === zone.lat && z.lng === zone.lng));
            if (exists) return prev;
            return [...prev, zone];
        });
    };

    const deleteZone = (id: string) => {
        setZones(prev => prev.filter(z => z.id !== id));
    };

    const updateZone = (updatedZone: Zone) => {
        setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    };

    const addLog = (log: AttendanceLog) => {
        setLogs(prev => [log, ...prev]);
    };

    const getEmployee = (id: string) => {
        return employees.find(e => e.id === id);
    };

    const loginAdmin = (phone: string, password: string) => {
        // Simple mock auth: find admin by phone and check password
        const admin = admins.find(a => a.phone === phone && a.password === password);
        if (admin) {
            const { password: _, ...userWithoutPassword } = admin;
            setAdminUser(userWithoutPassword as AdminUser);
            return true;
        }
        return false;
    };

    const logoutAdmin = () => {
        setAdminUser(null);
    };

    const registerAdmin = (admin: AdminUser) => {
        setAdmins(prev => [...prev, admin]);
        // Auto-login after registration
        const { password: _, ...userWithoutPassword } = admin;
        setAdminUser(userWithoutPassword as AdminUser);
    };

    const resetPassword = (email: string, newPassword: string) => {
        const adminIndex = admins.findIndex(a => a.email === email);
        if (adminIndex !== -1) {
            const updatedAdmins = [...admins];
            updatedAdmins[adminIndex] = { ...updatedAdmins[adminIndex], password: newPassword };
            setAdmins(updatedAdmins);
            return true;
        }
        return false;
    };

    const findAdminByPhone = (phone: string) => {
        return admins.find(a => a.phone === phone);
    };

    const hasAdmin = admins.length > 0;

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
