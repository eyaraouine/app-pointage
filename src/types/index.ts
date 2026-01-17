export type ScheduleModality = 'fixed' | 'flexible' | 'weekly';

export interface DaySchedule {
    isActive: boolean;
    start: string;
    end: string;
    duration?: number;
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
    totalWeeklyHours?: number;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    photoDescriptor: number[];
    photo?: string;
    photoURL?: string;
    matricule?: string;
    phone?: string;
    role: 'admin' | 'employee';
    isKiosk: boolean;
    hasCustomSchedule?: boolean;
    schedule?: Schedule;
    adminId?: string;
}

export interface Zone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    adminId: string;
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
    adminId?: string;
    method: 'face_geo' | 'manual_admin';
    zoneName?: string;
}

export interface AdminUser {
    id: string;
    email: string;
    phone: string;
    username: string;
    password?: string;
    name: string;
    role?: 'ADMIN' | 'SUPER_ADMIN';
    suspended?: boolean;
}
