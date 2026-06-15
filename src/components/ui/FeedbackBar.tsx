import React, { useState, useRef, useEffect } from 'react';
import { nextSection } from '../learning/lessonStore';

interface FeedbackBarProps {
    sectionIndex: number;
    explanation?: string;
    xp?: number;
    onContinue?: () => void;
    isCorrect?: boolean;
    onTryAgain?: () => void;
    onShowAnswer?: () => void;
}

export const FeedbackBar: React.FC<FeedbackBarProps> = ({
    sectionIndex,
    explanation,
    xp = 15,
    onContinue,
    isCorrect = true,
    onTryAgain,
    onShowAnswer
}) => {
    const [showExplanation, setShowExplanation] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            barRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 150);
    }, []);

    const handleContinue = () => {
        if (onContinue) {
            onContinue();
        } else {
            nextSection();
            // Scroll to next section
            setTimeout(() => {
                const element = document.getElementById(`section-${sectionIndex + 1}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    if (!isCorrect) {
        return (
            <div className="mt-8 space-y-4">
                <div className="bg-[#F0F4F9] p-6 rounded-4xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-3 px-2">
                        <span className="text-[#1E293B] font-bold text-xl">That's incorrect.</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        {onTryAgain && (
                            <button
                                onClick={onTryAgain}
                                className="bg-[#8B4EC4] hover:bg-[#7a41b0] text-white px-8 py-3 rounded-full font-bold transition-all shadow-sm w-full md:w-auto"
                            >
                                Try again
                            </button>
                        )}
                        {onShowAnswer && (
                            <button
                                onClick={onShowAnswer}
                                className="bg-[#E2E8F0] hover:bg-[#cbd5e1] text-[#1E293B] px-8 py-3 rounded-full font-bold transition-all w-full md:w-auto"
                            >
                                See answer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={barRef} className="mt-8 space-y-4">
            <div className="bg-[#E4F9E4] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎉</span>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold text-lg">Correct!</span>
                        <span className="text-emerald-600 font-bold text-lg">+{xp} XP</span>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    {explanation && (
                        <button
                            onClick={() => setShowExplanation(!showExplanation)}
                            className="bg-[#CDE6CD] hover:bg-[#bed9be] text-slate-800 px-8 py-3 rounded-full font-bold transition-all shadow-sm w-full md:w-auto"
                        >
                            {showExplanation ? 'Hide explanation' : 'Why?'}
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        className="bg-[#2EB85C] hover:bg-[#28a745] text-white px-10 py-3 rounded-full font-black tracking-tight transition-all shadow-lg shadow-emerald-100 w-full md:w-auto"
                    >
                        Continue
                    </button>
                </div>
            </div>

            {showExplanation && explanation && (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-emerald-800 font-medium leading-relaxed">
                        <span className="font-bold block mb-2 text-lg text-emerald-900">Explanation</span>
                        {explanation}
                    </p>
                </div>
            )}
        </div>
    );
};
