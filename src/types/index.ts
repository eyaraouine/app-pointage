export type ScheduleModality = 'fixed' | 'flexible' | 'weekly';

export interface DaySchedule {
    isActive: boolean;
    start: string;    // HH:mm format (Fixé)
    end: string;      // HH:mm format (Fixé)
    duration?: number; // Total minutes or hours per day (Flexible)
}

export interface Schedule {
    name?: string;
    modality: ScheduleModality;
    workingDays: {
        monday: DaySchedule;
        tuesday: DaySchedule;
        wednesday: DaySchedule;
        thursday: DaySchedule;
        friday: DaySchedule;
        saturday: DaySchedule;
        sunday: DaySchedule;
    };
    totalWeeklyHours?: number; // (Hebdomadaire)
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    photoDescriptor: number[]; // Float32Array converted to array for storage
    photo?: string; // Base64 captured image
    matricule?: string;
    phone?: string;
    role: 'admin' | 'employee';
    isKiosk: boolean;
    hasCustomSchedule?: boolean;
    schedule?: Schedule;
    adminId?: string;
    assignedZoneId?: string;
}

export interface Zone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number; // in meters
    adminId?: string;
}

export interface AttendanceLog {
    id: string;
    employeeId: string;
    timestamp: string;
    type: 'check-in' | 'check-out';
    location: {
        lat: number;
        lng: number;
    };
    verified: boolean;
    method: 'face_geo' | 'manual_admin';
    zoneName?: string;
    adminId?: string;
}

export interface AdminUser {
    id: string;
    email: string;
    phone: string;
    username: string;
    password?: string; // Only used during login/register, not stored in state
    name: string;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    suspended?: boolean;
}
