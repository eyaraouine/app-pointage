import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Users, MapPin, ClipboardList, UserCheck, LogOut, LogIn, User, House, Shield, Activity, X, BarChart2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';

const Layout: React.FC = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { adminUser, logoutAdmin, isKioskAdmin, disableKioskAdmin, superAdminSession, exitImpersonation } = useStore();
    const storedAuth = localStorage.getItem('User_Access_Level') === 'ADMIN_MASTER';
    const showAdminNav = adminUser || isKioskAdmin || storedAuth;
    const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
    const isImpersonating = !!superAdminSession;

    const navItems = [
        { path: '/home', icon: House, label: t('nav.home') },
        { path: '/', icon: UserCheck, label: t('nav.attendance') },
        ...(isSuperAdmin ? [
            { path: '/super-admin/dashboard', icon: Activity, label: t('nav.global') },
            { path: '/super-admin/instances', icon: Shield, label: t('nav.instances') },
        ] : showAdminNav ? [
            { path: '/admin/employees', icon: Users, label: t('nav.employees') },
            { path: '/admin/zones', icon: MapPin, label: t('nav.zones') },
            { path: '/admin/logs', icon: ClipboardList, label: t('nav.logs') },
            { path: '/admin/analyses', icon: BarChart2, label: t('nav.analyses') },
        ] : []),
    ];

    const handleLogout = () => {
        if (isKioskAdmin) {
            disableKioskAdmin();
        } else {
            logoutAdmin();
        }
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {isImpersonating && (
                <div className="bg-amber-500 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md">
                    <span className="flex items-center gap-2">
                        <Shield size={16} />
                        Mode Super Admin : Connecté en tant que {adminUser?.name}
                    </span>
                    <button
                        onClick={() => { exitImpersonation(); navigate('/super-admin/instances'); }}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
                    >
                        <X size={14} />
                        Quitter
                    </button>
                </div>
            )}
            <header className={clsx("text-white p-4 shadow-md z-10 flex justify-between items-center transition-all duration-500", isSuperAdmin ? "bg-gray-900" : "bg-blue-600")}>
                <h1 className="text-xl font-bold tracking-tight">Hodour</h1>
                {showAdminNav ? (
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm bg-blue-700 px-3 py-1 rounded-full">
                            <User size={14} />
                            <span className="font-medium">{adminUser ? adminUser.name : 'Borne Admin'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1 hover:bg-blue-700 rounded-full transition-colors mx-2"
                            title={t('common.logout')}
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
                            <span>{t('common.admin')}</span>
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
