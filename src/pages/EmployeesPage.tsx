import React, { useState } from 'react';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeList from '../components/EmployeeList';
import { Plus, X } from 'lucide-react';

import type { Employee } from '../types';

const EmployeesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingEmployee(null);
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {editingEmployee ? 'Modifier l\'Employé' : 'Gestion des Employés'}
                </h2>
                <button
                    onClick={showForm ? handleCancel : () => setShowForm(true)}
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
                    <EmployeeForm
                        employeeToEdit={editingEmployee || undefined}
                        onSuccess={() => {
                            setShowForm(false);
                            setEditingEmployee(null);
                        }}
                    />
                </div>
            ) : (
                <EmployeeList onEdit={handleEdit} />
            )}
        </div>
    );
};

export default EmployeesPage;
