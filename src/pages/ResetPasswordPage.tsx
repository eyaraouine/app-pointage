import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <ShieldAlert className="text-red-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Lien obsolète</h2>
                <p className="text-gray-500 mb-8">
                    Ce lien de réinitialisation est ancien et n'est plus sécurisé. <br /><br />
                    Veuillez utiliser le **lien officiel** que Google vous a envoyé par email (expéditeur : Firebase / Google).
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                    <ArrowLeft size={18} /> Retour à la connexion
                </Link>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
