import React, { useState } from 'react';
import { Assignment, TaskStatus, Priority } from '../types';
import { Plus, Check, Wand2, Loader2, Trash2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { breakDownAssignment, parseTaskInput } from '../services/geminiService';

interface AssignmentsProps {
  assignments: Assignment[];
  onAddAssignment: (assignment: Omit<Assignment, 'id' | 'status'>) => void;
  onToggleStatus: (id: string) => void;
  onUpdateSubtasks: (id: string, subtasks: any[]) => void;
  onDeleteAssignment: (id: string) => void;
}

export const Assignments: React.FC<AssignmentsProps> = ({ assignments, onAddAssignment, onToggleStatus, onUpdateSubtasks, onDeleteAssignment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>(Priority.MEDIUM);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  // Smart Add State
  const [smartInput, setSmartInput] = useState('');
  const [isSmartAdding, setIsSmartAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCourse || !newDate) return;
    onAddAssignment({
      title: newTitle,
      course: newCourse,
      dueDate: new Date(newDate),
      priority: newPriority
    });
    setIsModalOpen(false);
    setNewTitle('');
    setNewCourse('');
    setNewDate('');
    setNewPriority(Priority.MEDIUM);
  };

  const handleSmartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    setIsSmartAdding(true);
    try {
        const result = await parseTaskInput(smartInput);
        onAddAssignment({
            title: result.title,
            course: result.course,
            dueDate: new Date(result.dueDate),
            priority: result.priority as Priority
        });
        setSmartInput('');
    } catch (error) {
        console.error("Smart add failed", error);
        // Fallback or error toast could go here
    } finally {
        setIsSmartAdding(false);
    }
  };

  const handleBreakdown = async (e: React.MouseEvent, assignment: Assignment) => {
    e.stopPropagation();
    if (assignment.subtasks && assignment.subtasks.length > 0) return;
    setLoadingId(assignment.id);
    try {
      const steps = await breakDownAssignment(assignment.title, assignment.course);
      const subtasks = steps.map((step, i) => ({
        id: `${assignment.id}-sub-${i}`,
        title: step,
        isCompleted: false
      }));
      onUpdateSubtasks(assignment.id, subtasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const getPriorityColor = (p: Priority) => {
      switch(p) {
          case Priority.HIGH: return 'text-rose-500 bg-rose-50 dark:bg-rose-900/30';
          case Priority.MEDIUM: return 'text-amber-500 bg-amber-50 dark:bg-amber-900/30';
          case Priority.LOW: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
          default: return 'text-slate-500 bg-slate-50 dark:bg-slate-800';
      }
  }

  return (
    <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
      <header className="px-6 pt-10 pb-4 bg-[#FDFBF7] dark:bg-slate-950 sticky top-0 z-20 transition-colors duration-300">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Tasks</h1>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Prioritize what matters.</p>
            </div>
            <div className="text-right">
                <span className="text-xs font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">Pending</span>
                <p className="text-2xl text-slate-800 dark:text-slate-100 font-light">{assignments.filter(a => a.status !== TaskStatus.DONE).length}</p>
            </div>
        </div>

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
                placeholder={isSmartAdding ? "Analyzing..." : "Ask AI: 'Math homework due Friday high priority'"}
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
        {assignments.map((assignment) => (
          <div key={assignment.id} className={`group bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] shadow-sm border transition-all duration-300 ${assignment.status === TaskStatus.DONE ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/10 opacity-60' : 'border-slate-50 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-md'} relative`}>
            
            <div className="flex items-start gap-4">
              <button
                onClick={() => onToggleStatus(assignment.id)}
                className={`mt-1 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  assignment.status === TaskStatus.DONE
                    ? 'bg-emerald-400 border-emerald-400 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-indigo-400'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </button>
              
              <div className="flex-1 pr-6">
                <div className="flex justify-between items-start">
                  <h3 className={`font-medium text-lg leading-snug transition-all ${assignment.status === TaskStatus.DONE ? 'text-slate-400 dark:text-slate-600 line-through decoration-slate-300 dark:decoration-slate-700' : 'text-slate-800 dark:text-slate-100'}`}>
                    {assignment.title}
                  </h3>
                  <span className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-lg ml-2 ${getPriorityColor(assignment.priority)}`}>
                    {assignment.priority}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-400 dark:text-slate-500">
                    <span>{assignment.course}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className={assignment.status === TaskStatus.DONE ? '' : 'text-slate-500 dark:text-slate-400 font-medium'}>
                        {format(assignment.dueDate, 'MMM d')}
                    </span>
                </div>

                {/* AI Breakdown Action */}
                {assignment.status !== TaskStatus.DONE && (!assignment.subtasks || assignment.subtasks.length === 0) && (
                   <button 
                     onClick={(e) => handleBreakdown(e, assignment)}
                     disabled={loadingId === assignment.id}
                     className="mt-4 text-xs flex items-center gap-2 text-violet-600 dark:text-violet-300 font-medium bg-violet-50 dark:bg-violet-900/30 px-3 py-2 rounded-xl hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50"
                   >
                     {loadingId === assignment.id ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />}
                     {loadingId === assignment.id ? 'Optimizing...' : 'AI Breakdown'}
                   </button>
                )}

                {/* Subtasks Display */}
                {assignment.subtasks && assignment.subtasks.length > 0 && (
                  <div className="mt-4 space-y-2 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl">
                    {assignment.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-3">
                         <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.isCompleted ? 'bg-emerald-400' : 'bg-violet-300 dark:bg-violet-500'}`}></div>
                         <span className={`text-sm font-light ${sub.isCompleted ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-600 dark:text-slate-300'}`}>{sub.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Delete Button */}
            <button 
                onClick={() => onDeleteAssignment(assignment.id)}
                className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-rose-400 dark:hover:text-rose-400 transition-colors p-1"
            >
                <Trash2 size={16} />
            </button>
          </div>
        ))}
        
        {assignments.length === 0 && (
           <div className="text-center py-20 opacity-50">
             <p className="text-slate-400 dark:text-slate-600 font-light">Nothing on your plate.</p>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 border dark:border-slate-800">
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6">New Task</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">What needs doing?</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                  placeholder="e.g., Research Paper"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Class</label>
                    <input
                      type="text"
                      required
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                      placeholder="History"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Due</label>
                    <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 transition-all dark:[color-scheme:dark]"
                      />
                 </div>
              </div>

              {/* Priority Selector */}
              <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Priority</label>
                  <div className="flex gap-2">
                      {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setNewPriority(p)}
                            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                newPriority === p 
                                ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                              {p}
                          </button>
                      ))}
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
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};