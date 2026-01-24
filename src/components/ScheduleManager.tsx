import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import type { Schedule, ScheduleModality } from '../types';

interface ScheduleManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (schedule: Schedule) => void;
    initialSchedule: Schedule | null;
    title: string;
}

const DAYS = [
    { key: 'monday', label: 'L' },
    { key: 'tuesday', label: 'M' },
    { key: 'wednesday', label: 'M' },
    { key: 'thursday', label: 'J' },
    { key: 'friday', label: 'V' },
    { key: 'saturday', label: 'S' },
    { key: 'sunday', label: 'D' },
] as const;

const dayNamesFR: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
};

const ScheduleManager: React.FC<ScheduleManagerProps> = (props) => {
    const { isOpen, onClose, onSave, initialSchedule, title } = props;

    const [name, setName] = useState('Planning de travail par défaut');
    const [modality, setModality] = useState<ScheduleModality>('fixed');
    const [totalWeeklyHours, setTotalWeeklyHours] = useState<number>(0);
    const [workingDays, setWorkingDays] = useState<Schedule['workingDays']>({
        monday: { isActive: true, start: '09:00', end: '17:00', duration: 8 },
        tuesday: { isActive: true, start: '09:00', end: '17:00', duration: 8 },
        wednesday: { isActive: true, start: '09:00', end: '17:00', duration: 8 },
        thursday: { isActive: true, start: '09:00', end: '17:00', duration: 8 },
        friday: { isActive: true, start: '09:00', end: '17:00', duration: 8 },
        saturday: { isActive: false, start: '09:00', end: '17:00', duration: 8 },
        sunday: { isActive: false, start: '09:00', end: '17:00', duration: 8 },
    });

    useEffect(() => {
        if (initialSchedule && isOpen) {
            setName(initialSchedule.name || 'Planning de travail par défaut');
            setModality(initialSchedule.modality);
            setWorkingDays(initialSchedule.workingDays);
            setTotalWeeklyHours(initialSchedule.totalWeeklyHours || 0);
        }
    }, [initialSchedule, isOpen]);

    if (!isOpen) return null;

    const toggleDay = (dayKey: keyof Schedule['workingDays']) => {
        setWorkingDays(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], isActive: !prev[dayKey].isActive }
        }));
    };

    const updateTimeValue = (dayKey: keyof Schedule['workingDays'], field: 'start' | 'end' | 'duration', value: string | number) => {
        setWorkingDays(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value }
        }));
    };

    const handleSaveClick = () => {
        onSave({ name, modality, workingDays, totalWeeklyHours });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} className="text-gray-600" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800">{title || "Modifier le planning"}</h2>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Info size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Nom */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Nom</h3>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom du planning"
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all shadow-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Planifiez votre travail en fixant les horaires de travail, les heures de pause et les règles relatives aux heures supplémentaires de votre entreprise.
                        </p>
                    </div>

                    {/* Modalités */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Modalités de travail</h3>
                        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                            {(['fixed', 'flexible', 'weekly'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModality(m)}
                                    className={`flex-1 py-4 rounded-xl text-sm font-bold transition-all ${modality === m
                                        ? 'bg-white text-orange-600 shadow-md border border-orange-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {m === 'fixed' ? 'Fixé' : m === 'flexible' ? 'Flexible' : 'Hebdomadaire'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Jours ouvrables */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Jours ouvrables</h3>
                        <div className="flex justify-between gap-2">
                            {DAYS.map((day) => (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key as any)}
                                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg border-2 transition-all ${workingDays[day.key as keyof Schedule['workingDays']].isActive
                                        ? 'bg-orange-50 border-orange-400 text-orange-600'
                                        : 'bg-white border-gray-100 text-gray-400 font-medium'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contenu dynamique par modalilité */}
                    <div className="space-y-4 pt-2">
                        {modality === 'weekly' ? (
                            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 animate-in zoom-in-95 duration-200">
                                <span className="font-bold text-gray-700">Heures</span>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={totalWeeklyHours}
                                        onChange={(e) => setTotalWeeklyHours(Number(e.target.value))}
                                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-center font-bold text-orange-700 focus:ring-2 focus:ring-orange-500 outline-none w-28 shadow-sm"
                                    />
                                    <span className="text-gray-500 font-bold">h 00m</span>
                                </div>
                            </div>
                        ) : (
                            DAYS.map((day) => {
                                const dayData = workingDays[day.key as keyof Schedule['workingDays']];
                                if (!dayData.isActive) return null;

                                return (
                                    <div key={day.key} className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                                        <span className="font-bold text-gray-700 min-w-[100px]">{dayNamesFR[day.key]}</span>

                                        {modality === 'fixed' ? (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="time"
                                                    value={dayData.start}
                                                    onChange={(e) => updateTimeValue(day.key as any, 'start', e.target.value)}
                                                    className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none w-32 shadow-sm"
                                                />
                                                <span className="text-gray-400 font-bold">à</span>
                                                <input
                                                    type="time"
                                                    value={dayData.end}
                                                    onChange={(e) => updateTimeValue(day.key as any, 'end', e.target.value)}
                                                    className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none w-32 shadow-sm"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="number"
                                                    value={dayData.duration}
                                                    onChange={(e) => updateTimeValue(day.key as any, 'duration', Number(e.target.value))}
                                                    className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-center font-bold text-orange-700 focus:ring-2 focus:ring-orange-500 outline-none w-24 shadow-sm"
                                                />
                                                <span className="text-gray-500 font-bold text-sm uppercase tracking-tight">heures</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0 z-10">
                    <button
                        onClick={handleSaveClick}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold py-5 rounded-2xl shadow-lg transition-all active:scale-95 text-lg"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
