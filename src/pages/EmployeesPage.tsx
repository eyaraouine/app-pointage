import React, { useState } from 'react';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeList from '../components/EmployeeList';
import { Plus, X, Calendar } from 'lucide-react';
import ScheduleManager from '../components/ScheduleManager';
import { useStore } from '../context/StoreContext';

import type { Employee } from '../types';

const EmployeesPage: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleEmployee, setScheduleEmployee] = useState<Employee | null>(null);
    const { globalSchedule, updateGlobalSchedule, updateEmployee } = useStore();

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {editingEmployee ? 'Modifier l\'Employé' : 'Gestion des Employés'}
                </h2>
                <div className="flex gap-2">
                    {!showForm && (
                        <button
                            onClick={() => {
                                setScheduleEmployee(null);
                                setShowScheduleModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-200 transition-all font-semibold shadow-sm active:scale-95"
                        >
                            <Calendar size={20} />
                            Planning Global
                        </button>
                    )}
                    <button
                        onClick={showForm ? handleCancel : () => setShowForm(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold shadow-md active:scale-95 ${showForm
                                ? 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
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
            </div>

            {showForm ? (
                <div className="mb-8 animate-in slide-in-from-top duration-300">
                    <EmployeeForm
                        employeeToEdit={editingEmployee || undefined}
                        onSuccess={() => {
                            setShowForm(false);
                            setEditingEmployee(null);
                        }}
                    />
                </div>
            ) : (
                <div className="animate-in fade-in duration-500">
                    <EmployeeList
                        onEdit={handleEdit}
                        onSetSchedule={(emp) => {
                            setScheduleEmployee(emp);
                            setShowScheduleModal(true);
                        }}
                    />
                </div>
            )}

            <ScheduleManager
                isOpen={showScheduleModal}
                onClose={() => {
                    setShowScheduleModal(false);
                    setScheduleEmployee(null);
                }}
                title={scheduleEmployee ? `Planning : ${scheduleEmployee.firstName}` : "Définir le planning global"}
                initialSchedule={scheduleEmployee ? (scheduleEmployee.schedule || globalSchedule) : globalSchedule}
                onSave={async (schedule) => {
                    if (scheduleEmployee) {
                        await updateEmployee({
                            ...scheduleEmployee,
                            schedule,
                            hasCustomSchedule: true
                        });
                    } else {
                        await updateGlobalSchedule(schedule);
                    }
                    setShowScheduleModal(false);
                    setScheduleEmployee(null);
                }}
            />
        </div>
    );
};

export default EmployeesPage;
