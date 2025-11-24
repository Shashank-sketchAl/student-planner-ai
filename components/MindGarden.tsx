
import React from 'react';
import { StudySession } from '../types';
import { Sprout, Flower2, Trees, Leaf, CloudSun } from 'lucide-react';

interface MindGardenProps {
    sessions: StudySession[];
}

export const MindGarden: React.FC<MindGardenProps> = ({ sessions }) => {
    
    // Sort sessions by date descending
    const sortedSessions = [...sessions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const getPlantForSession = (duration: number) => {
        const mins = duration / 60;
        if (mins >= 45) return { icon: Trees, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/40', name: 'Oak Tree' };
        if (mins >= 25) return { icon: Flower2, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/40', name: 'Rose Bush' };
        if (mins >= 10) return { icon: Leaf, color: 'text-lime-600', bg: 'bg-lime-100 dark:bg-lime-900/40', name: 'Fern' };
        return { icon: Sprout, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/40', name: 'Sprout' };
    };

    const totalTrees = sortedSessions.filter(s => s.duration / 60 >= 45).length;
    const totalFlowers = sortedSessions.filter(s => s.duration / 60 >= 25 && s.duration / 60 < 45).length;

    return (
        <div className="pb-28 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Mind Garden</h1>
                    <Sprout className="text-emerald-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Grow your focus, one session at a time.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
                
                {/* Stats Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-lg shadow-emerald-200 dark:shadow-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10 flex justify-between items-end">
                        <div>
                            <span className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Flora</span>
                            <div className="text-4xl font-semibold mt-1">{sessions.length}</div>
                            <p className="text-emerald-100 text-sm mt-1 opacity-80">Plants in your garden</p>
                        </div>
                        <CloudSun size={48} className="text-emerald-100/50" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-400">
                            <Trees size={18} />
                            <span className="text-xs font-bold uppercase">Deep Focus</span>
                        </div>
                        <span className="text-2xl font-light text-slate-800 dark:text-slate-100">{totalTrees}</span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800">
                        <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                            <Flower2 size={18} />
                            <span className="text-xs font-bold uppercase">Flow State</span>
                        </div>
                         <span className="text-2xl font-light text-slate-800 dark:text-slate-100">{totalFlowers}</span>
                    </div>
                </div>

                {/* The Grid */}
                <div>
                    <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Garden Grid</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {sortedSessions.map((session) => {
                            const plant = getPlantForSession(session.duration);
                            return (
                                <div key={session.id} className={`${plant.bg} aspect-square rounded-2xl flex flex-col items-center justify-center relative group transition-transform hover:scale-105`}>
                                    <plant.icon size={32} className={`${plant.color}`} />
                                    <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-2 backdrop-blur-sm">
                                        <span className="text-white text-xs font-bold">{plant.name}</span>
                                        <span className="text-white/70 text-[10px]">{Math.round(session.duration/60)}m</span>
                                        <span className="text-white/50 text-[8px] mt-1">{session.timestamp.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Empty Plots to fill grid visually */}
                        {Array.from({ length: Math.max(0, 9 - sessions.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 aspect-square rounded-2xl flex items-center justify-center opacity-50">
                                <div className="w-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
