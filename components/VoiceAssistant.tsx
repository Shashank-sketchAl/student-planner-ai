
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, StopCircle, Sparkles, Bot } from 'lucide-react';
import { processVoiceCommand } from '../services/geminiService';
import { Priority } from '../types';

interface VoiceAssistantProps {
    onAddTask: (task: any) => void;
    onAddExam: (exam: any) => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onAddTask, onAddExam }) => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiResponse, setAiResponse] = useState("Tap the microphone to start.");
    
    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (transcript.trim()) {
                    handleVoiceCommand(transcript);
                }
            };
            
            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                setAiResponse("I didn't catch that. Please try again.");
            };
        } else {
            setAiResponse("Voice recognition is not supported in this browser.");
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthRef.current) synthRef.current.cancel();
        };
    }, [transcript]); // Transcript dependency to capture latest value in onend if needed, though handling via state is better

    const handleVoiceCommand = async (text: string) => {
        if (!text) return;
        setIsProcessing(true);
        
        try {
            const result = await processVoiceCommand(text);
            
            setAiResponse(result.spokenResponse);
            speak(result.spokenResponse);

            if (result.actionType === 'ADD_TASK' && result.taskData) {
                onAddTask({
                    title: result.taskData.title,
                    course: result.taskData.course,
                    dueDate: new Date(result.taskData.dueDate),
                    priority: result.taskData.priority as Priority
                });
            } else if (result.actionType === 'ADD_EXAM' && result.examData) {
                onAddExam({
                    subject: result.examData.subject,
                    location: result.examData.location,
                    date: new Date(result.examData.date)
                });
            }

        } catch (error) {
            console.error(error);
            setAiResponse("Sorry, I had trouble connecting. Please try again.");
            speak("Sorry, I had trouble connecting.");
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text: string) => {
        if (!synthRef.current) return;
        synthRef.current.cancel(); // Stop previous
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.rate = 1;
        utterance.pitch = 1;
        
        // Try to select a pleasant voice
        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US');
        if (preferredVoice) utterance.voice = preferredVoice;

        synthRef.current.speak(utterance);
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            setAiResponse("Listening...");
            synthRef.current?.cancel(); // Stop speaking if listening
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl transition-all duration-1000 ${isListening ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-3xl transition-all duration-1000 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
            </div>

            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-transparent">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">AI Assistant</h1>
                    <Bot className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Hands-free help for your studies.</p>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
                
                {/* Chat Bubble - AI Response */}
                <div className={`w-full max-w-lg mb-8 transition-all duration-500 ${aiResponse && !isListening ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-4'}`}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 dark:shadow-none border border-indigo-50 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                                {isSpeaking ? <Volume2 size={20} className="animate-pulse" /> : <Sparkles size={20} />}
                             </div>
                             <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                {isProcessing ? "Thinking..." : "Assistant"}
                             </span>
                        </div>
                        <p className="text-xl md:text-2xl font-light text-slate-700 dark:text-slate-200 leading-relaxed">
                            {aiResponse}
                        </p>
                    </div>
                </div>

                {/* User Transcript Display */}
                <div className={`h-20 flex items-center justify-center w-full text-center transition-opacity duration-300 ${transcript ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                        "{transcript}"
                    </p>
                </div>

                {/* Main Interaction Button */}
                <div className="mt-8 relative">
                    {/* Ripple Effects */}
                    {isListening && (
                        <>
                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-10 delay-150"></div>
                        </>
                    )}
                    
                    <button 
                        onClick={toggleListening}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                            isListening 
                            ? 'bg-rose-500 text-white scale-110' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
                        }`}
                    >
                        {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                </div>
                
                <p className="mt-6 text-sm text-slate-400 dark:text-slate-500 font-medium animate-in fade-in">
                    {isListening ? "Listening..." : "Tap to Speak"}
                </p>
                
                {!isListening && (
                     <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-xs">
                        {["Add math homework", "Explain Quantum Physics", "I feel stressed", "Summarize Chapter 4"].map((cmd) => (
                            <button 
                                key={cmd}
                                onClick={() => {
                                    setTranscript(cmd);
                                    handleVoiceCommand(cmd);
                                }}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                            >
                                "{cmd}"
                            </button>
                        ))}
                     </div>
                )}

            </div>
        </div>
    );
};
