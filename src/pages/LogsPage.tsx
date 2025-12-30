import React from 'react';
import { useStore } from '../context/StoreContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, MapPin, User } from 'lucide-react';

const LogsPage: React.FC = () => {
    const { logs, getEmployee } = useStore();

    if (logs.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                Aucun historique de pointage.
            </div>
        );
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Historique des Pointages</h2>

            <div className="space-y-4">
                {logs.map((log) => {
                    const employee = getEmployee(log.employeeId);
                    return (
                        <div key={log.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 flex items-start gap-4">
                            <div className="bg-green-100 p-2 rounded-full mt-1">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-lg">
                                        {employee ? `${employee.firstName} ${employee.lastName}` : 'Employé inconnu'}
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        {format(new Date(log.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>
                                            {log.location.lat.toFixed(4)}, {log.location.lng.toFixed(4)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User size={16} />
                                        <span>{log.method === 'face_geo' ? 'Face ID' : 'Admin'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LogsPage;
