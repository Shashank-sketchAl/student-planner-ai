
import React, { useState, useRef, useEffect } from 'react';
import { ClassSession } from '../types';
import { Plus, Trash2, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { parseClassInput } from '../services/geminiService';

interface ScheduleProps {
  schedule: ClassSession[];
  onAddClass: (newClass: Omit<ClassSession, 'id'>) => void;
  onDeleteClass: (id: string) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const COLORS = ['blue', 'violet', 'orange', 'emerald', 'rose'];

export const Schedule: React.FC<ScheduleProps> = ({ schedule, onAddClass, onDeleteClass }) => {
  const [activeDay, setActiveDay] = useState('Mon');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [day, setDay] = useState('Mon');
  const [color, setColor] = useState('blue');

  // Smart Add State
  const [smartInput, setSmartInput] = useState('');
  const [isSmartAdding, setIsSmartAdding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const filteredClasses = schedule
    .filter((c) => c.day === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSmartInput(transcript);
            setIsListening(false);
            // Optionally auto-submit
            // handleSmartAdd({ preventDefault: () => {} } as any);
        };

        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
    } else {
        setSmartInput('');
        recognitionRef.current?.start();
        setIsListening(true);
    }
  };

  const handleSmartAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;
    setIsSmartAdding(true);
    try {
        const classes = await parseClassInput(smartInput);
        if (classes.length > 0) {
            classes.forEach(c => {
                onAddClass({
                    name: c.name,
                    room: c.room,
                    startTime: c.startTime,
                    endTime: c.endTime,
                    day: c.day,
                    color: c.color
                });
            });
            setSmartInput('');
            // Optional: Show success feedback
        }
    } catch (error) {
        console.error("Smart add failed", error);
    } finally {
        setIsSmartAdding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) return;
    
    onAddClass({
        name,
        room,
        startTime,
        endTime,
        day,
        color
    });
    
    setIsModalOpen(false);
    // Reset form
    setName('');
    setRoom('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="pb-24 flex flex-col h-full bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
      <header className="px-6 pt-10 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
        <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100 mb-6">Timetable</h1>
        
        {/* Smart Add Input */}
        <form onSubmit={handleSmartAdd} className="relative group mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center text-indigo-500">
                {isSmartAdding ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </div>
            <input 
                type="text" 
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                disabled={isSmartAdding}
                placeholder={isListening ? "Listening..." : "Voice add: 'Math on Mon/Wed at 10am'"}
                className={`w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-slate-900 border ${isListening ? 'border-rose-400 ring-2 ring-rose-100 dark:ring-rose-900' : 'border-indigo-100 dark:border-slate-800'} shadow-sm focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all`}
            />
            {/* Mic Button */}
            <button 
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-3 bottom-3 w-10 rounded-xl flex items-center justify-center transition-colors ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            
            {smartInput && !isSmartAdding && !isListening && (
                <button 
                    type="submit"
                    className="absolute right-14 top-3 bottom-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Add
                </button>
            )}
        </form>

        <div className="flex justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800 mb-2 overflow-x-auto">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex-1 min-w-[3rem] py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeDay === d
                  ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <div className="space-y-4 pb-4 relative">
            {/* Soft time line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800 z-0 border-l border-dashed border-slate-300 dark:border-slate-700"></div>

            {filteredClasses.length > 0 ? filteredClasses.map((cls, idx) => (
                <div key={cls.id} className="relative z-10 pl-6 group">
                     {/* Time Marker */}
                    <div className="absolute -left-[0.3rem] top-6 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-[#FDFBF7] dark:border-slate-950"></div>
                    
                    <div className={`bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-50 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-all relative pr-10`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-semibold text-${cls.color}-500 dark:text-${cls.color}-300 bg-${cls.color}-50 dark:bg-${cls.color}-500/20 px-3 py-1 rounded-full`}>
                                {cls.startTime} - {cls.endTime}
                            </span>
                        </div>
                        <h3 className="font-medium text-slate-800 dark:text-slate-100 text-xl mb-1">{cls.name}</h3>
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-light">
                             <span>{cls.room}</span>
                        </div>

                         <button 
                            onClick={() => onDeleteClass(cls.id)}
                            className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-rose-400 dark:hover:text-rose-400 transition-colors p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-50 dark:border-slate-800 text-slate-300 dark:text-slate-600">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-light text-lg">No classes.</p>
                    <p className="text-slate-400 dark:text-slate-600 text-sm">Free day!</p>
                </div>
            )}
        </div>
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
            <h2 className="text-2xl font-light text-slate-800 dark:text-slate-100 mb-6">New Class</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Course Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                  placeholder="e.g., Advanced Biology"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 transition-all dark:[color-scheme:dark]"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 transition-all dark:[color-scheme:dark]"
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Room</label>
                 <input
                   type="text"
                   value={room}
                   onChange={(e) => setRoom(e.target.value)}
                   className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                   placeholder="e.g., Science Hall 101"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Day</label>
                    <select 
                        value={day} 
                        onChange={(e) => setDay(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 transition-all appearance-none"
                    >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                   <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Color</label>
                    <div className="flex gap-2 items-center h-[56px]">
                        {COLORS.map(c => (
                            <button 
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full bg-${c}-400 transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-700' : 'opacity-50 hover:opacity-100'}`}
                            />
                        ))}
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
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
