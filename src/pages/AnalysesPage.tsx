import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
    ChevronLeft,
    Zap,
    User,
    XCircle,
    Info,
    LogIn,
    LogOut
} from 'lucide-react';
import { format, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnalysesPage: React.FC = () => {
    const { employees, logs } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedMinutes, setSelectedMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });
    const [isLive, setIsLive] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date()); // Default to current month

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedDateRef = useRef<HTMLButtonElement>(null);
    const monthScrollRef = useRef<HTMLDivElement>(null);
    const selectedMonthRef = useRef<HTMLButtonElement>(null);

    // Generate all months for the current year
    const allMonths = useMemo(() => {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        return Array.from({ length: 12 }, (_, i) => startOfMonth(addMonths(startOfYear, i)));
    }, []);

    // Auto-center selected month
    useEffect(() => {
        if (selectedMonthRef.current && monthScrollRef.current) {
            const container = monthScrollRef.current;
            const element = selectedMonthRef.current;
            const scrollLeft = element.offsetLeft - (container.offsetWidth / 2) + (element.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, [selectedMonth]);

    // Filter logs for selected date
    const dateLogs = useMemo(() => {
        return logs.filter(log => isSameDay(new Date(log.timestamp), selectedDate));
    }, [logs, selectedDate]);

    // Calculate presence for selected date
    const dailyStats = useMemo(() => {
        return employees.map(emp => {
            const empLogs = dateLogs.filter(l => l.employeeId === emp.id);
            const checkIn = empLogs.find(l => l.type === 'check-in');
            const checkOut = empLogs.find(l => l.type === 'check-out');

            let status: 'absent' | 'present' | 'late' = 'absent';
            let note = '';

            if (checkIn) {
                status = 'present';
                const checkInTime = new Date(checkIn.timestamp);
                const hour = checkInTime.getHours();
                const minutes = checkInTime.getMinutes();
                if (hour > 9 || (hour === 9 && minutes > 0)) {
                    status = 'late';
                    note = `${(hour - 9) * 60 + minutes} min retard`;
                }
            }

            return {
                ...emp,
                status,
                note,
                hasOvertime: status === 'present' && checkOut && new Date(checkOut.timestamp).getHours() >= 18
            };
        });
    }, [employees, dateLogs]);

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || employees[0];

    // Calculate monthly data for the histogram
    const monthlyData = useMemo(() => {
        if (!selectedEmployee) return [];

        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        return daysInMonth.map(day => {
            const dayLogs = logs.filter(l =>
                l.employeeId === selectedEmployee.id &&
                isSameDay(new Date(l.timestamp), day)
            ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const checkIn = dayLogs.find(l => l.type === 'check-in');
            const checkOut = dayLogs.find(l => l.type === 'check-out');

            const segments: { type: 'normal' | 'late' | 'overtime', start: number, duration: number }[] = [];

            if (checkIn) {
                const cin = new Date(checkIn.timestamp);
                const cinMinutes = cin.getHours() * 60 + cin.getMinutes();
                const startWorkMinutes = 9 * 60; // 09:00
                const endWorkMinutes = 18 * 60; // 18:00

                // Late segment
                if (cinMinutes > startWorkMinutes) {
                    segments.push({
                        type: 'late',
                        start: startWorkMinutes,
                        duration: cinMinutes - startWorkMinutes
                    });
                }

                if (checkOut) {
                    const cout = new Date(checkOut.timestamp);
                    const coutMinutes = cout.getHours() * 60 + cout.getMinutes();

                    // Normal presence segment
                    const normalStart = Math.max(cinMinutes, startWorkMinutes);
                    const normalEnd = Math.min(coutMinutes, endWorkMinutes);

                    if (normalEnd > normalStart) {
                        segments.push({
                            type: 'normal',
                            start: normalStart,
                            duration: normalEnd - normalStart
                        });
                    }

                    // Overtime segment
                    if (coutMinutes > endWorkMinutes) {
                        segments.push({
                            type: 'overtime',
                            start: endWorkMinutes,
                            duration: coutMinutes - endWorkMinutes
                        });
                    }
                } else {
                    const now = new Date();
                    const isToday = isSameDay(day, now);
                    const referenceEnd = isToday ? (now.getHours() * 60 + now.getMinutes()) : endWorkMinutes;

                    const normalStart = Math.max(cinMinutes, startWorkMinutes);
                    const normalEnd = Math.min(referenceEnd, endWorkMinutes);

                    if (normalEnd > normalStart) {
                        segments.push({
                            type: 'normal',
                            start: normalStart,
                            duration: normalEnd - normalStart
                        });
                    }

                    if (referenceEnd > endWorkMinutes) {
                        segments.push({
                            type: 'overtime',
                            start: endWorkMinutes,
                            duration: referenceEnd - endWorkMinutes
                        });
                    }
                }
            }

            return {
                day: format(day, 'd'),
                segments
            };
        });
    }, [selectedEmployee, selectedMonth, logs]);

    // Calculate presence status for each employee at the selected time (selectedMinutes)
    const timeBasedStatus = useMemo(() => {
        const referenceTime = new Date(selectedDate);
        referenceTime.setHours(Math.floor(selectedMinutes / 60), selectedMinutes % 60, 0, 0);

        const inside: any[] = [];
        const outside: any[] = [];

        employees.forEach(emp => {
            const empLogs = dateLogs
                .filter(l => l.employeeId === emp.id && new Date(l.timestamp) <= referenceTime)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            const lastLog = empLogs[0];

            if (lastLog && lastLog.type === 'check-in') {
                inside.push({ ...emp, checkTime: format(new Date(lastLog.timestamp), 'HH:mm') });
            } else {
                outside.push({ ...emp, checkTime: lastLog ? format(new Date(lastLog.timestamp), 'HH:mm') : '--:--' });
            }
        });

        return { inside, outside };
    }, [employees, dateLogs, selectedMinutes, selectedDate]);

    const formatTime = (totalMinutes: number) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const days = useMemo(() => {
        const result = [];
        for (let i = -15; i <= 15; i++) {
            result.push(addDays(new Date(), i));
        }
        return result;
    }, []);

    // Auto-sync slider with real time
    useEffect(() => {
        if (!isLive || !isSameDay(selectedDate, new Date())) return;

        const interval = setInterval(() => {
            const now = new Date();
            setSelectedMinutes(now.getHours() * 60 + now.getMinutes());
        }, 30000);

        return () => clearInterval(interval);
    }, [isLive, selectedDate]);

    // Auto-center selected date
    useEffect(() => {
        if (selectedDateRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const element = selectedDateRef.current;
            const scrollLeft = element.offsetLeft - (container.offsetWidth / 2) + (element.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, [selectedDate]);

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 pb-24">
            <header className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-gray-900">Analyses</h1>
                <p className="text-gray-500">Vue d'ensemble et statistiques de présence</p>
            </header>

            {/* Widget 1: Daily Presence Overview */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wider">Présence par jours</h2>
                </div>

                {/* Horizontal Date Picker */}
                <div
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 py-4 px-4 scrollbar-none no-scrollbar items-center mask-fade-edges relative"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {days.map((day, idx) => {
                        const isSelected = isSameDay(day, selectedDate);
                        return (
                            <button
                                key={idx}
                                ref={isSelected ? selectedDateRef : null}
                                onClick={() => setSelectedDate(day)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 ${isSelected
                                    ? 'w-20 h-20 bg-blue-600 text-white rounded-full shadow-xl ring-4 ring-blue-100 scale-110 z-10'
                                    : 'w-16 h-16 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100'
                                    }`}
                                style={{ scrollSnapAlign: 'center' }}
                            >
                                <span className={`text-[10px] font-bold uppercase truncate w-12 text-center ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {format(day, 'EEE..', { locale: fr }).replace(/\.$/, '')}
                                </span>
                                <span className={`text-[10px] uppercase font-black ${isSelected ? 'text-blue-200' : 'text-gray-300'}`}>
                                    {format(day, 'MMM.', { locale: fr }).toUpperCase()}
                                </span>
                                <span className={`text-lg font-black leading-none mt-0.5 ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {format(day, 'd')}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-4">
                    {dailyStats.map((emp) => (
                        <div key={emp.id} className="group cursor-pointer" onClick={() => setSelectedEmployeeId(emp.id)}>
                            <div className="flex items-center gap-4 mb-1">
                                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 ${emp.status === 'absent' ? 'border-red-400' : 'border-blue-400'}`}>
                                    {(emp.photo || emp.photoURL) ? (
                                        <img
                                            src={emp.photo || emp.photoURL}
                                            alt={`${emp.firstName} profile`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to generic icon if image fails to load
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end">
                                        <div className="font-bold text-gray-800">{emp.firstName} {emp.lastName}</div>
                                        {emp.status === 'absent' ? (
                                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-sm flex items-center gap-1">
                                                <XCircle size={10} /> ABSENT
                                            </span>
                                        ) : emp.hasOvertime ? (
                                            <span className="bg-cyan-400 text-white text-[10px] px-2 py-0.5 rounded-sm">
                                                1.5h Overtime
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                                        <div className={`h-full rounded-full transition-all duration-500 ${emp.status === 'absent' ? 'w-0' : 'w-[90%] bg-green-500'}`} />
                                    </div>
                                    {emp.status === 'late' && (
                                        <div className="text-[10px] text-gray-400 mt-1 font-medium italic">
                                            {emp.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Widget 2: HR Management - Monthly Analysis */}
            {selectedEmployee && (
                <section className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[600px] border border-gray-100">
                    {/* Header: Title & Month Selector */}
                    <div className="p-8 pb-4 space-y-6">
                        <div className="flex items-center gap-4">
                            <ChevronLeft size={24} className="cursor-pointer hover:scale-110 transition-transform text-gray-600 hover:text-gray-900" />
                            <h2 className="text-xl font-bold flex-1 text-center text-gray-900">Analyse mensuelle</h2>
                        </div>

                        {/* Month Selector Strip */}
                        <div
                            ref={monthScrollRef}
                            className="flex items-center gap-8 overflow-x-auto py-2 px-10 no-scrollbar mask-fade-edges-x"
                        >
                            {allMonths.map((month, idx) => {
                                const isSelected = isSameMonth(month, selectedMonth);
                                return (
                                    <button
                                        key={idx}
                                        ref={isSelected ? selectedMonthRef : null}
                                        onClick={() => setSelectedMonth(month)}
                                        className={`flex-shrink-0 transition-all duration-500 uppercase tracking-widest text-xs font-bold ${isSelected
                                            ? 'bg-blue-600 text-white px-8 py-3 rounded-full shadow-lg scale-110'
                                            : 'text-gray-400 hover:text-gray-700'
                                            }`}
                                    >
                                        {format(month, 'MMM.', { locale: fr })}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-t border-gray-200">
                        {/* Sidebar: Employees List */}
                        <aside className="w-full md:w-32 bg-gray-50 border-r border-gray-200 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar md:p-4 gap-6 p-6 items-center">
                            {employees.map((emp) => {
                                const isActive = emp.id === selectedEmployee.id;
                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => setSelectedEmployeeId(emp.id)}
                                        className={`flex flex-col items-center gap-2 transition-all duration-300 group flex-shrink-0 ${isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'
                                            }`}
                                    >
                                        <div className={`w-14 h-14 rounded-full border-2 p-0.5 transition-all duration-500 ${isActive ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' : 'border-transparent group-hover:border-gray-300'
                                            }`}>
                                            {(emp.photo || emp.photoURL) ? (
                                                <img
                                                    src={emp.photo || emp.photoURL}
                                                    alt={emp.firstName}
                                                    className="w-full h-full rounded-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <User size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold truncate w-20 text-center uppercase tracking-tighter transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'
                                            }`}>
                                            {emp.firstName}
                                        </span>
                                    </button>
                                );
                            })}
                        </aside>

                        {/* Main Content: Central Histogram */}
                        {/* Main Content: Central Histogram */}
                        <main className="flex-1 flex flex-col p-8 overflow-hidden bg-gray-50/50">
                            <div className="flex-1 bg-white rounded-[30px] p-6 overflow-y-auto border border-gray-100 flex flex-col relative group shadow-inner">
                                {/* Vertical grid lines */}
                                <div className="absolute inset-0 pointer-events-none left-[24px] right-[8px]">
                                    {[6, 12, 18, 24].map(hour => {
                                        const position = (hour / 24) * 100;
                                        return (
                                            <div
                                                key={hour}
                                                className="absolute top-10 bottom-4 w-px bg-gray-100 border-l border-dashed border-gray-300"
                                                style={{ left: `${position}%` }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* X-Axis labels (graduations) */}
                                <div className="flex justify-between px-2 mb-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3 relative z-10">
                                    <span>0h</span>
                                    <span>6h</span>
                                    <span>12h</span>
                                    <span>18h</span>
                                    <span>24h</span>
                                </div>

                                <div className="space-y-3 pr-2 relative z-10">
                                    {monthlyData.map((data, idx) => (
                                        <div key={idx} className="flex items-center gap-4 group/row">
                                            <span className="w-6 text-[10px] font-bold text-gray-400 group-hover/row:text-blue-600 transition-colors">{data.day}</span>
                                            <div className="flex-1 h-3 bg-gray-100 rounded-full relative overflow-hidden group-hover/row:bg-gray-200 transition-colors">
                                                {data.segments.map((seg, sIdx) => (
                                                    <div
                                                        key={sIdx}
                                                        className={`absolute h-full rounded-full transition-all duration-700 shadow-sm ${seg.type === 'normal' ? 'bg-emerald-500' :
                                                                seg.type === 'late' ? 'bg-amber-500' : 'bg-sky-500'
                                                            }`}
                                                        style={{
                                                            left: `${(seg.start / (24 * 60)) * 100}%`,
                                                            width: `${(seg.duration / (24 * 60)) * 100}%`
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Legend - Floating bar style */}
                            <div className="mt-6 flex justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.15em] py-3 bg-white rounded-full border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 group cursor-help ml-6" title="09:00 - 18:00">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                                    <span className="text-gray-600">Présence</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-help" title="Arrivée après 09:00">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                                    <span className="text-gray-600">Retard</span>
                                </div>
                                <div className="flex items-center gap-2 group cursor-help mr-6" title="Départ après 18:00">
                                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
                                    <span className="text-gray-600">Supp</span>
                                </div>
                            </div>
                        </main>
                    </div>
                </section>
            )}

            {/* Widget 3: Presence Time Monitoring */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-8">
                <header className="space-y-1">
                    <h2 className="text-lg font-bold text-blue-600 uppercase tracking-wider">Surveillance de Présence</h2>
                    <p className="text-sm text-gray-500 font-medium">Visualisez l'état du bureau à une heure précise</p>
                </header>

                <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chronologie</span>
                            {isLive && isSameDay(selectedDate, new Date()) && (
                                <span className="flex items-center gap-1 bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> EN DIRECT
                                </span>
                            )}
                        </div>
                        <div className="bg-blue-600 text-white px-4 py-1 rounded-full font-mono text-lg font-bold shadow-lg ring-4 ring-blue-100 transition-all">
                            {formatTime(selectedMinutes)}
                        </div>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={24 * 60 - 1}
                        value={selectedMinutes}
                        onChange={(e) => {
                            setSelectedMinutes(parseInt(e.target.value));
                            setIsLive(false);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase px-1">
                        <span>Minuit</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>24:00</span>
                    </div>

                    {!isLive && isSameDay(selectedDate, new Date()) && (
                        <div className="flex justify-center pt-2">
                            <button
                                onClick={() => {
                                    const now = new Date();
                                    setSelectedMinutes(now.getHours() * 60 + now.getMinutes());
                                    setIsLive(true);
                                }}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors flex items-center gap-1.5"
                            >
                                <Zap size={10} fill="currentColor" /> RÉACTIVER LE DIRECT
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 hidden md:block" />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-green-500 w-fit">
                            <LogIn size={18} className="text-green-500" />
                            <h3 className="text-sm font-black text-gray-900 tracking-tighter uppercase">ENTRÉE <span className="text-green-500 ml-1">({timeBasedStatus.inside.length})</span></h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {timeBasedStatus.inside.map((emp) => (
                                <div key={emp.id} className="bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm flex items-center gap-3 transition-all hover:scale-105 hover:shadow-md animate-in slide-in-from-left-2 duration-300">
                                    <div className="w-10 h-10 rounded-full border-2 border-green-200 overflow-hidden flex-shrink-0">
                                        {(emp.photo || emp.photoURL) ? (
                                            <img
                                                src={emp.photo || emp.photoURL}
                                                alt={emp.firstName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.classList.add('bg-gray-50', 'flex', 'items-center', 'justify-center');
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-800 truncate">{emp.firstName}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{emp.checkTime}</div>
                                    </div>
                                </div>
                            ))}
                            {timeBasedStatus.inside.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-300 italic text-xs">
                                    Personne à l'intérieur à cette heure
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-300 w-fit">
                            <LogOut size={18} className="text-gray-400" />
                            <h3 className="text-sm font-black text-gray-400 tracking-tighter uppercase">SORTIE <span className="ml-1">({timeBasedStatus.outside.length})</span></h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {timeBasedStatus.outside.map((emp) => (
                                <div key={emp.id} className="bg-gray-50/50 border border-gray-100 p-2.5 rounded-xl flex items-center gap-3 opacity-60 transition-all hover:opacity-100 animate-in slide-in-from-right-2 duration-300">
                                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden flex-shrink-0 grayscale">
                                        {(emp.photo || emp.photoURL) ? (
                                            <img
                                                src={emp.photo || emp.photoURL}
                                                alt={emp.firstName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const parent = e.currentTarget.parentElement;
                                                    if (parent) {
                                                        parent.classList.add('bg-gray-50', 'flex', 'items-center', 'justify-center');
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                <User size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-500 truncate">{emp.firstName}</div>
                                        <div className="text-[10px] text-gray-300 font-medium">{emp.checkTime}</div>
                                    </div>
                                </div>
                            ))}
                            {timeBasedStatus.outside.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-300 italic text-xs">
                                    Tout le monde est à l'intérieur
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                    <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
                        Ce graphique compare dynamiquement les heures de pointage avec l'heure sélectionnée sur le curseur. Un employé passe de <b>SORTIE</b> à <b>ENTRÉE</b> dès son premier pointage enregistré avant l'heure choisie.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default AnalysesPage;
