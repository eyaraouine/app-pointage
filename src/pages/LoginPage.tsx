import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as any)?.from?.pathname || "/admin/employees";

    const { adminUser, isKioskAdmin, loginAdmin, hasAdmin } = useStore();
    const storedAuth = localStorage.getItem('User_Access_Level') === 'ADMIN_MASTER';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (adminUser || isKioskAdmin || storedAuth) {
            const target = adminUser?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : from;
            console.log("LoginPage: Auto-redirecting to", target);
            navigate(target, { replace: true });
        }
    }, [adminUser, isKioskAdmin, storedAuth, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const success = await loginAdmin(email, password);
            if (success) {
                const target = email.toLowerCase() === 'glorysmart.tech@gmail.com' ? '/super-admin/dashboard' : from;
                navigate(target, { replace: true });
            } else {
                setError(t('login.auth_error'));
            }
        } catch (err) {
            setError(t('login.general_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('login.title')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('login.subtitle')}</p>
                </div>

                {!hasAdmin && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
                        <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-bold text-sm">{t('login.no_admin_title')}</p>
                            <p className="text-xs mt-1">{t('login.no_admin_text')}</p>
                            <Link to="/register" className="text-xs font-bold underline mt-2 inline-block">{t('login.create_account')}</Link>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('login.email')}</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">{t('login.password')}</label>
                            <Link to="/forgot-password" title={t('login.forgot_password')} className="text-xs text-blue-600 hover:underline">
                                {t('login.forgot_password')}
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none pr-12"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('login.logging_in') : t('login.login_button')}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        {t('login.no_account')}{' '}
                        <Link to="/register" className="text-blue-600 font-bold hover:underline">
                            {t('login.register')}
                        </Link>
                    </p>
                </div>
            </div>

            <Link to="/" className="mt-8 text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <LogIn size={18} className="rotate-180" />
                {t('login.back_to_attendance')}
            </Link>
        </div>
    );
};

export default LoginPage;
