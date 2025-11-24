
import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { BookOpen, Loader2, Sparkles, FileText, List, Zap, Trash2, ChevronDown, ChevronUp, Copy, Check, Headphones, Pause, Play } from 'lucide-react';
import { generateNoteContent, generatePodcastScript } from '../services/geminiService';

interface SmartNotesProps {
    notes: Note[];
    onSaveNote: (note: Omit<Note, 'id'>) => void;
    onDeleteNote: (id: string) => void;
}

export const SmartNotes: React.FC<SmartNotesProps> = ({ notes, onSaveNote, onDeleteNote }) => {
    const [topic, setTopic] = useState('');
    const [type, setType] = useState<'SUMMARY' | 'BULLETS' | 'CHEAT_SHEET'>('SUMMARY');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    // Podcast Mode State
    const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    useEffect(() => {
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setGeneratedContent('');
        try {
            const content = await generateNoteContent(topic, type);
            setGeneratedContent(content);
        } catch (e) {
            console.error(e);
            setGeneratedContent("Sorry, I couldn't generate notes right now. Please check your connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!topic || !generatedContent) return;
        onSaveNote({
            userId: '', // Handled by App wrapper
            topic,
            content: generatedContent,
            type,
            createdAt: new Date()
        });
        setTopic('');
        setGeneratedContent('');
        setType('SUMMARY');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpand = (id: string) => {
        setExpandedNoteId(expandedNoteId === id ? null : id);
        // Stop audio if closing the note
        if (expandedNoteId === id && playingNoteId === id) {
             stopAudio();
        }
    };

    const togglePodcast = async (note: Note) => {
        if (playingNoteId === note.id) {
            stopAudio();
            return;
        }

        // Start new audio
        stopAudio();
        setPlayingNoteId(note.id);
        setIsProcessingAudio(true);

        try {
            const script = await generatePodcastScript(note.content);
            const utterance = new SpeechSynthesisUtterance(script);
            
            // Voice selection
            const voices = synthRef.current.getVoices();
            const voice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
            if (voice) utterance.voice = voice;
            utterance.rate = 1.1; // Slightly faster for energetic feel

            utterance.onend = () => {
                setPlayingNoteId(null);
                setIsProcessingAudio(false);
            };

            synthRef.current.speak(utterance);
        } catch (e) {
            console.error(e);
            setPlayingNoteId(null);
        } finally {
            setIsProcessingAudio(false);
        }
    };

    const stopAudio = () => {
        synthRef.current.cancel();
        setPlayingNoteId(null);
    };

    const getTypeLabel = (t: string) => {
        if (t === 'SUMMARY') return 'Summary';
        if (t === 'BULLETS') return 'Key Points';
        if (t === 'CHEAT_SHEET') return 'Cheat Sheet';
        return 'Note';
    };

    const getTypeIcon = (t: string) => {
        if (t === 'SUMMARY') return <FileText size={16} />;
        if (t === 'BULLETS') return <List size={16} />;
        if (t === 'CHEAT_SHEET') return <Zap size={16} />;
        return <FileText size={16} />;
    };

    return (
        <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Smart Notes</h1>
                    <BookOpen className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Instant revision materials generated by AI.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
                
                {/* Creation Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-indigo-100 dark:border-slate-800">
                    <form onSubmit={handleGenerate}>
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. The French Revolution, Photosynthesis..."
                            className="w-full px-4 py-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                        />

                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Format</label>
                        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'SUMMARY', label: 'Summary', icon: FileText },
                                { id: 'BULLETS', label: 'Bullets', icon: List },
                                { id: 'CHEAT_SHEET', label: 'Cheat Sheet', icon: Zap },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setType(opt.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                        type === opt.id 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <opt.icon size={16} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isGenerating || !topic}
                            className="w-full py-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                            {isGenerating ? 'Writing...' : 'Generate Notes'}
                        </button>
                    </form>

                    {/* Generated Result Preview */}
                    {generatedContent && (
                        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                                {generatedContent}
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button 
                                    onClick={() => setGeneratedContent('')}
                                    className="flex-1 py-3 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Discard
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 transition-colors"
                                >
                                    Save to Library
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Saved Notes List */}
                <div>
                    <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Your Library</h2>
                    <div className="space-y-3">
                        {notes.length > 0 ? notes.map((note) => (
                            <div key={note.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800 overflow-hidden">
                                <div 
                                    onClick={() => toggleExpand(note.id)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${
                                            note.type === 'CHEAT_SHEET' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                                            note.type === 'BULLETS' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                                            'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                        }`}>
                                            {getTypeIcon(note.type)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-800 dark:text-slate-200">{note.topic}</h3>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">{getTypeLabel(note.type)} • {new Date(note.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        {expandedNoteId === note.id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                    </div>
                                </div>
                                
                                {expandedNoteId === note.id && (
                                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2">
                                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap leading-relaxed mb-3">
                                            {note.content}
                                        </div>
                                        
                                        <div className="flex justify-between items-center mt-4">
                                            <button 
                                                onClick={() => togglePodcast(note)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                    playingNoteId === note.id 
                                                    ? 'bg-indigo-600 text-white shadow-lg' 
                                                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                                                }`}
                                            >
                                                {isProcessingAudio && playingNoteId === note.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : playingNoteId === note.id ? (
                                                    <Pause size={14} fill="currentColor" />
                                                ) : (
                                                    <Headphones size={14} />
                                                )}
                                                {playingNoteId === note.id ? 'Playing Podcast...' : 'Listen to Summary'}
                                            </button>

                                            <button 
                                                onClick={() => copyToClipboard(note.content)}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? 'Copied' : 'Copy Text'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="text-center py-12 opacity-50">
                                <BookOpen size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                <p className="text-slate-400 dark:text-slate-500 font-light">No notes saved yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
