
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Coffee, Sparkles, CheckCircle2 } from 'lucide-react';
import { getStudyTip } from '../services/geminiService';

interface FocusTimerProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionComplete: (durationSeconds: number) => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ isOpen, onClose, onSessionComplete }) => {
    const DEFAULT_TIME = 25 * 60;
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [tip, setTip] = useState<{tip: string, category: string} | null>(null);
    const [sessionDuration, setSessionDuration] = useState(DEFAULT_TIME);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            // Timer finished naturally
            setIsActive(false);
            
            if (!isBreak) {
               // Focus Session Completed
               onSessionComplete(sessionDuration);
               
               // Switch to break
               fetchTip();
               setIsBreak(true);
               setTimeLeft(5 * 60);
               setSessionDuration(5 * 60);
            } else {
                // Break Completed
                setIsBreak(false);
                setTimeLeft(DEFAULT_TIME);
                setSessionDuration(DEFAULT_TIME);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, isBreak, sessionDuration, onSessionComplete]);

    const fetchTip = async () => {
        const newTip = await getStudyTip();
        setTip(newTip);
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setIsBreak(false);
        setTimeLeft(DEFAULT_TIME);
        setSessionDuration(DEFAULT_TIME);
        setTip(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden relative border dark:border-slate-800">
                {/* Header */}
                <div className={`h-32 ${isBreak ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'} transition-colors duration-500 flex flex-col items-center justify-center relative`}>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white/80 dark:hover:bg-black/40 transition-colors text-slate-600 dark:text-slate-300">
                        <X size={20} />
                    </button>
                    <div className={`p-3 rounded-full mb-2 ${isBreak ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200' : 'bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200'}`}>
                        {isBreak ? <Coffee size={24} /> : <Sparkles size={24} />}
                    </div>
                    <h2 className="text-slate-700 dark:text-slate-200 font-medium tracking-wide uppercase text-sm">
                        {isBreak ? 'Rest & Recharge' : 'Deep Focus Mode'}
                    </h2>
                </div>

                {/* Timer Body */}
                <div className="p-8 flex flex-col items-center">
                    <div className="text-7xl font-light text-slate-800 dark:text-slate-100 tabular-nums mb-8 tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>

                    {/* Tip Area */}
                    {tip && isBreak && (
                         <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center animate-in slide-in-from-bottom-4">
                            <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">{tip.category} Tip</span>
                            <p className="text-emerald-800 dark:text-emerald-300 text-sm font-medium">"{tip.tip}"</p>
                         </div>
                    )}

                    <div className="flex gap-6 items-center">
                        <button 
                            onClick={resetTimer}
                            className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <RotateCcw size={24} />
                        </button>
                        
                        <button 
                            onClick={toggleTimer}
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
                                isBreak 
                                ? 'bg-emerald-500 shadow-emerald-200 dark:shadow-none hover:bg-emerald-600' 
                                : 'bg-indigo-600 shadow-indigo-200 dark:shadow-none hover:bg-indigo-700'
                            }`}
                        >
                            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1"/>}
                        </button>
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                        {isBreak ? "Take a breath. You earned it." : "Sessions are saved to your daily stats."}
                        {!isBreak && <CheckCircle2 size={12} />}
                    </p>
                </div>
            </div>
        </div>
    );
};
