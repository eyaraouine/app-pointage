import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
    format,
    isSameDay,
    addDays,
    subDays,
    differenceInMinutes,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isWeekend
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Calendar, ChevronRight, Clock, MapPin, X, Info, ChevronLeft } from 'lucide-react';

const LogsPage: React.FC = () => {
    const { logs, employees } = useStore();
    const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [showMonthlyDetail, setShowMonthlyDetail] = useState(false);

    // Generate days for the daily selector (7 days around selected date)
    const days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(subDays(selectedDate, 3), i));
    }, [selectedDate]);

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m.toString().padStart(2, '0')}m`;
    };

    const formatDurationShort = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
    };

    // Calculate daily stats
    const dailyStats = useMemo(() => {
        const filteredLogs = logs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));

        const stats: Record<string, any> = {};
        employees.forEach(emp => {
            stats[emp.id] = {
                employeeId: emp.id,
                firstIn: null,
                lastOut: null,
                totalMinutes: 0,
                movements: [],
                status: 'Terminé'
            };
        });

        const dayLogs = filteredLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        dayLogs.forEach(log => {
            if (!stats[log.employeeId]) return;
            stats[log.employeeId].movements.push(log);
            if (log.type === 'check-in' && !stats[log.employeeId].firstIn) {
                stats[log.employeeId].firstIn = log.timestamp;
            }
            if (log.type === 'check-out') {
                stats[log.employeeId].lastOut = log.timestamp;
            }
        });

        Object.values(stats).forEach((s: any) => {
            let total = 0;
            let lastIn: string | null = null;
            s.movements.forEach((m: any) => {
                if (m.type === 'check-in') lastIn = m.timestamp;
                else if (m.type === 'check-out' && lastIn) {
                    total += differenceInMinutes(new Date(m.timestamp), new Date(lastIn));
                    lastIn = null;
                }
            });
            s.totalMinutes = total;
            s.status = lastIn ? 'En cours' : 'Terminé';
        });

        return Object.values(stats).filter((s: any) => {
            const emp = employees.find(e => e.id === s.employeeId);
            if (!emp) return false;
            const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        });
    }, [logs, employees, selectedDate, searchQuery]);

    // Calculate monthly stats
    const monthlyStats = useMemo(() => {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const filteredLogs = logs.filter(log => {
            const date = new Date(log.timestamp);
            return date >= monthStart && date <= monthEnd;
        });

        const stats: Record<string, any> = {};
        employees.forEach(emp => {
            stats[emp.id] = {
                employeeId: emp.id,
                totalMinutes: 0,
                daysWorked: 0,
                dailyBreakdown: {}
            };
        });

        filteredLogs.forEach(log => {
            if (!stats[log.employeeId]) return;
            const dayKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
            if (!stats[log.employeeId].dailyBreakdown[dayKey]) {
                stats[log.employeeId].dailyBreakdown[dayKey] = [];
            }
            stats[log.employeeId].dailyBreakdown[dayKey].push(log);
        });

        Object.values(stats).forEach((s: any) => {
            let totalMonthMinutes = 0;
            let daysCount = 0;

            Object.entries(s.dailyBreakdown).forEach(([day, dayLogs]: [string, any]) => {
                let dayTotal = 0;
                let lastIn: string | null = null;
                const sortedLogs = dayLogs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                sortedLogs.forEach((m: any) => {
                    if (m.type === 'check-in') lastIn = m.timestamp;
                    else if (m.type === 'check-out' && lastIn) {
                        dayTotal += differenceInMinutes(new Date(m.timestamp), new Date(lastIn));
                        lastIn = null;
                    }
                });

                s.dailyBreakdown[day] = { totalMinutes: dayTotal, logs: sortedLogs };
                totalMonthMinutes += dayTotal;
                if (dayTotal > 0) daysCount++;
            });

            s.totalMinutes = totalMonthMinutes;
            s.daysWorked = daysCount;
        });

        return Object.values(stats).filter((s: any) => {
            const emp = employees.find(e => e.id === s.employeeId);
            if (!emp) return false;
            const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        });
    }, [logs, employees, selectedMonth, searchQuery]);

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    const monthlyDetailDays = useMemo(() => {
        if (!selectedEmployeeId || !selectedMonth) return [];
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        return eachDayOfInterval({ start, end }).reverse();
    }, [selectedMonth, selectedEmployeeId]);

    const currentMonthlyStat = monthlyStats.find(s => s.employeeId === selectedEmployeeId);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white px-4 pt-6 pb-2 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Feuilles de temps de l'entreprise</h1>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span className="capitalize">{format(viewMode === 'daily' ? selectedDate : selectedMonth, 'MMMM', { locale: fr })}</span>
                            <ChevronLeft size={14} className="rotate-270" />
                        </div>
                    </div>
                    <button className="p-2 bg-gray-100 rounded-full text-gray-600">
                        <Calendar size={20} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'daily' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
                    >
                        Quotidien
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
                    >
                        Mensuel
                    </button>
                </div>

                {/* Contextual Selectors */}
                {viewMode === 'daily' ? (
                    <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {days.map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`flex flex-col items-center min-w-[45px] py-2 rounded-2xl transition-all ${isSelected ? 'bg-slate-800 text-white shadow-md scale-110' : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="text-[10px] uppercase font-medium">{format(day, 'EEE', { locale: fr })}</span>
                                    <span className="text-sm font-bold">{format(day, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-4 pb-2">
                        <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="p-1 text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="bg-slate-800 text-white px-6 py-1.5 rounded-full text-sm font-bold">
                            {format(selectedMonth, 'MMM. yyyy', { locale: fr })}
                        </div>
                        <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="p-1 text-gray-400 rotate-180">
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="px-4 mt-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {viewMode === 'daily' ? (
                    dailyStats.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Aucun résultat.</div>
                    ) : (
                        dailyStats.map((stat) => {
                            const emp = employees.find(e => e.id === stat.employeeId);
                            if (!emp) return null;
                            const hasPointed = stat.movements.length > 0;
                            return (
                                <button
                                    key={stat.employeeId}
                                    onClick={() => hasPointed && setSelectedEmployeeId(stat.employeeId)}
                                    className="w-full bg-white p-3 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all text-left"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {emp.photo ? <img src={emp.photo} alt="" className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{emp.firstName[0]}{emp.lastName[0]}</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">{emp.firstName} {emp.lastName}</h3>
                                        <div className="flex items-center gap-2">
                                            {isWeekend(selectedDate) && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full uppercase">Rest Day</span>}
                                            <p className="text-xs text-gray-500">
                                                {hasPointed ? (
                                                    <>
                                                        {format(new Date(stat.firstIn!), 'HH:mm')} - {stat.lastOut ? format(new Date(stat.lastOut), 'HH:mm') : '...'}
                                                        <span className={`ml-2 font-medium ${stat.status === 'En cours' ? 'text-blue-600' : 'text-gray-400'}`}>
                                                            • {stat.status}
                                                        </span>
                                                    </>
                                                ) : "Pas de pointage"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-900">{formatDurationShort(stat.totalMinutes)}</span>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                </button>
                            );
                        })
                    )
                ) : (
                    monthlyStats.map((stat) => {
                        const emp = employees.find(e => e.id === stat.employeeId);
                        if (!emp) return null;
                        return (
                            <button
                                key={stat.employeeId}
                                onClick={() => {
                                    setSelectedEmployeeId(stat.employeeId);
                                    setShowMonthlyDetail(true);
                                }}
                                className="w-full bg-white p-3 rounded-2xl shadow-sm flex items-center gap-3 active:scale-[0.98] transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                    {emp.photo ? <img src={emp.photo} alt="" className="w-full h-full object-cover" /> :
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">{emp.firstName[0]}{emp.lastName[0]}</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{emp.firstName} {emp.lastName}</h3>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{formatDurationShort(stat.totalMinutes)}</span>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Daily Detail Modal */}
            {viewMode === 'daily' && selectedEmployeeId && selectedEmployee && !showMonthlyDetail && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                    {selectedEmployee.photo && <img src={selectedEmployee.photo} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                                    <p className="text-xs text-gray-500">{format(selectedDate, 'dd MMMM yyyy', { locale: fr })}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedEmployeeId(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Mouvements de la journée</h3>
                            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                                {dailyStats.find(s => s.employeeId === selectedEmployeeId)?.movements.map((m: any) => (
                                    <div key={m.id} className="relative flex gap-4 items-start pl-8">
                                        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 ${m.type === 'check-in' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                            }`}>
                                            <Clock size={14} />
                                        </div>
                                        <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-900">{m.type === 'check-in' ? 'Entrée' : 'Sortie'}</span>
                                                <span className="text-sm font-medium text-gray-500">{format(new Date(m.timestamp), 'HH:mm:ss')}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <MapPin size={12} />
                                                {m.zoneName ? <span className="font-medium text-gray-600">{m.zoneName}</span> :
                                                    <a href={`https://www.google.com/maps?q=${m.location.lat},${m.location.lng}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 underline">Voir sur la carte</a>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Info size={18} />
                                <span className="text-sm font-medium">Total travaillé</span>
                            </div>
                            <span className="text-lg font-black text-blue-900">{formatDuration(dailyStats.find(s => s.employeeId === selectedEmployeeId)?.totalMinutes || 0)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Detail Modal */}
            {showMonthlyDetail && selectedEmployee && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col">
                    <div className="p-4 border-b flex items-center gap-4">
                        <button onClick={() => setShowMonthlyDetail(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-lg font-bold">Feuille de temps mensuelle</h2>
                    </div>

                    <div className="p-6 flex flex-col items-center border-b">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mb-4">
                            {selectedEmployee.photo && <img src={selectedEmployee.photo} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                    </div>

                    <div className="grid grid-cols-2 border-b">
                        <div className="p-4 border-r text-center">
                            <p className="text-xs text-gray-500 mb-1">Heures suivies</p>
                            <p className="text-xl font-black text-gray-900">{formatDuration(currentMonthlyStat?.totalMinutes || 0)}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-xs text-gray-500 mb-1">Heures de paie</p>
                            <p className="text-xl font-black text-gray-900">{formatDuration(currentMonthlyStat?.totalMinutes || 0)}</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {monthlyDetailDays.map(day => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const dayStat = currentMonthlyStat?.dailyBreakdown[dayKey];
                            const isOff = isWeekend(day);

                            return (
                                <div key={dayKey} className="p-4 border-b flex justify-between items-center bg-white">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900 capitalize">{format(day, 'eee., MMM. d', { locale: fr })}</span>
                                            {isOff && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full uppercase">Rest Day</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {dayStat ? `Total: ${formatDuration(dayStat.totalMinutes)}` : "N'a pas effectué le pointage d'arrivée"}
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsPage;
