import React from 'react';
import { useStore } from '@nanostores/react';
import { completedIndices, completeSection } from '../learning/lessonStore';

interface RevealButtonProps {
    sectionIndex: number;
    text?: string;
}

export const RevealButton: React.FC<RevealButtonProps> = ({ sectionIndex, text = "Continue" }) => {
    const $completedIndices = useStore(completedIndices);
    const isCompleted = $completedIndices.has(sectionIndex);

    if (isCompleted) return null;

    return (
        <div className="flex justify-center mt-12">
            <button
                onClick={() => completeSection(sectionIndex)}
                className="w-full bg-[#8B4EC4] hover:bg-[#7a41b0] text-white px-8 sm:px-16 py-4 rounded-full font-black text-lg transition-all transform active:scale-95 shadow-md sm:w-auto"
            >
                {text}
            </button>
        </div>
    );
};
