
import React, { useState } from 'react';
import { FlashcardDeck, Flashcard } from '../types';
import { Layers, Plus, Loader2, Sparkles, Trash2, ArrowRight, RotateCcw, Check, X } from 'lucide-react';
import { generateFlashcards } from '../services/geminiService';

interface FlashcardsProps {
    decks: FlashcardDeck[];
    onAddDeck: (deck: Omit<FlashcardDeck, 'id'>) => void;
    onDeleteDeck: (id: string) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ decks, onAddDeck, onDeleteDeck }) => {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        try {
            const cardsData = await generateFlashcards(topic);
            const cards: Flashcard[] = cardsData.map((c, i) => ({
                id: `card-${Date.now()}-${i}`,
                front: c.front,
                back: c.back,
                status: 'new'
            }));

            onAddDeck({
                userId: '', // Handled by App
                topic,
                cards,
                createdAt: new Date(),
                mastery: 0
            });
            setTopic('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const activeDeck = decks.find(d => d.id === activeDeckId);

    const handleNextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            if (activeDeck && currentCardIndex < activeDeck.cards.length - 1) {
                setCurrentCardIndex(prev => prev + 1);
            } else {
                // End of deck
                setCurrentCardIndex(0);
                setActiveDeckId(null);
            }
        }, 200);
    };

    return (
        <div className="pb-24 h-full flex flex-col bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
            <header className="px-6 pt-10 pb-4 sticky top-0 z-20 bg-[#FDFBF7] dark:bg-slate-950 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-light text-slate-800 dark:text-slate-100">Flashcards</h1>
                    <Layers className="text-indigo-500" strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Active recall boosts memory.</p>
            </header>

            <div className="flex-1 px-6 py-2 overflow-y-auto no-scrollbar space-y-6">
                
                {activeDeck ? (
                    // STUDY MODE
                    <div className="flex flex-col h-full pb-10">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setActiveDeckId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                Close
                            </button>
                            <span className="text-sm font-bold text-slate-500">
                                {currentCardIndex + 1} / {activeDeck.cards.length}
                            </span>
                        </div>

                        <div className="perspective-1000 flex-1 flex items-center justify-center min-h-[400px]">
                            <div 
                                onClick={() => setIsFlipped(!isFlipped)}
                                className={`relative w-full h-full max-h-[500px] transition-transform duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                            >
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Question</span>
                                    <p className="text-2xl font-medium text-slate-800 dark:text-slate-100">{activeDeck.cards[currentCardIndex].front}</p>
                                    <p className="absolute bottom-8 text-slate-400 text-sm animate-pulse">Tap to flip</p>
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden bg-indigo-600 dark:bg-indigo-900 rounded-[2.5rem] shadow-xl p-8 flex flex-col items-center justify-center text-center text-white" style={{ transform: 'rotateY(180deg)' }}>
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4">Answer</span>
                                    <p className="text-2xl font-medium">{activeDeck.cards[currentCardIndex].back}</p>
                                </div>
                            </div>
                        </div>

                        {isFlipped && (
                            <div className="flex gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
                                <button 
                                    onClick={handleNextCard}
                                    className="flex-1 py-4 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center gap-2"
                                >
                                    <X size={20} />
                                    Hard
                                </button>
                                <button 
                                    onClick={handleNextCard}
                                    className="flex-1 py-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-2"
                                >
                                    <Check size={20} />
                                    Easy
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // LIST MODE
                    <>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                            <form onSubmit={handleCreateDeck}>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        disabled={isGenerating}
                                        placeholder="Generate Deck: e.g. 'Cell Biology'"
                                        className="w-full pl-4 pr-14 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-700 dark:text-slate-200 placeholder-slate-400"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!topic || isGenerating}
                                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white rounded-lg px-3 flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="grid gap-4">
                            {decks.map(deck => (
                                <div key={deck.id} onClick={() => { setCurrentCardIndex(0); setActiveDeckId(deck.id); }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 relative group cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500">
                                            <Layers size={24} />
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.id); }}
                                            className="text-slate-300 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-medium text-slate-800 dark:text-slate-100 mb-1">{deck.topic}</h3>
                                    <p className="text-slate-400 text-sm mb-4">{deck.cards.length} cards</p>
                                    
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                        Start Learning <ArrowRight size={16} />
                                    </div>
                                </div>
                            ))}
                            
                            {decks.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <Layers size={40} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-400">No decks yet.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
