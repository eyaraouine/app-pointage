import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import type { Schedule, ScheduleModality } from '../types';

// Simple class merger to avoid clsx dependency
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

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

    const [name, setName] = useState('Planning par défaut');
    const [modality, setModality] = useState<ScheduleModality>('fixed');
    const [totalWeeklyHours, setTotalWeeklyHours] = useState<number>(40);
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
            setName(initialSchedule.name || 'Planning par défaut');
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-500">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95"
                        >
                            <X size={22} className="text-gray-500" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title || "Gestion du Planning"}</h2>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Configuration Horaire</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Nom du Planning */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Calendar size={14} className="text-blue-500" />
                            Nom du planning
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Horaire Standard, Équipe de Nuit..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-gray-800 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>

                    {/* Modalités */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Clock size={14} className="text-blue-500" />
                            Type de planification
                        </label>
                        <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
                            {(['fixed', 'flexible', 'weekly'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModality(m)}
                                    className={cn(
                                        "py-3 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-tight",
                                        modality === m
                                            ? 'bg-white text-blue-600 shadow-sm border border-gray-100 scale-[1.02]'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    )}
                                >
                                    {m === 'fixed' ? 'Fixé' : m === 'flexible' ? 'Flexible' : 'Hebdo'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Jours actifs */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Calendar size={14} className="text-blue-500" />
                            Jours de travail
                        </label>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 gap-2 overflow-x-auto no-scrollbar pt-5">
                            {DAYS.map((day) => (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key as any)}
                                    className={cn(
                                        "min-w-10 min-h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all relative",
                                        workingDays[day.key as keyof Schedule['workingDays']].isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                                            : 'bg-white border border-gray-200 text-gray-400 hover:border-blue-300'
                                    )}
                                >
                                    {day.label}
                                    {workingDays[day.key as keyof Schedule['workingDays']].isActive && (
                                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                            <CheckCircle2 size={10} className="text-blue-600" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Horaires Détaillés */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Clock size={14} className="text-blue-500" />
                            Détails des sessions
                        </label>

                        <div className="space-y-3 pt-2">
                            {modality === 'weekly' ? (
                                <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100 animate-in zoom-in-95 duration-200">
                                    <span className="font-black text-gray-700">Total Semaine</span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={totalWeeklyHours}
                                            onChange={(e) => setTotalWeeklyHours(Number(e.target.value))}
                                            className="bg-white border border-blue-200 rounded-2xl px-4 py-3 text-center font-black text-blue-700 focus:ring-4 focus:ring-blue-500/10 outline-none w-24 shadow-sm"
                                        />
                                        <span className="text-blue-600 font-bold text-sm">heures</span>
                                    </div>
                                </div>
                            ) : (
                                DAYS.map((day) => {
                                    const dayData = workingDays[day.key as keyof Schedule['workingDays']];
                                    if (!dayData.isActive) return null;

                                    return (
                                        <div key={day.key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-right-4 duration-300">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <span className="font-bold text-gray-800 sm:min-w-[100px] border-l-4 border-blue-500 pl-3">{dayNamesFR[day.key]}</span>

                                                {modality === 'fixed' ? (
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="flex-1 sm:flex-none">
                                                            <input
                                                                type="time"
                                                                value={dayData.start}
                                                                onChange={(e) => updateTimeValue(day.key as any, 'start', e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                                                            />
                                                        </div>
                                                        <span className="text-gray-400 text-xs font-bold px-1">à</span>
                                                        <div className="flex-1 sm:flex-none">
                                                            <input
                                                                type="time"
                                                                value={dayData.end}
                                                                onChange={(e) => updateTimeValue(day.key as any, 'end', e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={dayData.duration}
                                                            onChange={(e) => updateTimeValue(day.key as any, 'duration', Number(e.target.value))}
                                                            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-center font-black text-blue-600 outline-none focus:border-blue-500 w-20"
                                                        />
                                                        <span className="text-gray-500 font-bold text-[10px] uppercase">heures / jour</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] sticky bottom-0 z-10">
                    <button
                        onClick={handleSaveClick}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg group"
                    >
                        <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                        Confirmer le Planning
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-medium mt-4">Les modifications seront appliquées immédiatement.</p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
