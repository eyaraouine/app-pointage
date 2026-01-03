import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const { resetPassword } = useStore();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError("Lien invalide ou expiré.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        const ok = await resetPassword(email, password);
        if (ok) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError("Une erreur est survenue. L'email n'est peut-être pas reconnu.");
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Nouveau mot de passe</h2>
                    <p className="text-gray-500 text-sm text-center mt-2">
                        Définissez votre nouveau mot de passe pour <strong>{email}</strong>
                    </p>
                </div>

                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Mot de passe modifié !</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Votre mot de passe a été mis à jour avec succès. Redirection vers la connexion...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                            Enregistrer le mot de passe
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
