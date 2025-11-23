import React, { useEffect, useState } from 'react';
import { ClassSession, Assignment, Exam, TaskStatus } from '../types';
import { Clock, Sparkles, CalendarDays, ArrowRight, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { generateDashboardMessage } from '../services/geminiService';

interface DashboardProps {
  todayClasses: ClassSession[];
  nextAssignment?: Assignment;
  nextExam?: Exam;
  userName: string;
  allAssignments: Assignment[];
  onChangeView: (view: any) => void;
  onStartFocus: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  todayClasses, 
  nextAssignment, 
  nextExam, 
  userName, 
  allAssignments,
  onChangeView,
  onStartFocus
}) => {
  const [aiContent, setAiContent] = useState<{greeting: string, motivation: string, accentColor: string} | null>(null);

  useEffect(() => {
    const pendingCount = allAssignments.filter(a => a.status !== TaskStatus.DONE).length;
    generateDashboardMessage(userName, pendingCount).then(setAiContent);
  }, [userName, allAssignments]);

  const accent = aiContent?.accentColor || 'violet';

  // Calculate Progress
  const totalTasks = allAssignments.length;
  const completedTasks = allAssignments.filter(a => a.status === TaskStatus.DONE).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="px-6 pt-8 pb-2 flex justify-between items-start">
        <div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
          <h1 className="text-4xl font-light text-slate-800 dark:text-slate-100 tracking-tight leading-tight">
            {aiContent ? aiContent.greeting : 'Loading...'}
          </h1>
           {aiContent && (
            <div className="mt-2 flex items-center gap-2 text-slate-500 dark:text-slate-400 max-w-[80%]">
              <p className="text-sm font-light italic">"{aiContent.motivation}"</p>
            </div>
          )}
        </div>

        {/* Gamified Progress Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center cursor-pointer" onClick={() => onChangeView('ASSIGNMENTS')}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className={`text-${accent}-400 transition-all duration-1000 ease-out`} 
                />
            </svg>
            <div className="absolute text-xs font-bold text-slate-600 dark:text-slate-300">{progressPercentage}%</div>
        </div>
      </header>

      {/* Quick Actions Grid */}
      <section className="px-6 grid grid-cols-2 gap-4">
          <div 
            onClick={onStartFocus}
            className={`bg-${accent}-50 dark:bg-${accent}-900/20 p-4 rounded-[2rem] flex flex-col items-center justify-center text-center gap-2 cursor-pointer active:scale-95 transition-transform border border-${accent}-100 dark:border-${accent}-900 shadow-sm`}
          >
              <div className={`bg-white dark:bg-slate-800 p-3 rounded-full text-${accent}-500 shadow-sm`}>
                  <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <span className={`text-${accent}-900 dark:text-${accent}-100 font-medium block text-sm`}>Focus Mode</span>
                <span className={`text-${accent}-400 dark:text-${accent}-300 text-[10px] uppercase tracking-wide`}>25m Timer</span>
              </div>
          </div>
          <div 
             onClick={() => onChangeView('SCHEDULE')}
             className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] flex flex-col items-center justify-center text-center gap-2 cursor-pointer active:scale-95 transition-transform border border-slate-100 dark:border-slate-800 shadow-sm"
          >
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full text-slate-500 dark:text-slate-400">
                  <CalendarDays size={20} />
              </div>
              <div>
                 <span className="text-slate-700 dark:text-slate-200 font-medium block text-sm">Schedule</span>
                 <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wide">{todayClasses.length} Classes</span>
              </div>
          </div>
      </section>

      {/* Today's Overview (Horizontal Scroll) */}
      <section className="px-6">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Timeline</h2>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6 snap-x">
          {todayClasses.length > 0 ? (
            todayClasses.map((cls) => (
              <div key={cls.id} className={`min-w-[220px] bg-white dark:bg-slate-900 p-5 rounded-[2rem] snap-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800 flex flex-col justify-between h-36 relative overflow-hidden group transition-colors`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-${cls.color}-300 dark:bg-${cls.color}-500`}></div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-semibold text-${cls.color}-500 dark:text-${cls.color}-300 bg-${cls.color}-50 dark:bg-${cls.color}-500/20 px-2 py-1 rounded-full`}>
                      {cls.startTime}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-100 text-xl">{cls.name}</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{cls.room}</p>
                </div>
                <div className={`w-8 h-8 rounded-full bg-${cls.color}-100 dark:bg-${cls.color}-500/20 flex items-center justify-center text-${cls.color}-500 dark:text-${cls.color}-300 self-end`}>
                   <ArrowRight size={14} />
                </div>
              </div>
            ))
          ) : (
             <div className="w-full bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
               <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600"><Sparkles size={20} /></div>
               <p className="text-slate-500 dark:text-slate-400 font-medium">Free day. Recharge yourself.</p>
             </div>
          )}
        </div>
      </section>

      <div className="px-6 pb-4">
        <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Up Next</h2>
        {/* Assignment Card - Updated Visuals */}
        <div 
          onClick={() => onChangeView('ASSIGNMENTS')}
          className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[2.5rem] p-6 relative overflow-hidden cursor-pointer transition-transform active:scale-95"
        >
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-white dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Assignment
              </span>
              {nextAssignment && (
                  <span className="text-amber-900/40 dark:text-amber-200/40 font-bold text-xs">
                    {format(nextAssignment.dueDate, 'MMM d')}
                  </span>
              )}
            </div>
            
            {nextAssignment ? (
              <>
                <h3 className="text-2xl font-medium text-slate-800 dark:text-slate-100 mb-1">{nextAssignment.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-light">{nextAssignment.course}</p>
                
                <div className="w-full bg-amber-100/50 dark:bg-amber-900/30 rounded-full h-1.5 mb-2 overflow-hidden">
                    {nextAssignment.subtasks ? (
                         <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                            style={{width: `${(nextAssignment.subtasks.filter(s=>s.isCompleted).length / nextAssignment.subtasks.length) * 100}%`}}
                         ></div>
                    ) : (
                        <div className="bg-amber-400 h-full w-0 rounded-full"></div>
                    )}
                </div>
                <div className="flex justify-between text-[10px] text-amber-700/60 dark:text-amber-200/60 font-medium uppercase tracking-wider">
                    <span>Progress</span>
                    {nextAssignment.subtasks ? 
                        <span>{Math.round((nextAssignment.subtasks.filter(s=>s.isCompleted).length / nextAssignment.subtasks.length) * 100)}%</span> 
                        : <span>0%</span>
                    }
                </div>
              </>
            ) : (
              <div className="py-6 text-slate-400 dark:text-slate-500 font-light flex items-center justify-center gap-2">
                  <Target size={18} />
                  <span>All goals crushed!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};