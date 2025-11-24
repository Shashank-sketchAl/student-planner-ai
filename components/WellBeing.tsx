
import React, { useState } from 'react';
import { Heart, Send, Loader2, Coffee, CloudRain, Wind, Sun, Smile } from 'lucide-react';
import { getWellBeingAdvice } from '../services/geminiService';

export const WellBeing: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const quickFeelings = [
    { label: "Overwhelmed", icon: Wind, text: "I'm feeling completely overwhelmed with my workload." },
    { label: "Exam Anxiety", icon: CloudRain, text: "I'm really scared about my upcoming exams." },
    { label: "Low Motivation", icon: Coffee, text: "I just can't find the energy to start studying." },
    { label: "Tired", icon: Sun, text: "I'm exhausted and can't focus." },
  ];

  const handleRequest = async (text: string) => {
    if (!text) return;
    setLoading(true);
    setInput(text); 
    try {
      const advice = await getWellBeingAdvice(text);
      setResponse(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRequest(input);
  };

  return (
    <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
      <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950">
        <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Wellness</h1>
            <Heart className="text-rose-400 fill-rose-50 dark:fill-rose-900/20" />
        </div>
        <p className="text-slate-400 dark:text-slate-500 text-sm">A safe space to breathe and reset.</p>
      </header>

      <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
        
        {/* Response Area */}
        {response ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 pb-20">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-emerald-50 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                            <Smile size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Here for you</h3>
                        <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                            {response}
                        </div>
                        
                        <button 
                            onClick={() => { setResponse(null); setInput(''); }}
                            className="mt-6 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:underline"
                        >
                            Start over
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="space-y-8 animate-in fade-in pb-20">
                 {/* Welcome / Breathing Graphic */}
                 <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-tr from-rose-100 to-indigo-100 dark:from-rose-900/20 dark:to-indigo-900/20 flex items-center justify-center animate-pulse">
                        <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm">
                            <Wind size={32} />
                        </div>
                    </div>
                    <p className="mt-4 text-center text-slate-400 dark:text-slate-500 text-sm max-w-[200px]">
                        Take a deep breath. How are you feeling right now?
                    </p>
                 </div>

                 {/* Quick Chips */}
                 <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Quick Check-in</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {quickFeelings.map((q) => (
                            <button
                                key={q.label}
                                onClick={() => handleRequest(q.text)}
                                disabled={loading}
                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 transition-all text-left group"
                            >
                                <q.icon size={20} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{q.label}</span>
                            </button>
                        ))}
                    </div>
                 </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      {!response && (
          <div className="px-6 pb-28 pt-4 bg-gradient-to-t from-[#FDFBF7] to-transparent dark:from-slate-950 sticky bottom-0 z-10">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder="Describe how you feel..."
                    className="w-full pl-6 pr-14 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-slate-200 dark:disabled:bg-slate-800 hover:bg-rose-600 transition-colors"
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
            </form>
          </div>
      )}
    </div>
  );
};
