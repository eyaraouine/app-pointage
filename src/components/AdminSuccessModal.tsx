import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface AdminSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeName: string;
}

const AdminSuccessModal: React.FC<AdminSuccessModalProps> = ({ isOpen, onClose, employeeName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-green-900 border-2 border-amber-400 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl transform scale-100 transition-all">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-green-800 rounded-full flex items-center justify-center mb-6 border border-amber-400/30 shadow-inner">
                        <ShieldCheck size={40} className="text-amber-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                        Accès Administrateur Activé
                    </h2>

                    <div className="w-16 h-1 bg-amber-400 rounded-full mb-6"></div>

                    <p className="text-green-100 mb-8 leading-relaxed">
                        Identité confirmée : <span className="font-bold text-amber-300">{employeeName}</span>.
                        <br />
                        Vous disposez désormais des droits de gestion sur cette borne de pointage.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-green-950 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95"
                    >
                        Accéder au panneau de contrôle
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSuccessModal;
