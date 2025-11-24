
import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Schedule } from './components/Schedule';
import { Assignments } from './components/Assignments';
import { Exams } from './components/Exams';
import { FocusTimer } from './components/FocusTimer';
import { VeoVideo } from './components/VeoVideo';
import { WellBeing } from './components/WellBeing';
import { Auth } from './components/Auth';
import { ViewState, ClassSession, Assignment, Exam, TaskStatus, UserProfile, StudySession } from './types';
import { format } from 'date-fns';
import { Loader2, Moon, Sun, LogOut } from 'lucide-react';
import { auth, db } from './services/firebase';
import { signInAnonymously, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDoc,
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
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineReason, setOfflineReason] = useState<'auth' | 'permission' | 'network' | null>(null);

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

  // Authentication Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        setError(null);
        setIsOfflineMode(false); 
        setOfflineReason(null);
        
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                setUserProfile(userDoc.data() as UserProfile);
            } else {
                setUserProfile({
                    displayName: currentUser.isAnonymous ? 'Guest Student' : 'Student',
                    avatarId: 'ghost'
                });
            }
        } catch (e) {
            console.error("Error fetching profile:", e);
            setUserProfile({ displayName: 'Student', avatarId: 'ghost' });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
      try {
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          setView('DASHBOARD');
      } catch (e) {
          console.error(e);
      }
  };

  // Helper to save local data
  const saveLocalData = (newAssignments: Assignment[], newExams: Exam[], newClasses: ClassSession[], newSessions: StudySession[]) => {
      const data = {
          assignments: newAssignments,
          exams: newExams,
          classes: newClasses,
          sessions: newSessions
      };
      localStorage.setItem('mindful_planner_data', JSON.stringify(data));
  };

  // Data Subscription
  useEffect(() => {
    if (!user) return;

    if (isOfflineMode) {
        // Load from Local Storage
        try {
            const saved = localStorage.getItem('mindful_planner_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                setAssignments((parsed.assignments || []).map((a: any) => ({ ...a, dueDate: new Date(a.dueDate) })));
                setExams((parsed.exams || []).map((e: any) => ({ ...e, date: new Date(e.date) })));
                setClasses(parsed.classes || []);
                setStudySessions((parsed.sessions || []).map((s: any) => ({...s, timestamp: new Date(s.timestamp)})));
            }
        } catch (e) {
            console.error("Failed to load local data", e);
        }
        return;
    }

    const handleSyncError = (err: any) => {
        console.error("Sync error:", err);
        if (err.code === 'permission-denied') {
            setOfflineReason('permission');
            setIsOfflineMode(true);
        } else if (err.code === 'unavailable') {
            setOfflineReason('network');
        }
    };

    const qAssignments = query(collection(db, 'assignments'), where('userId', '==', user.uid));
    const unsubAssignments = onSnapshot(qAssignments, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, ...d, dueDate: d.dueDate?.toDate ? d.dueDate.toDate() : new Date() };
        }) as Assignment[];
        setAssignments(data.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()));
      }, handleSyncError
    );

    const qExams = query(collection(db, 'exams'), where('userId', '==', user.uid));
    const unsubExams = onSnapshot(qExams, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return { id: doc.id, ...d, date: d.date?.toDate ? d.date.toDate() : new Date() };
        }) as Exam[];
        setExams(data.sort((a,b) => a.date.getTime() - b.date.getTime()));
      }, handleSyncError
    );

    const qClasses = query(collection(db, 'classes'), where('userId', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClassSession[];
        setClasses(data);
      }, handleSyncError
    );

    const qSessions = query(collection(db, 'study_sessions'), where('userId', '==', user.uid));
    const unsubSessions = onSnapshot(qSessions,
        (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return { id: doc.id, ...d, timestamp: d.timestamp?.toDate ? d.timestamp.toDate() : new Date() };
            }) as StudySession[];
            setStudySessions(data.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()));
        }, handleSyncError
    );

    return () => {
        unsubAssignments();
        unsubExams();
        unsubClasses();
        unsubSessions();
    };
  }, [user, isOfflineMode]);

  // --- Actions ---

  const handleSessionComplete = async (durationSeconds: number) => {
      if (!user) return;
      
      const newSession: Omit<StudySession, 'id'> = {
          userId: user.uid,
          duration: durationSeconds,
          timestamp: new Date(),
          subject: 'Focus'
      };

      if (isOfflineMode) {
          const session = { ...newSession, id: Math.random().toString(36).substr(2, 9) };
          const updated = [session, ...studySessions];
          setStudySessions(updated);
          saveLocalData(assignments, exams, classes, updated);
          return;
      }

      try {
          await addDoc(collection(db, 'study_sessions'), {
              ...newSession,
              timestamp: Timestamp.fromDate(newSession.timestamp)
          });
      } catch (e) {
          console.error("Error saving session", e);
      }
  };

  const addAssignment = async (newAss: Omit<Assignment, 'id' | 'status'>) => {
    if (!user) return;
    if (isOfflineMode) {
        const newId = Math.random().toString(36).substr(2, 9);
        const assignment: Assignment = {
            id: newId, ...newAss, status: TaskStatus.TODO, subtasks: [], isAiGenerated: false
        };
        const updated = [...assignments, assignment].sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());
        setAssignments(updated);
        saveLocalData(updated, exams, classes, studySessions);
        return;
    }
    try {
        await addDoc(collection(db, 'assignments'), {
            ...newAss, userId: user.uid, status: TaskStatus.TODO, subtasks: [], isAiGenerated: false, dueDate: Timestamp.fromDate(newAss.dueDate)
        });
    } catch (e) { console.error(e); }
  };

  const toggleAssignmentStatus = async (id: string) => {
    if (isOfflineMode) {
        const updated = assignments.map(a => 
            a.id === id ? { ...a, status: a.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE } : a
        );
        setAssignments(updated);
        saveLocalData(updated, exams, classes, studySessions);
        return;
    }
    const task = assignments.find(a => a.id === id);
    if (!task) return;
    try {
        await updateDoc(doc(db, 'assignments', id), {
            status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
        });
    } catch (e) { console.error(e); }
  };

  const updateSubtasks = async (id: string, subtasks: any[]) => {
    if (isOfflineMode) {
        const updated = assignments.map(a => a.id === id ? { ...a, subtasks, isAiGenerated: true } : a);
        setAssignments(updated);
        saveLocalData(updated, exams, classes, studySessions);
        return;
    }
    try {
        await updateDoc(doc(db, 'assignments', id), { subtasks, isAiGenerated: true });
    } catch (e) { console.error(e); }
  };

  const onDeleteAssignment = async (id: string) => {
    if (isOfflineMode) {
        const updated = assignments.filter(a => a.id !== id);
        setAssignments(updated);
        saveLocalData(updated, exams, classes, studySessions);
        return;
    }
    try { await deleteDoc(doc(db, 'assignments', id)); } catch (e) { console.error(e); }
  };

  const addExam = async (newExam: Omit<Exam, 'id'>) => {
    if (!user) return;
    if (isOfflineMode) {
        const newId = Math.random().toString(36).substr(2, 9);
        const exam: Exam = { id: newId, ...newExam };
        const updated = [...exams, exam].sort((a,b) => a.date.getTime() - b.date.getTime());
        setExams(updated);
        saveLocalData(assignments, updated, classes, studySessions);
        return;
    }
    try {
        await addDoc(collection(db, 'exams'), { ...newExam, userId: user.uid, date: Timestamp.fromDate(newExam.date) });
    } catch (e) { console.error(e); }
  };

  const deleteExam = async (id: string) => {
    if (isOfflineMode) {
        const updated = exams.filter(e => e.id !== id);
        setExams(updated);
        saveLocalData(assignments, updated, classes, studySessions);
        return;
    }
    try { await deleteDoc(doc(db, 'exams', id)); } catch (e) { console.error(e); }
  };

  const addClass = async (newClass: Omit<ClassSession, 'id'>) => {
    if (!user) return;
    if (isOfflineMode) {
        const newId = Math.random().toString(36).substr(2, 9);
        const cls: ClassSession = { id: newId, ...newClass };
        const updated = [...classes, cls];
        setClasses(updated);
        saveLocalData(assignments, exams, updated, studySessions);
        return;
    }
    try {
        await addDoc(collection(db, 'classes'), { ...newClass, userId: user.uid });
    } catch (e) { console.error(e); }
  };

  const deleteClass = async (id: string) => {
    if (isOfflineMode) {
        const updated = classes.filter(c => c.id !== id);
        setClasses(updated);
        saveLocalData(assignments, exams, updated, studySessions);
        return;
    }
    try { await deleteDoc(doc(db, 'classes', id)); } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-950 flex items-center justify-center">
         <div className="flex flex-col items-center gap-4 animate-pulse">
             <Loader2 size={40} className="text-indigo-500 animate-spin" />
             <p className="text-slate-400 font-light text-sm">Loading...</p>
         </div>
      </div>
    );
  }

  if (!user) {
      return <Auth onLoginSuccess={() => {}} />;
  }

  const pendingAssignments = assignments.filter(a => a.status !== TaskStatus.DONE);
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
              userName={userProfile?.displayName || 'Student'}
              userProfile={userProfile}
              allAssignments={assignments}
              studySessions={studySessions}
              onChangeView={setView}
              onStartFocus={() => setIsFocusModeOpen(true)}
            />
          )}
          {view === 'SCHEDULE' && (
            <Schedule schedule={classes} onAddClass={addClass} onDeleteClass={deleteClass} />
          )}
          {view === 'ASSIGNMENTS' && (
            <Assignments 
              assignments={assignments} 
              onAddAssignment={addAssignment}
              onToggleStatus={toggleAssignmentStatus}
              onUpdateSubtasks={updateSubtasks}
              onDeleteAssignment={onDeleteAssignment}
            />
          )}
          {view === 'EXAMS' && (
             <Exams exams={exams} onAddExam={addExam} onDeleteExam={deleteExam} onAddAssignment={addAssignment} />
          )}
          {view === 'WELLBEING' && <WellBeing />}
          {view === 'VEO' && <VeoVideo />}
           {view === 'SETTINGS' && (
             <div className="p-6 pt-10 space-y-8 animate-in fade-in duration-500 pb-28">
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
                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    <div className="flex justify-between items-center py-3 pt-4">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">Account</span>
                        <div className="text-right">
                           <span className={`text-xs font-bold block px-2 py-1 rounded-full ${isOfflineMode ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500'}`}>
                               {user?.isAnonymous ? 'Guest' : (isOfflineMode ? 'Offline' : 'Sync Active')}
                           </span>
                           <span className="text-slate-300 dark:text-slate-600 text-[10px] mt-1 block">
                               {userProfile?.displayName || user?.uid.slice(0,6)}
                           </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full mt-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    >
                        <LogOut size={16} />
                        Log Out
                    </button>
                </section>
             </div>
          )}
        </main>

        <FocusTimer 
            isOpen={isFocusModeOpen} 
            onClose={() => setIsFocusModeOpen(false)} 
            onSessionComplete={handleSessionComplete}
        />
        <Navigation currentView={view} onChangeView={setView} />
      </div>
    </div>
  );
};

export default App;
