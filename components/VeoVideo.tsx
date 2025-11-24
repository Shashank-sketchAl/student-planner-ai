import React, { useState, useEffect, useRef } from 'react';
import { Upload, Film, Loader2, AlertCircle, Key, RefreshCcw } from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';

const LOADING_MESSAGES = [
    "Analyzing your image...",
    "Dreaming up movement...",
    "Constructing the scene...",
    "Applying physics...",
    "Rendering pixels...",
    "Polishing the frames...",
    "Almost there..."
];

export const VeoVideo: React.FC = () => {
    const [hasKey, setHasKey] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkKey();
    }, []);

    useEffect(() => {
        let interval: any;
        if (isGenerating) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 4000);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    const checkKey = async () => {
        if ((window as any).aistudio) {
            const selected = await (window as any).aistudio.hasSelectedApiKey();
            setHasKey(selected);
        }
    };

    const handleSelectKey = async () => {
        try {
            if ((window as any).aistudio) {
                await (window as any).aistudio.openSelectKey();
                await checkKey();
            }
        } catch (e) {
            console.error("Key selection failed", e);
            setError("Failed to select API key. Please try again.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setVideoUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile || !hasKey) return;

        setIsGenerating(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessageIndex(0);

        try {
            const url = await generateVeoVideo(imageFile, aspectRatio, prompt);
            setVideoUrl(url);
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes("Requested entity was not found")) {
                setError("API Key session invalid. Please select your key again.");
                setHasKey(false);
            } else {
                setError("Failed to generate video. Please try again later.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="pb-28 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Veo</h1>
                    <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Beta</span>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Bring your images to life.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
                {/* API Key Check */}
                {!hasKey ? (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-[2rem] p-8 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-300">
                            <Key size={32} />
                        </div>
                        <h2 className="text-xl font-medium text-slate-800 dark:text-slate-100 mb-2">Unlock Veo</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-xs">
                            To generate videos, you need to connect your paid Google Cloud API key.
                        </p>
                        <button 
                            onClick={handleSelectKey}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                        >
                            Select API Key
                        </button>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="mt-4 text-xs text-indigo-400 underline">
                            Learn about billing
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Main Interaction Area */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
                            
                            {/* Image Upload */}
                            <div 
                                onClick={() => !isGenerating && fileInputRef.current?.click()}
                                className={`relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 ${
                                    isGenerating ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-300 dark:hover:border-indigo-700 border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                            <Upload size={20} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Tap to upload image</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports JPG, PNG</p>
                                    </div>
                                )}
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                                {previewUrl && !isGenerating && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium flex items-center gap-2"><RefreshCcw size={16}/> Change Image</span>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setAspectRatio('16:9')}
                                            disabled={isGenerating}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                                                aspectRatio === '16:9' 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                                : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            Landscape (16:9)
                                        </button>
                                        <button 
                                            onClick={() => setAspectRatio('9:16')}
                                            disabled={isGenerating}
                                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                                                aspectRatio === '9:16' 
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                                                : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            Portrait (9:16)
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Prompt (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={isGenerating}
                                        placeholder="e.g. A neon hologram of a cat driving..."
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 text-sm placeholder-slate-300 dark:placeholder-slate-600 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={!imageFile || isGenerating}
                                    className={`w-full py-4 rounded-2xl font-medium text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        !imageFile || isGenerating
                                        ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none text-slate-500'
                                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-95'
                                    }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Film size={20} />
                                            <span>Generate Video</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Status / Output Area */}
                        {isGenerating && (
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-50 dark:border-slate-800 text-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="relative w-16 h-16 mx-auto mb-4">
                                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Film size={20} className="text-indigo-500" />
                                    </div>
                                </div>
                                <h3 className="text-slate-800 dark:text-slate-200 font-medium text-lg mb-1">Creating Magic</h3>
                                <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">
                                    {LOADING_MESSAGES[loadingMessageIndex]}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-300 text-sm border border-rose-100 dark:border-rose-900/30 animate-in fade-in">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {videoUrl && (
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-lg border border-slate-50 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-8">
                                <h3 className="text-slate-800 dark:text-slate-200 font-medium mb-3 px-2">Result</h3>
                                <div className={`relative rounded-2xl overflow-hidden bg-black ${aspectRatio === '9:16' ? 'aspect-[9/16] max-w-xs mx-auto' : 'aspect-video'}`}>
                                    <video 
                                        src={videoUrl} 
                                        controls 
                                        autoPlay 
                                        loop 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="mt-4 flex justify-end px-2">
                                     <a 
                                        href={videoUrl} 
                                        download="mindful-veo-creation.mp4"
                                        className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center gap-1"
                                     >
                                         Download MP4
                                     </a>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};