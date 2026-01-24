import React, { useState, useEffect } from 'react';
import { X, Info, ArrowRight } from 'lucide-react';
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
    const [activeDayKey, setActiveDayKey] = useState<keyof Schedule['workingDays']>('monday');

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
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                {/* Compact Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                            <X size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 leading-none">{title || "Planning Global"}</h2>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-tight">Configuration des horaires d'entreprise</p>
                        </div>
                    </div>
                    <button className="p-2 text-blue-500 bg-blue-50 rounded-full transition-colors">
                        <Info size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                    {/* Nom du Planning Section */}
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom du planning..."
                            className="w-full bg-gray-50/50 border-none rounded-2xl px-5 py-3.5 text-gray-800 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>

                    {/* Segmented Control for Modality */}
                    <div className="space-y-4">
                        <div className="flex p-1.5 bg-gray-100/80 rounded-2xl relative">
                            {(['fixed', 'flexible', 'weekly'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModality(m)}
                                    className={`relative z-10 flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${modality === m
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {m === 'fixed' ? 'FIXÉ' : m === 'flexible' ? 'FLEXIBLE' : 'HEBDO'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compact Day Selection Bar */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-[1.5rem] border border-gray-100">
                            {DAYS.map((day) => {
                                const isSelected = activeDayKey === day.key;
                                const isWorking = workingDays[day.key as keyof Schedule['workingDays']].isActive;
                                return (
                                    <button
                                        key={day.key}
                                        onClick={() => setActiveDayKey(day.key as any)}
                                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${isSelected
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-110 z-10'
                                            : isWorking
                                                ? 'bg-white text-orange-600 border border-orange-100'
                                                : 'text-gray-300 hover:text-gray-400'
                                            }`}
                                    >
                                        {day.label}
                                        {isWorking && !isSelected && (
                                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-400 rounded-full border-2 border-white"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Accordion Detail Card */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {modality === 'weekly' ? (
                            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col items-center gap-4 border-l-4 border-l-orange-500">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Quota Hebdomadaire</h4>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={totalWeeklyHours}
                                        onChange={(e) => setTotalWeeklyHours(Number(e.target.value))}
                                        className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-center font-black text-3xl text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none w-32"
                                    />
                                    <span className="text-gray-300 font-black text-xl italic uppercase">heures</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {DAYS.map((day) => {
                                    if (day.key !== activeDayKey) return null;
                                    const dayKey = day.key as keyof Schedule['workingDays'];
                                    const dayData = workingDays[dayKey];

                                    return (
                                        <div key={day.key} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group border-l-4 border-l-orange-500">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">
                                                        {day.label}
                                                    </div>
                                                    <h4 className="font-black text-lg text-gray-800">{dayNamesFR[day.key]}</h4>
                                                </div>
                                                <button
                                                    onClick={() => toggleDay(dayKey)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${dayData.isActive
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-gray-100 text-gray-400'
                                                        }`}
                                                >
                                                    {dayData.isActive ? 'OUVRABLE' : 'CHÔMÉ'}
                                                </button>
                                            </div>

                                            {dayData.isActive ? (
                                                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Début</label>
                                                        <input
                                                            type="time"
                                                            value={dayData.start}
                                                            onChange={(e) => updateTimeValue(dayKey, 'start', e.target.value)}
                                                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-black text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Fin</label>
                                                        <input
                                                            type="time"
                                                            value={dayData.end}
                                                            onChange={(e) => updateTimeValue(dayKey, 'end', e.target.value)}
                                                            className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-black text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                                                        />
                                                    </div>
                                                    {modality === 'flexible' && (
                                                        <div className="col-span-2 space-y-2">
                                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">Durée cible</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    value={dayData.duration}
                                                                    onChange={(e) => updateTimeValue(dayKey, 'duration', Number(e.target.value))}
                                                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-black text-orange-600 focus:ring-2 focus:ring-orange-500 outline-none text-xl"
                                                                />
                                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300 uppercase">HEURES</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 text-gray-300 font-medium italic text-sm">
                                                    Aucun horaire nécessaire pour ce jour chômé.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Action Button with Gradient */}
                <div className="p-6 bg-white sticky bottom-0 z-20">
                    <div className="absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                    <button
                        onClick={handleSaveClick}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-orange-200 transition-all active:scale-95 text-lg tracking-tight flex items-center justify-center gap-2 group"
                    >
                        ENREGISTRER LE PLANNING
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
