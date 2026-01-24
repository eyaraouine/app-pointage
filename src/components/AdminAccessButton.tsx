import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AdminAccessButtonProps {
    onClick: () => void;
    isVisible: boolean;
}

const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({ onClick, isVisible }) => {
    const { t } = useLanguage();
    if (!isVisible) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all animate-bounce"
            title={t('kiosk.admin_access_button')}
        >
            <ShieldCheck size={28} />
        </button>
    );
};

export default AdminAccessButton;
