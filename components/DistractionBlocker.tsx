
import React, { useState } from 'react';
import { ShieldAlert, Smartphone, Youtube, MessageCircle, Gamepad2, AlertTriangle, ArrowRight, Loader2, CheckCircle2, CalendarClock } from 'lucide-react';
import { analyzeDistractionPatterns, DistractionAnalysis } from '../services/geminiService';
import { Assignment, TaskStatus } from '../types';

interface DistractionBlockerProps {
    tasks: Assignment[];
    onRescheduleTask: (id: string, newDate: Date) => void;
}

export const DistractionBlocker: React.FC<DistractionBlockerProps> = ({ tasks, onRescheduleTask }) => {
    // Usage State (minutes)
    const [usage, setUsage] = useState({
        YouTube: 0,
        Instagram: 0,
        WhatsApp: 0,
        Gaming: 0
    });
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<DistractionAnalysis | null>(null);
    const [appliedChanges, setAppliedChanges] = useState<string[]>([]);

    const handleSliderChange = (app: keyof typeof usage, val: number) => {
        setUsage(prev => ({ ...prev, [app]: val }));
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAppliedChanges([]);
        
        // Filter only pending tasks for analysis
        const pendingTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
        const taskTitles = pendingTasks.map(t => t.title);

        try {
            const analysis = await analyzeDistractionPatterns(usage, taskTitles);
            setResult(analysis);
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const applyAction = (taskName: string, action: string) => {
        if (action === 'MOVE_TOMORROW') {
            const task = tasks.find(t => t.title === taskName && t.status !== TaskStatus.DONE);
            if (task) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onRescheduleTask(task.id, tomorrow);
                setAppliedChanges(prev => [...prev, taskName]);
            }
        }
    };

    // Fixed: Cast Object.values result to number[] to fix "unknown not assignable to number" error
    const getTotalMinutes = (): number => (Object.values(usage) as number[]).reduce((a: number, b: number) => a + b, 0);
    const getSeverityColor = () => {
        const total = getTotalMinutes();
        if (total < 30) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
        if (total < 60) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
        return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800';
    };

    return (
        <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Focus Shield</h1>
                    <ShieldAlert className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Monitor distractions and reclaim your time.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
                
                {/* Input Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800">
                    <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-6">App Usage Today</h2>
                    
                    <div className="space-y-6">
                        {/* YouTube */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                                    <Youtube size={16} className="text-rose-500"/> YouTube
                                </div>
                                <span className="text-slate-400 dark:text-slate-500">{usage.YouTube}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="180" step="5"
                                value={usage.YouTube}
                                onChange={(e) => handleSliderChange('YouTube', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                        </div>

                        {/* Instagram */}
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                                    <Smartphone size={16} className="text-fuchsia-500"/> Instagram
                                </div>
                                <span className="text-slate-400 dark:text-slate-500">{usage.Instagram}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="180" step="5"
                                value={usage.Instagram}
                                onChange={(e) => handleSliderChange('Instagram', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                            />
                        </div>

                        {/* WhatsApp */}
                        <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                                    <MessageCircle size={16} className="text-emerald-500"/> WhatsApp
                                </div>
                                <span className="text-slate-400 dark:text-slate-500">{usage.WhatsApp}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="180" step="5"
                                value={usage.WhatsApp}
                                onChange={(e) => handleSliderChange('WhatsApp', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>

                         {/* Gaming */}
                         <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                                    <Gamepad2 size={16} className="text-indigo-500"/> Gaming
                                </div>
                                <span className="text-slate-400 dark:text-slate-500">{usage.Gaming}m</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="180" step="5"
                                value={usage.Gaming}
                                onChange={(e) => handleSliderChange('Gaming', parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                         <div>
                             <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Time</span>
                             <p className="text-2xl font-light text-slate-800 dark:text-slate-100">{getTotalMinutes()} <span className="text-sm text-slate-400">min</span></p>
                         </div>
                         <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center gap-2"
                         >
                            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <ShieldAlert size={18} />}
                            Analyze Focus
                         </button>
                    </div>
                </div>

                {/* Analysis Result */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 space-y-4">
                        
                        {/* Alert Card */}
                        <div className={`p-6 rounded-[2rem] border ${getSeverityColor()} relative overflow-hidden`}>
                             <div className="flex items-start gap-4 relative z-10">
                                 <div className="p-2 bg-white/50 dark:bg-black/20 rounded-full shrink-0">
                                     <AlertTriangle size={24} />
                                 </div>
                                 <div>
                                     <h3 className="font-bold text-lg mb-1">Focus Alert</h3>
                                     <p className="text-sm opacity-90 leading-relaxed">
                                         "{result.alert}"
                                     </p>
                                 </div>
                             </div>
                        </div>

                         {/* Focus Booster */}
                         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800">
                             <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Focus Booster</h3>
                             <p className="text-slate-700 dark:text-slate-200 text-lg font-light italic">
                                 "{result.coachingTip}"
                             </p>
                         </div>

                        {/* Schedule Adjustments */}
                        {result.suggestedActions.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800">
                                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Smart Adjustments</h3>
                                <div className="space-y-3">
                                    {result.suggestedActions.map((action, idx) => {
                                        const isApplied = appliedChanges.includes(action.taskName);
                                        const shouldMove = action.action === 'MOVE_TOMORROW';
                                        
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <div className="pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{action.taskName}</span>
                                                        {shouldMove && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Move to Tomorrow</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{action.reason}</p>
                                                </div>
                                                
                                                {shouldMove && (
                                                    <button 
                                                        onClick={() => applyAction(action.taskName, action.action)}
                                                        disabled={isApplied}
                                                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                            isApplied 
                                                            ? 'bg-emerald-500 text-white' 
                                                            : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-indigo-500 shadow-sm'
                                                        }`}
                                                    >
                                                        {isApplied ? <CheckCircle2 size={18} /> : <CalendarClock size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
