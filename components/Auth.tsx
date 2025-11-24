
import React, { useState } from 'react';
import { Ghost, Crown, Zap, Smile, Star, Rocket, ArrowRight, Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AVATARS } from '../types';

interface AuthProps {
    onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);

    const getIcon = (iconName: string, size: number) => {
        switch (iconName) {
            case 'Ghost': return <Ghost size={size} />;
            case 'Crown': return <Crown size={size} />;
            case 'Zap': return <Zap size={size} />;
            case 'Smile': return <Smile size={size} />;
            case 'Star': return <Star size={size} />;
            case 'Rocket': return <Rocket size={size} />;
            default: return <Smile size={size} />;
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Login Flow
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Sign Up Flow
                if (!displayName.trim()) throw new Error("Please enter your name.");
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create User Profile in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    displayName,
                    avatarId: selectedAvatar,
                    email,
                    createdAt: new Date().toISOString()
                });
            }
            onLoginSuccess();
        } catch (err: any) {
            console.error(err);
            let msg = "An error occurred.";
            if (err.code === 'auth/email-already-in-use') msg = "That email is already in use.";
            if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
            if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = async () => {
        setLoading(true);
        try {
            await signInAnonymously(auth);
            onLoginSuccess();
        } catch (e) {
            console.error(e);
            setError("Could not start guest session.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
            <div className="w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-700">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none transform rotate-3">
                        <Ghost size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-light text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
                        MindfulStudent
                    </h1>
                    <p className="text-slate-400 dark:text-slate-500">
                        {isLogin ? "Welcome back, scholar." : "Plan. Focus. Succeed."}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 relative overflow-hidden">
                    {/* Background blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

                    <form onSubmit={handleAuth} className="space-y-5 relative z-10">
                        
                        {/* Avatar Selection (Only for Sign Up) */}
                        {!isLogin && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 text-center">Choose your Avatar</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATARS.map((avatar) => (
                                        <button
                                            key={avatar.id}
                                            type="button"
                                            onClick={() => setSelectedAvatar(avatar.id)}
                                            className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                                selectedAvatar === avatar.id 
                                                ? `bg-${avatar.color}-500 text-white scale-110 shadow-lg ring-2 ring-offset-2 ring-${avatar.color}-200 dark:ring-offset-slate-900` 
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {getIcon(avatar.icon, 20)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inputs */}
                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <UserIcon size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="What should we call you?"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-400"
                                    />
                                </div>
                            )}

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-400"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-400"
                                />
                            </div>
                        </div>

                        {error && (
                             <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-300 text-sm text-center font-medium">
                                 {error}
                             </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : (isLogin ? 'Log In' : 'Get Started')}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-400 dark:text-slate-500 text-sm">
                            {isLogin ? "New here?" : "Already have an account?"}
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-1 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                            >
                                {isLogin ? "Create Account" : "Log In"}
                            </button>
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                         <button 
                            onClick={handleGuest}
                            className="text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-wider hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1 mx-auto"
                         >
                             <ShieldCheck size={14} />
                             Continue as Guest
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
