import React, { useState } from 'react';
import { Exam, Priority, Assignment } from '../types';
import { Plus, MapPin, Trash2, CalendarClock, Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { generateStudyPlan, parseExamInput } from '../services/geminiService';

interface ExamsProps {
  exams: Exam[];
  onAddExam: (exam: Omit<Exam, 'id'>) => void;
  onDeleteExam: (id: string) => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'status'>) => void;
}

export const Exams: React.FC<ExamsProps> = ({ exams, onAddExam, onDeleteExam, onAddAssignment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [planningId, setPlanningId] = useState<string | null>(null);

  // Smart Add State
  const [smartInput, setSmartInput] = useState('');
  const [isSmartAdding, setIsSmartAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !date) return;
    
    // Create date at noon to avoid timezone rolling it back to previous day
    const examDate = new Date(date + 'T12:00:00');

    onAddExam({
      subject,
      location: location || 'TBD',
      date: examDate,
    });
    setIsModalOpen(false);
    setSubject('');
    setLocation('');
    setDate('');
  };

  const handleSmartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    setIsSmartAdding(true);
    try {
        const result = await parseExamInput(smartInput);
        const examDate = new Date(result.date + 'T12:00:00');
        
        onAddExam({
            subject: result.subject,
            location: result.location,
            date: examDate
        });
        setSmartInput('');
    } catch (error) {
        console.error("Smart add exam failed", error);
    } finally {
        setIsSmartAdding(false);
    }
  };

  const handleGeneratePlan = async (e: React.MouseEvent, exam: Exam) => {
    e.stopPropagation();
    setPlanningId(exam.id);
    try {
        const plan = await generateStudyPlan(exam.subject, exam.date);
        plan.forEach(task => {
            onAddAssignment({
                title: task.title,
                course: exam.subject,
                dueDate: new Date(task.dueDate + 'T12:00:00'),
                priority: task.priority as Priority
            });
        });
        alert(`Added ${plan.length} study tasks to your schedule!`);
    } catch (err) {
        console.error(err);
    } finally {
        setPlanningId(null);
    }
  };

  return (
    <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
      <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 mb-6">Exams</h1>
        
        {/* Smart Add Input */}
        <form onSubmit={handleSmartAdd} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-indigo-500">
                {isSmartAdding ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </div>
            <input 
                type="text" 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                disabled={isSmartAdding}
                placeholder={isSmartAdding ? "Scheduling..." : "Ask AI: 'Calculus Final next Friday in Room 101'"}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
            />
            {smartInput && !isSmartAdding && (
                <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Add
                </button>
            )}
        </form>
      </header>

      <div className="flex-1 px-6 py-2 space-y-4 overflow-y-auto no-scrollbar">
        {exams.map((exam) => {
          const daysLeft = Math.ceil((exam.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isPlanning = planningId === exam.id;

          return (
            <div key={exam.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 relative overflow-hidden group transition-colors">
               {/* Decorative bg blob */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-10 -mt-10 blur-2xl opacity-60"></div>
               
               <div className="relative z-10 flex justify-between items-start pr-8">
                 <div>
                    <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">
                        {format(exam.date, 'MMMM d, yyyy')}
                    </div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-100 text-xl mb-2">{exam.subject}</h3>
                    <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-sm mb-4">
                        <MapPin size={14} />
                        <span>{exam.location}</span>
                    </div>

                    {/* Generate Plan Button */}
                    <button 
                        onClick={(e) => handleGeneratePlan(e, exam)}
                        disabled={isPlanning}
                        className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isPlanning ? <Loader2 size={14} className="animate-spin" /> : <CalendarClock size={14} />}
                        {isPlanning ? "Creating Plan..." : "Create Study Plan"}
                    </button>
                 </div>

                 <div className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[80px]">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{daysLeft}</span>
                    <span className="text-[10px] text-indigo-400 uppercase font-bold">Days</span>
                 </div>
               </div>

               <button 
                    onClick={() => onDeleteExam(exam.id)}
                    className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-rose-400 dark:hover:text-rose-400 transition-colors p-2 z-20"
                >
                    <Trash2 size={16} />
                </button>
            </div>
          );
        })}
        
        {exams.length === 0 && (
           <div className="text-center py-20 opacity-50">
             <p className="text-slate-400 dark:text-slate-600 font-light">No upcoming exams.</p>
           </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-full shadow-2xl shadow-slate-300 dark:shadow-indigo-900/20 flex items-center justify-center hover:scale-105 transition-transform z-30"
      >
        <Plus size={32} strokeWidth={1.5} />
      </button>

       {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/10 dark:bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 border dark:border-slate-800">
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6">New Exam</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                  placeholder="e.g., Physics Midterm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                      placeholder="Room 302"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Date</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 transition-all dark:[color-scheme:dark]"
                      />
                    </div>
                 </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};