import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const ForgotPasswordPage: React.FC = () => {
    const { findAdminByPhone, resetPassword } = useStore();
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // v1.9.7: Timeout GLOBAL pour toute la procédure (30s)
        const globalTimeout = setTimeout(() => {
            if (loading) {
                console.error("🚨 TIMEOUT GLOBAL DÉCLENCHÉ (30s)");
                setError("La procédure est trop longue. Vérifiez votre connexion internet.");
                setLoading(false);
            }
        }, 30000);

        try {
            console.log("🔍 [Step 1] Recherche de l'admin par téléphone:", phone);
            const admin = await findAdminByPhone(phone);

            if (!admin) {
                console.log("❌ [Step 1] Aucun admin trouvé.");
                setError("Aucun compte administrateur trouvé avec ce numéro de téléphone.");
                setLoading(false);
                clearTimeout(globalTimeout);
                return;
            }

            console.log("✅ [Step 1] Admin trouvé:", admin.email);
            setEmail(admin.email);
            alert("Compte identifié !\nEmail de secours : " + admin.email + "\n\nJe demande maintenant à Google d'envoyer le lien...");

            console.log("📨 [Step 2] Déclenchement réinitialisation officielle Firebase...");
            const ok = await resetPassword(admin.email);

            if (!ok) {
                alert("❌ Erreur : Google a refusé d'envoyer l'email. Vérifiez que l'adresse " + admin.email + " est valide.");
                throw new Error("Impossible d'envoyer l'email de réinitialisation. Veuillez vérifier votre connexion.");
            }

            alert("✅ SUCCÈS : Google confirme l'envoi de l'email à : " + admin.email + "\n\n(Pensez à regarder dans vos SPAMS / Courriers indésirables)");
            console.log("✅ [Step 2] Email Firebase envoyé avec succès!");
            setSubmitted(true);
        } catch (err: any) {
            console.error("❌ Erreur Récupération:", err);
            const detail = err?.message || JSON.stringify(err) || "Erreur inconnue";
            setError(`Problème : ${detail}.`);
        } finally {
            console.log("🏁 Fin de la procédure.");
            setLoading(false);
            clearTimeout(globalTimeout);
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
                            Un email **officiel de Google** a été envoyé à : <br />
                            <strong className="text-gray-700">{email}</strong>
                            <br /><br />
                            Cliquez sur le lien dans cet email pour créer votre nouveau mot de passe.
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
                    Note: L'email sera envoyé par Firebase (Google) à l'adresse enregistrée lors de votre inscription.
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
