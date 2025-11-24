
import React from 'react';
import { LayoutDashboard, CalendarDays, ListTodo, BellRing, Settings, Video, Heart, BookOpen, Mic, Smartphone, BarChart2, Layers, Sprout } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onChangeView }) => {
  const navItems: { view: ViewState; icon: React.ElementType; label: string }[] = [
    { view: 'DASHBOARD', icon: LayoutDashboard, label: 'Home' },
    { view: 'STATS', icon: BarChart2, label: 'Stats' },
    { view: 'GARDEN', icon: Sprout, label: 'Garden' },
    { view: 'FLASHCARDS', icon: Layers, label: 'Cards' },
    { view: 'SCHEDULE', icon: CalendarDays, label: 'Sched' },
    { view: 'ASSIGNMENTS', icon: ListTodo, label: 'Tasks' },
    { view: 'REVISION', icon: BookOpen, label: 'Notes' },
    { view: 'VOICE', icon: Mic, label: 'Voice' },
    { view: 'DISTRACTION', icon: Smartphone, label: 'Focus' },
    { view: 'EXAMS', icon: BellRing, label: 'Exams' },
    { view: 'WELLBEING', icon: Heart, label: 'Well' },
    { view: 'VEO', icon: Video, label: 'Veo' },
    { view: 'SETTINGS', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/20 dark:border-slate-800 z-50 transition-colors duration-300">
      <div className="flex justify-between items-center p-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view)}
                className={`relative p-4 rounded-2xl transition-all duration-300 min-w-[3.5rem] flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                {isActive && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                )}
              </button>
            );
        })}
      </div>
    </div>
  );
};
