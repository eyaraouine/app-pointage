import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { LogIn, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { loginAdmin, hasAdmin } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const from = (location.state as any)?.from?.pathname || "/admin/employees";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const success = loginAdmin(phone, password);
        if (success) {
            navigate(from, { replace: true });
        } else {
            setError("Téléphone ou mot de passe incorrect.");
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <LogIn className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Connexion Admin</h2>
                    <p className="text-gray-500 text-sm mt-1">Accédez à l'espace d'administration</p>
                </div>

                {!hasAdmin && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
                        <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                            <p className="font-bold text-sm">Aucun compte administrateur</p>
                            <p className="text-xs mt-1">Vous devez d'abord créer un compte super admin pour accéder à ces fonctionnalités.</p>
                            <Link to="/register" className="text-xs font-bold underline mt-2 inline-block">Créer un compte</Link>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            placeholder="22 123 456"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                            <Link to="/forgot-password" title="Mot de passe oublié ?" className="text-xs text-blue-600 hover:underline">
                                Mot de passe oublié ?
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                        Se connecter
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-blue-600 font-bold hover:underline">
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>

            <Link to="/" className="mt-8 text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
                <LogIn size={18} className="rotate-180" />
                Retour au pointage
            </Link>
        </div>
    );
};

export default LoginPage;
