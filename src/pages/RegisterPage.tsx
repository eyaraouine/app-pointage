import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const countries = [
    { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
    { code: '+212', flag: '🇲🇦', name: 'Maroc' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+213', flag: '🇩🇿', name: 'Algérie' },
    { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
    { code: '+225', flag: '🇮🇨', name: 'Côte d\'Ivoire' },
    { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
    { code: '+241', flag: '🇬🇦', name: 'Gabon' },
    { code: '+242', flag: '🇨🇬', name: 'Congo' },
    { code: '+243', flag: '🇨🇩', name: 'RDC' },
];

const RegisterPage: React.FC = () => {
    const { registerAdmin, hasAdmin } = useStore();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+216');
    const [phone, setPhone] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setLoading(true);
        try {
            await registerAdmin({
                id: '', // Will be set by Firebase Auth UID
                name,
                email,
                phone: `${countryCode}${phone}`,
                username,
            }, password);

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/employees');
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <UserPlus className="text-blue-600" size={36} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Créer un compte Admin</h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">
                        {hasAdmin ? "Ajouter un nouvel administrateur" : "Configuration du Super Admin"}
                    </p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center py-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <CheckCircle className="text-green-600" size={56} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800">Compte créé !</h3>
                        <p className="text-gray-500 mt-2 font-medium">Redirection vers le tableau de bord...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Login (Utilisateur)</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                placeholder="admin_user"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Nom complet</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                placeholder="Jean Dupont"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                placeholder="admin@exemple.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Numéro WhatsApp</label>
                            <div className="flex gap-2">
                                <div className="relative min-w-[100px]">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full appearance-none bg-gray-50/50 border border-gray-200 rounded-2xl px-3 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none shadow-sm cursor-pointer font-bold text-gray-700 h-full"
                                    >
                                        {countries.map(c => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                                    className="flex-1 min-w-0 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                    placeholder="6 12 34 56 78"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Confirmer le mot de passe</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all outline-none shadow-sm text-gray-800 font-semibold"
                                    placeholder="••••••••"
                                    required
                                />
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
                            {loading ? "Création du compte..." : "S'inscrire"}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Déjà un compte ?{' '}
                            <Link to="/login" className="text-blue-600 font-bold hover:underline">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default RegisterPage;
