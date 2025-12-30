import React, { useState } from 'react';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeList from '../components/EmployeeList';
import { Plus, X } from 'lucide-react';

const EmployeesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Gestion des Employés</h2>
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
                    <EmployeeForm onSuccess={() => setShowForm(false)} />
                </div>
            ) : (
                <EmployeeList />
            )}
        </div>
    );
};

export default EmployeesPage;
