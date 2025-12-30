import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import emailjs from '@emailjs/browser';

// CONFIGURATION EMAILJS
// Vous devez créer un compte sur https://www.emailjs.com/
// Puis remplacer ces valeurs par les vôtres :
const EMAILJS_SERVICE_ID = "service_h2084is"; // Exemple: service_xxxx
const EMAILJS_TEMPLATE_ID = "template_w28in2r"; // Exemple: template_xxxx
const EMAILJS_PUBLIC_KEY = "JB3dbnW1P6m3YWZEY"; // Exemple: user_xxxx

const ForgotPasswordPage: React.FC = () => {
    const { findAdminByPhone } = useStore();
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const admin = findAdminByPhone(phone);

        if (!admin) {
            setError("Aucun compte administrateur trouvé avec ce numéro de téléphone.");
            setLoading(false);
            return;
        }

        setEmail(admin.email);

        try {
            // Envoi réel via EmailJS
            const templateParams = {
                to_email: admin.email,
                to_name: admin.name,
                reset_link: `${window.location.origin}/reset-password?email=${encodeURIComponent(admin.email)}`,
                phone: admin.phone,
                username: admin.username
            };

            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams,
                EMAILJS_PUBLIC_KEY
            );

            setSubmitted(true);
        } catch (err: any) {
            console.error("Erreur EmailJS:", err);
            const detail = err?.text || err?.message || "Erreur inconnue";
            setError(`Impossible d'envoyer l'email : ${detail}. Vérifiez votre configuration EmailJS.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="text-blue-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Récupération</h2>
                    <p className="text-gray-500 text-sm text-center mt-2">
                        Saisissez votre numéro de téléphone pour recevoir un lien de réinitialisation par email.
                    </p>
                </div>

                {submitted ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <CheckCircle className="text-green-600" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Email envoyé !</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Un lien de réinitialisation a été envoyé à l'adresse associée : <br />
                            <strong className="text-gray-700">{email}</strong>
                        </p>

                        <Link to="/login" className="text-blue-600 font-bold flex items-center justify-center gap-2 hover:underline">
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    placeholder="22 123 456"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                                <AlertCircle className="mt-0.5 flex-shrink-0" size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Envoi en cours...
                                </>
                            ) : (
                                "Envoyer le lien"
                            )}
                        </button>

                        <Link to="/login" className="text-gray-500 font-medium flex items-center justify-center gap-2 hover:text-blue-600 transition-colors">
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </form>
                )}
            </div>

            <div className="mt-8 max-w-md text-center">
                <p className="text-xs text-gray-400">
                    Note: L'email sera envoyé à l'adresse enregistrée lors de votre inscription (noreply).
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
