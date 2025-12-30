import React, { useState } from 'react';
import ZoneForm from '../components/ZoneForm';
import ZoneList from '../components/ZoneList';
import { Plus, X } from 'lucide-react';

const ZonesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Zones de Pointage</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                    {showForm ? (
                        <>
                            <X size={20} />
                            Annuler
                        </>
                    ) : (
                        <>
                            <Plus size={20} />
                            Ajouter
                        </>
                    )}
                </button>
            </div>

            {showForm ? (
                <div className="mb-8">
                    <ZoneForm onSuccess={() => setShowForm(false)} />
                </div>
            ) : (
                <ZoneList />
            )}
        </div>
    );
};

export default ZonesPage;
