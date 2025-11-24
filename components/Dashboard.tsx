
import React, { useEffect, useState } from 'react';
import { ClassSession, Assignment, Exam, TaskStatus, ViewState, UserProfile, AVATARS, StudySession } from '../types';
import { Sparkles, CalendarDays, ArrowRight, Target, Zap, Bot, X, Ghost, Crown, Zap as ZapIcon, Smile, Star, Rocket, Loader2, Trophy, Clock, Flame } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { generateDashboardMessage, getAiStudyAdvice } from '../services/geminiService';

interface DashboardProps {
  todayClasses: ClassSession[];
  nextAssignment?: Assignment;
  nextExam?: Exam;
  userName: string;
  userProfile?: UserProfile | null;
  allAssignments: Assignment[];
  studySessions: StudySession[];
  onChangeView: (view: ViewState) => void;
  onStartFocus: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  todayClasses, 
  nextAssignment, 
  nextExam, 
  userName,
  userProfile,
  allAssignments,
  studySessions,
  onChangeView,
  onStartFocus
}) => {
  const [aiContent, setAiContent] = useState<{greeting: string, motivation: string, accentColor: string} | null>(null);
  
  // AI Coach Modal State
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachMood, setCoachMood] = useState('Focused');
  const [coachTime, setCoachTime] = useState('1 hour');
  const [coachSubject, setCoachSubject] = useState('');
  const [coachAdvice, setCoachAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const pendingCount = allAssignments.filter(a => a.status !== TaskStatus.DONE).length;
    generateDashboardMessage(userName, pendingCount).then(setAiContent);
  }, [userName, allAssignments]);

  const accent = aiContent?.accentColor || 'violet';

  // Calculate Progress & Stats
  const totalTasks = allAssignments.length;
  const completedTasks = allAssignments.filter(a => a.status === TaskStatus.DONE).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Challenge / Study Stats
  const today = new Date();
  const sessionsToday = studySessions.filter(s => isSameDay(new Date(s.timestamp), today));
  const timeStudiedTodaySeconds = sessionsToday.reduce((acc, curr) => acc + curr.duration, 0);
  const timeStudiedTodayMinutes = Math.round(timeStudiedTodaySeconds / 60);
  
  // Daily Challenge Logic: "Focus for 45 minutes"
  const dailyGoalMinutes = 45;
  const challengeProgress = Math.min(100, Math.round((timeStudiedTodayMinutes / dailyGoalMinutes) * 100));
  const isChallengeComplete = timeStudiedTodayMinutes >= dailyGoalMinutes;

  // Total Lifetime Stats
  const totalLifetimeSeconds = studySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const totalLifetimeHours = (totalLifetimeSeconds / 3600).toFixed(1);

  const handleGetAdvice = async () => {
      if (!coachSubject) return;
      setLoadingAdvice(true);
      setCoachAdvice('');
      try {
          const advice = await getAiStudyAdvice(coachMood, coachTime, coachSubject);
          setCoachAdvice(advice);
      } catch (e) {
          console.error(e);
          setCoachAdvice("Couldn't reach the AI coach right now. Try taking a deep breath and starting small.");
      } finally {
          setLoadingAdvice(false);
      }
  };

  const getAvatarIcon = (id: string) => {
      const size = 20;
      switch (id) {
          case 'crown': return <Crown size={size} />;
          case 'zap': return <ZapIcon size={size} />;
          case 'smile': return <Smile size={size} />;
          case 'star': return <Star size={size} />;
          case 'rocket': return <Rocket size={size} />;
          default: return <Ghost size={size} />;
      }
  };

  const currentAvatar = AVATARS.find(a => a.id === userProfile?.avatarId) || AVATARS[0];

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-700 relative">
      {/* Header Section */}
      <header className="px-6 pt-8 pb-2 flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg bg-${currentAvatar.color}-500 shadow-${currentAvatar.color}-200 dark:shadow-none`}>
                 {getAvatarIcon(currentAvatar.id)}
             </div>
             <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">{format(new Date(), 'EEEE, MMM d')}</p>
                <h1 className="text-2xl font-light text-slate-800 dark:text-slate-100 tracking-tight">
                    {aiContent ? aiContent.greeting : `Hi, ${userName}`}
                </h1>
             </div>
          </div>
           {aiContent && (
            <div className="mt-2 text-slate-500 dark:text-slate-400 max-w-[90%]">
              <p className="text-sm font-light italic">"{aiContent.motivation}"</p>
            </div>
          )}
        </div>

        {/* Gamified Progress Ring */}
        <div className="relative w-14 h-14 flex items-center justify-center cursor-pointer shrink-0" onClick={() => onChangeView('ASSIGNMENTS')}>
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="28" cy="28" r={26} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="28" cy="28" r={26} stroke="currentColor" strokeWidth="4" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 26} 
                    strokeDashoffset={2 * Math.PI * 26 - (progressPercentage / 100) * (2 * Math.PI * 26)} 
                    strokeLinecap="round"
                    className={`text-${accent}-400 transition-all duration-1000 ease-out`} 
                />
            </svg>
            <div className="absolute text-[10px] font-bold text-slate-600 dark:text-slate-300">{progressPercentage}%</div>
        </div>
      </header>

      {/* Daily Challenge Card */}
      <section className="px-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden">
              {/* Decorative particles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Trophy size={16} className="text-amber-300" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">Daily Quest</span>
                      </div>
                      {isChallengeComplete && (
                          <span className="bg-emerald-400/20 text-emerald-100 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
                              <Sparkles size={10} /> Completed
                          </span>
                      )}
                  </div>
                  
                  <h3 className="text-xl font-medium mb-1">Focus for {dailyGoalMinutes} mins</h3>
                  <p className="text-indigo-200 text-sm mb-4 font-light">Build your streak. You've done {timeStudiedTodayMinutes}m today.</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isChallengeComplete ? 'bg-emerald-400' : 'bg-white'}`}
                        style={{ width: `${challengeProgress}%` }}
                      ></div>
                  </div>
              </div>
          </div>
      </section>

      {/* Stats & Actions Grid */}
      <section className="px-6 grid grid-cols-2 gap-3">
          {/* Total Time Stat */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-50 dark:border-slate-800 flex flex-col justify-between h-32 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-500 mb-2">
                  <Clock size={20} />
              </div>
              <div>
                  <span className="text-2xl font-light text-slate-800 dark:text-slate-100">{totalLifetimeHours}h</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Total Focus Time</span>
              </div>
          </div>

          {/* Quick Actions Stack */}
          <div className="grid grid-rows-2 gap-3">
               <div 
                onClick={onStartFocus}
                className={`bg-${accent}-50 dark:bg-${accent}-900/20 p-3 rounded-[1.5rem] flex items-center gap-3 cursor-pointer border border-${accent}-100 dark:border-${accent}-900 shadow-sm transition-transform active:scale-95`}
              >
                  <div className={`bg-white dark:bg-slate-800 p-2 rounded-full text-${accent}-500 shadow-sm shrink-0`}>
                      <Zap size={16} fill="currentColor" />
                  </div>
                  <span className={`text-${accent}-900 dark:text-${accent}-100 font-medium text-xs`}>Start Focus</span>
              </div>

               <div 
                 onClick={() => setIsCoachOpen(true)}
                 className="bg-slate-50 dark:bg-slate-800 p-3 rounded-[1.5rem] flex items-center gap-3 cursor-pointer border border-slate-100 dark:border-slate-700 shadow-sm transition-transform active:scale-95"
              >
                   <div className="bg-white dark:bg-slate-900 p-2 rounded-full text-indigo-500 shrink-0">
                      <Bot size={16} />
                  </div>
                  <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">AI Strategy</span>
              </div>
          </div>
      </section>

      {/* Today's Classes (Horizontal Scroll) */}
      <section className="px-6">
        <div className="flex justify-between items-baseline mb-4">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Timeline</h2>
           <button onClick={() => onChangeView('SCHEDULE')} className="text-xs font-medium text-indigo-500">View All</button>
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
        {/* Assignment Card */}
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

      {/* AI Coach Modal */}
      {isCoachOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 dark:bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-10 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 bg-indigo-600 dark:bg-indigo-900/50 text-white relative">
                    <button 
                        onClick={() => setIsCoachOpen(false)}
                        className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <Bot size={24} />
                        </div>
                        <h2 className="text-xl font-medium">Study Assistant</h2>
                    </div>
                    <p className="text-indigo-100 text-sm font-light">
                        Personalized strategies based on your mood & time.
                    </p>
                </div>

                <div className="p-6 overflow-y-auto">
                    {!coachAdvice ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">How are you feeling?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Energetic', 'Tired', 'Stressed', 'Focused'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => setCoachMood(m)}
                                            className={`py-3 rounded-xl text-sm font-medium transition-all ${coachMood === m ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Time Available</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {['15 mins', '30 mins', '1 hour', '2 hours+'].map(t => (
                                        <button 
                                            key={t} 
                                            onClick={() => setCoachTime(t)}
                                            className={`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all ${coachTime === t ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">What are you studying?</label>
                                <input
                                  type="text"
                                  value={coachSubject}
                                  onChange={(e) => setCoachSubject(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                                  placeholder="e.g., Biology Chapter 4"
                                />
                             </div>

                             <button 
                                onClick={handleGetAdvice}
                                disabled={!coachSubject || loadingAdvice}
                                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 {loadingAdvice ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>Thinking...</span>
                                    </>
                                 ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>Get Strategy</span>
                                    </>
                                 )}
                             </button>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-800 shadow-inner">
                                {coachAdvice}
                            </div>
                            <button 
                                onClick={() => setCoachAdvice('')}
                                className="mt-4 w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Ask Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
