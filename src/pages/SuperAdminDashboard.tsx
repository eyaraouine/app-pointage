import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Users, Building2, Server, Settings, Activity } from 'lucide-react';
import MonitoringSection from '../components/MonitoringSection';

const SuperAdminDashboard: React.FC = () => {
    const { employees, getAllAdmins, modelsLoaded } = useStore();
    const [adminCount, setAdminCount] = useState(0);

    useEffect(() => {
        const fetchAdmins = async () => {
            const admins = await getAllAdmins();
            setAdminCount(admins.length);
        };
        fetchAdmins();
    }, [getAllAdmins]);

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Super Admin</h1>
                <p className="text-gray-500">Vue d'ensemble de l'écosystème Hodour</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl text-blue-600">
                        <Users size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Utilisateurs Actifs</p>
                        <h3 className="text-3xl font-bold text-gray-900">{employees.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 rounded-xl text-purple-600">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Sociétés Inscrites</p>
                        <h3 className="text-3xl font-bold text-gray-900">{adminCount}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`p-4 rounded-xl ${modelsLoaded ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        <Server size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Serveur IA (Reconnaissance)</p>
                        <h3 className={`text-xl font-bold ${modelsLoaded ? 'text-green-600' : 'text-red-600'}`}>
                            {modelsLoaded ? 'Opérationnel' : 'Hors Ligne'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Monitoring Section */}
            <MonitoringSection />

            {/* Maintenance Section */}
            <section className="bg-gray-900 text-white rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-16 -mt-16"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Activity className="text-blue-400" />
                            <h2 className="text-xl font-bold">Mode Maintenance</h2>
                        </div>
                        <p className="text-gray-400 max-w-lg">
                            Modifiez les paramètres structurels de l'application, comme les zones de géolocalisation par défaut ou les seuils d'alertes globaux.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                        <Settings size={20} />
                        Configurer les Paramètres
                    </button>
                </div>
            </section>
        </div>
    );
};

export default SuperAdminDashboard;
