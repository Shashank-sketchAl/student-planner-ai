
import React, { useMemo, useState } from 'react';
import { StudySession } from '../types';
import { BarChart2, TrendingUp, TrendingDown, Clock, Target, Calendar, Flame, Zap, Trophy, BookOpen } from 'lucide-react';
import { format, subDays, isSameDay, startOfDay, differenceInCalendarDays } from 'date-fns';

interface ProgressStatsProps {
    sessions: StudySession[];
}

export const ProgressStats: React.FC<ProgressStatsProps> = ({ sessions }) => {
    const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null);

    // --- Data Processing ---

    // 1. Weekly Data
    const weeklyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            days.push(subDays(new Date(), i));
        }

        return days.map(day => {
            const daySessions = sessions.filter(s => isSameDay(new Date(s.timestamp), day));
            const totalSeconds = daySessions.reduce((acc, curr) => acc + curr.duration, 0);
            return {
                date: day,
                minutes: Math.round(totalSeconds / 60),
                dayName: format(day, 'EEE'),
                fullDate: format(day, 'MMM d')
            };
        });
    }, [sessions]);

    // 2. Streak Calculation
    const streak = useMemo(() => {
        if (sessions.length === 0) return 0;
        
        // Sort unique dates descending
        // Fixed: Explicitly type sort arguments to number to ensure arithmetic operation is valid
        const uniqueDates = Array.from(new Set(sessions.map(s => startOfDay(new Date(s.timestamp)).getTime())))
            .sort((a: number, b: number) => b - a);

        const today = startOfDay(new Date()).getTime();
        const yesterday = startOfDay(subDays(new Date(), 1)).getTime();
        
        // If no study today or yesterday, streak is broken (unless user studies later today)
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

        let currentStreak = 1;
        let lastDate = uniqueDates[0];

        for (let i = 1; i < uniqueDates.length; i++) {
            const diff = differenceInCalendarDays(lastDate, uniqueDates[i]);
            if (diff === 1) {
                currentStreak++;
                lastDate = uniqueDates[i];
            } else {
                break;
            }
        }
        return currentStreak;
    }, [sessions]);

    // 3. Subject Breakdown
    const subjectStats = useMemo(() => {
        const stats: Record<string, number> = {};
        let totalMinutes = 0;
        sessions.forEach(s => {
            const subj = s.subject || 'General Focus';
            const mins = Math.round(s.duration / 60);
            stats[subj] = (stats[subj] || 0) + mins;
            totalMinutes += mins;
        });
        
        return Object.entries(stats)
            .map(([name, minutes]) => ({ name, minutes, percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0 }))
            .sort((a, b) => b.minutes - a.minutes)
            .slice(0, 5); // Top 5
    }, [sessions]);

    // 4. Comparison Logic
    const todayStats = weeklyData[6];
    const yesterdayStats = weeklyData[5];
    const diffMinutes = todayStats.minutes - yesterdayStats.minutes;
    const isUp = diffMinutes >= 0;

    // 5. Chart Scaling
    const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 60); 

    // Total Lifetime
    const totalHoursAllTime = (sessions.reduce((acc, curr) => acc + curr.duration, 0) / 3600).toFixed(1);

    return (
        <div className="pb-28 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Progress</h1>
                    <BarChart2 className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Visualize your growth.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-4">
                
                {/* Hero Metrics - Bento Grid */}
                <div className="grid grid-cols-2 gap-3">
                    
                    {/* Today's Focus Card */}
                    <div className="col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">Today's Focus</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight">{todayStats.minutes}</span>
                                <span className="text-sm font-medium text-slate-400">min</span>
                            </div>
                            
                            <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isUp ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{Math.abs(diffMinutes)}m {isUp ? 'more' : 'less'} than yesterday</span>
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-20 ${isUp ? 'bg-emerald-400' : 'bg-indigo-400'}`}></div>
                        <div className="relative z-10 w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Clock size={24} strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Streak Card */}
                    <div className="bg-gradient-to-br from-orange-500 to-rose-500 p-5 rounded-[2rem] text-white shadow-lg shadow-orange-200 dark:shadow-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-8 -mt-8 blur-xl"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={20} className="fill-white/90 text-white" />
                                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Streak</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-semibold">{streak}</span>
                                <span className="text-sm opacity-80">days</span>
                            </div>
                        </div>
                    </div>

                    {/* Lifetime Hours Card */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/50">
                        <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                            <Trophy size={20} />
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Total</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-light text-slate-800 dark:text-slate-100">{totalHoursAllTime}</span>
                            <span className="text-sm text-slate-400 dark:text-slate-500">hrs</span>
                        </div>
                    </div>
                </div>

                {/* Main Interactive Chart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-8">
                         <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Activity</h2>
                         <div className="text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {focusedDayIndex !== null ? weeklyData[focusedDayIndex].fullDate : 'Last 7 Days'}
                         </div>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-3 relative">
                        {/* Dashed Grid Lines (Optional visual guide) */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800/50 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800/50 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800/50 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                        </div>

                        {weeklyData.map((d, i) => {
                            const heightPercent = Math.max((d.minutes / maxMinutes) * 100, 6);
                            const isToday = i === 6;
                            const isFocused = focusedDayIndex === i;

                            return (
                                <div 
                                    key={i} 
                                    className="flex-1 flex flex-col items-center gap-3 relative z-10 group cursor-pointer"
                                    onMouseEnter={() => setFocusedDayIndex(i)}
                                    onMouseLeave={() => setFocusedDayIndex(null)}
                                    onTouchStart={() => setFocusedDayIndex(i)}
                                >
                                    {/* The Bar */}
                                    <div className="w-full relative flex-1 flex items-end">
                                        <div 
                                            className={`w-full rounded-xl transition-all duration-500 ease-out relative overflow-hidden ${
                                                isToday 
                                                ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30' 
                                                : isFocused 
                                                    ? 'bg-indigo-300 dark:bg-indigo-500' 
                                                    : 'bg-slate-100 dark:bg-slate-800'
                                            }`}
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            {/* Hover Tooltip Value */}
                                            {(isFocused || (isToday && focusedDayIndex === null)) && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                                    {d.minutes}m
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Day Label */}
                                    <span className={`text-[10px] font-bold uppercase transition-colors ${
                                        isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400'
                                    }`}>
                                        {d.dayName.charAt(0)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Subject Breakdown - Segmented Bar */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-full text-rose-500">
                            <Target size={18} />
                        </div>
                        <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Focus Areas</h2>
                    </div>

                    {subjectStats.length > 0 ? (
                        <>
                            {/* Segmented Progress Bar */}
                            <div className="w-full h-4 rounded-full overflow-hidden flex mb-6 shadow-inner">
                                {subjectStats.map((sub, idx) => {
                                    const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                                    return (
                                        <div 
                                            key={sub.name}
                                            className={colors[idx % colors.length]}
                                            style={{ width: `${sub.percentage}%` }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Legend / List */}
                            <div className="space-y-4">
                                {subjectStats.map((sub, idx) => {
                                    const textColors = ['text-indigo-500', 'text-violet-500', 'text-rose-500', 'text-amber-500', 'text-emerald-500'];
                                    const dotColors = ['bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500'];
                                    
                                    return (
                                        <div key={idx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`}></div>
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{sub.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-400">{sub.minutes}m</span>
                                                <span className={`text-xs font-bold ${textColors[idx % textColors.length]}`}>{sub.percentage}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                         <div className="text-center py-8 opacity-50">
                            <BookOpen size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-slate-400 dark:text-slate-500 font-light text-sm">No study data yet. Start a session!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
