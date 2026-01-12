import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { AdminUser } from '../types';
import { Search, ShieldOff, ShieldCheck, LogIn, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InstanceManagement: React.FC = () => {
    const { getAllAdmins, toggleAdminSuspend, impersonateAdmin } = useStore();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        const data = await getAllAdmins();
        // Filter out the super admin accounts themselves usually, or keep them visible but disabled
        setAdmins(data.filter(a => a.role !== 'SUPER_ADMIN'));
        setLoading(false);
    };

    const handleSuspend = async (admin: AdminUser) => {
        if (!confirm(admin.suspended ? "Réactiver ce compte ?" : "Suspendre ce compte ?")) return;

        await toggleAdminSuspend(admin.id, !admin.suspended);
        await loadAdmins(); // Reload to see changes
    };

    const handleImpersonate = async (admin: AdminUser) => {
        if (admin.suspended) {
            alert("Impossible d'accéder à un compte suspendu.");
            return;
        }
        await impersonateAdmin(admin.id);
        navigate('/admin/employees'); // Redirect to their dashboard
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Instances</h1>
                    <p className="text-gray-500">Administrez les sociétés inscrites sur Hodour</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une société..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                    />
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Société / Admin</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Contact</th>
                                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Statut</th>
                                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">Chargement des instances...</td>
                                </tr>
                            ) : filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-500">Aucune société trouvée.</td>
                                </tr>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{admin.name}</div>
                                                    <div className="text-xs text-gray-500 text-mono">{admin.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm text-gray-900">{admin.email}</div>
                                            <div className="text-xs text-gray-500">{admin.phone}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.suspended
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {admin.suspended ? 'Suspendu' : 'Actif'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleImpersonate(admin)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                                    title="Accéder au tableau de bord (Impersonate)"
                                                >
                                                    <LogIn size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleSuspend(admin)}
                                                    className={`p-2 rounded-lg transition-colors ${admin.suspended
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-amber-600 hover:bg-amber-50'
                                                        }`}
                                                    title={admin.suspended ? "Réactiver" : "Suspendre"}
                                                >
                                                    {admin.suspended ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InstanceManagement;
