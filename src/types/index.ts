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
}

export interface Zone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number; // in meters
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
}

export interface AdminUser {
    id: string;
    email: string;
    phone: string;
    username: string;
    password?: string; // Only used during login/register, not stored in state
    name: string;
}
