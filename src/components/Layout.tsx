import React from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Users, MapPin, ClipboardList, UserCheck, LogOut, LogIn, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import clsx from 'clsx';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { adminUser, logoutAdmin } = useStore();

    const navItems = [
        { path: '/', icon: UserCheck, label: 'Pointer' },
        ...(adminUser ? [
            { path: '/admin/employees', icon: Users, label: 'Employés' },
            { path: '/admin/zones', icon: MapPin, label: 'Zones' },
            { path: '/admin/logs', icon: ClipboardList, label: 'Historique' },
        ] : []),
    ];

    const handleLogout = () => {
        logoutAdmin();
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-blue-600 text-white p-4 shadow-md z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold">Pointage Mobile</h1>
                {adminUser ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm bg-blue-700 px-3 py-1 rounded-full">
                            <User size={14} />
                            <span className="font-medium">{adminUser.name}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
                            title="Déconnexion"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    location.pathname !== '/login' && location.pathname !== '/register' && (
                        <Link
                            to="/login"
                            className="flex items-center gap-1 text-sm bg-blue-700 px-3 py-1 rounded-full hover:bg-blue-800 transition-colors"
                        >
                            <LogIn size={14} />
                            <span>Admin</span>
                        </Link>
                    )
                )}
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-20">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-10 safe-area-bottom">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full",
                                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <Icon size={24} />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
