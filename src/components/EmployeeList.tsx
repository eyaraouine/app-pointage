import React from 'react';
import { useStore } from '../context/StoreContext';
import { User, Trash2, Hash, Pencil, Settings, CalendarCheck } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeListProps {
    onEdit: (employee: Employee) => void;
    onSetSchedule: (employee: Employee) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ onEdit, onSetSchedule }) => {
    const { employees, deleteEmployee } = useStore();

    if (employees.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                Aucun employé enregistré.
            </div>
        );
    }

    const sortedEmployees = [...employees].sort((a, b) => {
        // Sort by isKiosk (true first), then by name
        if (a.isKiosk === b.isKiosk) {
            return a.firstName.localeCompare(b.firstName);
        }
        return a.isKiosk ? -1 : 1;
    });

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedEmployees.map((employee) => (
                <div key={employee.id} className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 border-2 border-blue-50">
                        {employee.photo ? (
                            <img src={employee.photo} alt={`${employee.firstName} ${employee.lastName}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="text-blue-600" size={24} />
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg">{employee.firstName} {employee.lastName}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {employee.isKiosk && (
                                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                    Borne
                                </span>
                            )}
                            {employee.matricule && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Hash size={10} />
                                    {employee.matricule}
                                </span>
                            )}
                            {employee.hasCustomSchedule && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold border border-blue-100">
                                    <CalendarCheck size={10} />
                                    PLANNING SPÉCIFIQUE
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                        <button
                            onClick={() => onSetSchedule(employee)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Planning spécifique"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => onEdit(employee)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Modifier l'employé"
                        >
                            <Pencil size={20} />
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm(`Voulez-vous vraiment supprimer l'employé ${employee.firstName} ${employee.lastName} ?`)) {
                                    deleteEmployee(employee.id);
                                }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer l'employé"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EmployeeList;
