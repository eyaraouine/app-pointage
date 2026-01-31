import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import type { Schedule, ScheduleModality } from '../types';

// Simple class merger for premium styling
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
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] animate-slide-up sm:animate-in sm:zoom-in-95 duration-300 border-t border-gray-100">
                {/* Header Style aligned with App Header */}
                <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90 text-gray-400 hover:text-gray-900"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">{title || "Planning"}</h2>
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-md uppercase tracking-tighter">v1.2</span>
                            </div>
                            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-0.5 opacity-80">Configuration Horaire</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar pb-10">
                    {/* Input Field Premium Style */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2.5 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Calendar size={14} className="text-blue-500" />
                            identification du planning
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Bureau, Équipe de Nuit..."
                                className="w-full bg-gray-50 border-2 border-transparent rounded-[1.25rem] px-6 py-5 text-gray-900 font-bold focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-inner"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-100 group-focus-within:text-blue-500 transition-colors">
                                <Pencil size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Modality Toggle Premium */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2.5 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Clock size={14} className="text-blue-500" />
                            mode de planification
                        </label>
                        <div className="flex gap-2 p-2 bg-gray-50/80 rounded-[1.5rem] border border-gray-100 backdrop-blur-sm">
                            {(['fixed', 'flexible', 'weekly'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModality(m)}
                                    className={cn(
                                        "flex-1 py-4 rounded-2xl text-[11px] font-black transition-all duration-300 uppercase tracking-tighter",
                                        modality === m
                                            ? 'bg-white text-blue-600 shadow-lg shadow-gray-200/50 border border-gray-100 scale-[1.03]'
                                            : 'text-gray-400 hover:text-gray-600'
                                    )}
                                >
                                    {m === 'fixed' ? 'Heures Fixes' : m === 'flexible' ? 'Flexible' : 'Hebdo'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Selection Grid */}
                    <div className="space-y-5">
                        <label className="flex items-center gap-2.5 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Calendar size={14} className="text-blue-500" />
                            jours d'activité
                        </label>
                        <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                            {DAYS.map((day) => (
                                <button
                                    key={day.key}
                                    onClick={() => toggleDay(day.key as any)}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group overflow-hidden border",
                                        workingDays[day.key as keyof Schedule['workingDays']].isActive
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 active:scale-90 scale-105 z-10'
                                            : 'bg-white border-gray-200 text-gray-400 hover:border-blue-200 hover:bg-blue-50/30'
                                    )}
                                >
                                    <span className="text-xs font-black uppercase">{day.label}</span>
                                    {workingDays[day.key as keyof Schedule['workingDays']].isActive && (
                                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Days Details */}
                    <div className="space-y-4 pt-4">
                        <label className="flex items-center gap-2.5 text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            <Clock size={14} className="text-blue-500" />
                            détails des horaires
                        </label>

                        <div className="space-y-4">
                            {modality === 'weekly' ? (
                                <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white flex items-center justify-between shadow-2xl shadow-blue-200 border-4 border-white animate-in zoom-in-95 duration-500">
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Quota hebdomadaire</p>
                                        <p className="text-lg font-black tracking-tight">Total Heures</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={totalWeeklyHours}
                                            onChange={(e) => setTotalWeeklyHours(Number(e.target.value))}
                                            className="bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-2xl px-5 py-4 text-center font-black text-2xl text-white focus:border-white focus:bg-white/20 outline-none w-28 transition-all"
                                        />
                                        <span className="font-black text-xs uppercase tracking-tighter">Hrs</span>
                                    </div>
                                </div>
                            ) : (
                                DAYS.map((day) => {
                                    const dayData = workingDays[day.key as keyof Schedule['workingDays']];
                                    if (!dayData.isActive) return null;

                                    return (
                                        <div key={day.key} className="p-5 bg-white rounded-[1.75rem] border-2 border-gray-50 shadow-sm hover:shadow-md transition-all animate-in slide-in-from-right-10 duration-500">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                                                    <span className="font-black text-gray-900 text-sm">{dayNamesFR[day.key]}</span>
                                                </div>

                                                {modality === 'fixed' ? (
                                                    <div className="flex items-center gap-3 w-full sm:w-auto p-1 bg-gray-50 rounded-2xl">
                                                        <input
                                                            type="time"
                                                            value={dayData.start}
                                                            onChange={(e) => updateTimeValue(day.key as any, 'start', e.target.value)}
                                                            className="flex-1 sm:w-28 bg-white border border-transparent rounded-xl px-4 py-2.5 text-sm font-black text-gray-800 outline-none focus:border-blue-500 transition-all shadow-sm"
                                                        />
                                                        <span className="text-gray-300 font-black text-[10px] uppercase">à</span>
                                                        <input
                                                            type="time"
                                                            value={dayData.end}
                                                            onChange={(e) => updateTimeValue(day.key as any, 'end', e.target.value)}
                                                            className="flex-1 sm:w-28 bg-white border border-transparent rounded-xl px-4 py-2.5 text-sm font-black text-gray-800 outline-none focus:border-blue-500 transition-all shadow-sm"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl">
                                                        <input
                                                            type="number"
                                                            value={dayData.duration}
                                                            onChange={(e) => updateTimeValue(day.key as any, 'duration', Number(e.target.value))}
                                                            className="w-20 bg-white border border-transparent rounded-xl px-2 py-2.5 text-center font-black text-blue-600 outline-none focus:border-blue-500 shadow-sm"
                                                        />
                                                        <span className="text-gray-400 font-bold text-[9px] uppercase tracking-tighter pr-4">heures / jour</span>
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

                {/* Confirm Action Button */}
                <div className="p-8 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
                    <button
                        onClick={handleSaveClick}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-[1.5rem] shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] transition-all hover:translate-y-[-2px] active:scale-[0.98] flex items-center justify-center gap-4 text-xl group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <CheckCircle2 size={28} className="transition-transform group-hover:scale-110" />
                        Confirmer les réglages
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 opacity-60">Synchronisation cloud sécurisée</p>
                </div>
            </div>
        </div>
    );
};

// Internal icon component to avoid extra imports
const Pencil: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);

export default ScheduleManager;
