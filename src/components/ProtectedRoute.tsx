import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { adminUser, isKioskAdmin } = useStore();
    const location = useLocation();

    // Fallback: Check localStorage directly to avoid race conditions with Context on reload
    const storedAuth = localStorage.getItem('User_Access_Level') === 'ADMIN_MASTER';

    if (!adminUser && !isKioskAdmin && !storedAuth) {
        // Redirect to login but save the current location to return after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
