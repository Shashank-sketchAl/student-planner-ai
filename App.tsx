import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Assignments } from './components/Assignments';
import { Exams } from './components/Exams';
import { FocusTimer } from './components/FocusTimer';
import { ViewState, ClassSession, Assignment, Exam, TaskStatus, Priority } from './types';
import { format } from 'date-fns';
import { Loader2, AlertCircle, Moon, Sun } from 'lucide-react';
import { auth, db } from './services/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  
  // Data States
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Authentication
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setError(null);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Auth Failed", err);
          setError("Could not sign in. Please check your connection.");
          setLoading(false);
        });
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Data Subscription
  useEffect(() => {
    if (!user) return;

    // Subscriptions with Error Handling
    const qAssignments = query(collection(db, 'assignments'), where('userId', '==', user.uid));
    const unsubAssignments = onSnapshot(qAssignments, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : new Date(),
            };
        }) as Assignment[];
        setAssignments(data.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()));
      },
      (err) => console.error("Assignments sync error:", err)
    );

    const qExams = query(collection(db, 'exams'), where('userId', '==', user.uid));
    const unsubExams = onSnapshot(qExams, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                ...d,
                date: d.date?.toDate ? d.date.toDate() : new Date(),
            };
        }) as Exam[];
        setExams(data.sort((a,b) => a.date.getTime() - b.date.getTime()));
      },
      (err) => console.error("Exams sync error:", err)
    );

    const qClasses = query(collection(db, 'classes'), where('userId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ClassSession[];
        setClasses(data);
        setLoading(false);
      },
      (err) => {
        console.error("Classes sync error:", err);
        // If one fails, we still want to stop loading
        setLoading(false);
      }
    );

    return () => {
        unsubAssignments();
        unsubExams();
        unsubClasses();
    };
  }, [user]);

  // --- Actions ---

  const addAssignment = async (newAss: Omit<Assignment, 'id' | 'status'>) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'assignments'), {
            ...newAss,
            userId: user.uid,
            status: TaskStatus.TODO,
            subtasks: [],
            isAiGenerated: false,
            dueDate: Timestamp.fromDate(newAss.dueDate)
        });
    } catch (e) {
        console.error("Error adding assignment: ", e);
    }
  };

  const toggleAssignmentStatus = async (id: string) => {
    const task = assignments.find(a => a.id === id);
    if (!task) return;
    try {
        await updateDoc(doc(db, 'assignments', id), {
            status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
        });
    } catch (e) {
        console.error("Error toggling status: ", e);
    }
  };

  const updateSubtasks = async (id: string, subtasks: any[]) => {
    try {
        await updateDoc(doc(db, 'assignments', id), {
            subtasks,
            isAiGenerated: true
        });
    } catch (e) {
        console.error("Error updating subtasks: ", e);
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'assignments', id));
    } catch (e) {
        console.error("Error deleting assignment: ", e);
    }
  };

  const addExam = async (newExam: Omit<Exam, 'id'>) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'exams'), {
            ...newExam,
            userId: user.uid,
            date: Timestamp.fromDate(newExam.date)
        });
    } catch (e) {
        console.error("Error adding exam: ", e);
    }
  };

  const deleteExam = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'exams', id));
    } catch (e) {
        console.error("Error deleting exam: ", e);
    }
  };

  const addClass = async (newClass: Omit<ClassSession, 'id'>) => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'classes'), {
            ...newClass,
            userId: user.uid
        });
    } catch (e) {
        console.error("Error adding class: ", e);
    }
  };

  const deleteClass = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'classes', id));
    } catch (e) {
        console.error("Error deleting class: ", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-950 flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400 px-6 text-center">
             <AlertCircle size={40} className="text-rose-400" />
             <p>{error}</p>
             <button onClick={() => window.location.reload()} className="text-indigo-600 dark:text-indigo-400 font-medium text-sm underline">Retry</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 animate-pulse">
             <Loader2 size={40} className="text-indigo-500 animate-spin" />
             <p className="text-slate-400 font-light text-sm">Syncing your planner...</p>
          </div>
        )}
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status !== TaskStatus.DONE);

  // Filter classes for "Today"
  const currentDayName = format(new Date(), 'EEE'); 
  const displayDay = ['Sat', 'Sun'].includes(currentDayName) ? 'Mon' : currentDayName; 
  const todayClasses = classes.filter(c => c.day === displayDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-700 dark:selection:text-indigo-200 transition-colors duration-300">
      <div className="max-w-md mx-auto bg-[#FDFBF7] dark:bg-slate-950 min-h-screen relative shadow-[0_0_50px_rgba(0,0,0,0.03)] dark:shadow-none overflow-hidden transition-colors duration-300">
        
        <main className="h-full overflow-hidden">
          {view === 'DASHBOARD' && (
            <Dashboard 
              todayClasses={todayClasses} 
              nextAssignment={pendingAssignments[0]}
              nextExam={exams[0]}
              userName="Student"
              allAssignments={assignments}
              onChangeView={setView}
              onStartFocus={() => setIsFocusModeOpen(true)}
            />
          )}
          {view === 'SCHEDULE' && (
            <Schedule 
                schedule={classes} 
                onAddClass={addClass} 
                onDeleteClass={deleteClass}
            />
          )}
          {view === 'ASSIGNMENTS' && (
            <Assignments 
              assignments={assignments} 
              onAddAssignment={addAssignment}
              onToggleStatus={toggleAssignmentStatus}
              onUpdateSubtasks={updateSubtasks}
              onDeleteAssignment={deleteAssignment}
            />
          )}
          {view === 'EXAMS' && (
             <Exams 
                exams={exams} 
                onAddExam={addExam} 
                onDeleteExam={deleteExam}
             />
          )}
           {view === 'SETTINGS' && (
             <div className="p-6 pt-10 space-y-8 animate-in fade-in duration-500">
                <h2 className="text-3xl font-light text-slate-800 dark:text-slate-100">Settings</h2>
                
                <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            {darkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-amber-400" />}
                            <span className="text-slate-600 dark:text-slate-300 font-medium">Dark Mode</span>
                        </div>
                        <button 
                            onClick={toggleDarkMode} 
                            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${darkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-all duration-300 ${darkMode ? 'right-1' : 'left-1'}`}></div>
                        </button>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Notifications</span>
                         <div className="w-12 h-7 bg-indigo-500 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                    </div>
                    <div className="flex justify-between items-center py-3 pt-4">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Account</span>
                        <div className="text-right">
                           <span className="text-emerald-500 text-xs font-bold block bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">Sync Active</span>
                           <span className="text-slate-300 dark:text-slate-600 text-[10px] mt-1 block">ID: {user?.uid.slice(0,6)}...</span>
                        </div>
                    </div>
                </section>

                <div className="text-center text-slate-300 dark:text-slate-700 text-xs">
                    MindfulStudent v2.0 (Cloud)
                </div>
             </div>
          )}
        </main>

        {/* Focus Timer Overlay */}
        <FocusTimer isOpen={isFocusModeOpen} onClose={() => setIsFocusModeOpen(false)} />

        <Navigation currentView={view} onChangeView={setView} />
      </div>
    </div>
  );
};

export default App;