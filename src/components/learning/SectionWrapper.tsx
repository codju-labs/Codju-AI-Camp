import React, { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { activeIndex, completedIndices } from './lessonStore';

interface SectionWrapperProps {
    index: number;
    children: React.ReactNode;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ index, children }) => {
    const $activeIndex = useStore(activeIndex);
    const $completedIndices = useStore(completedIndices);
    const sectionRef = useRef<HTMLDivElement>(null);

    const isActive = index === $activeIndex;
    const isCompleted = $completedIndices.has(index);
    const isLocked = index > $activeIndex;

    useEffect(() => {
        if (isActive && sectionRef.current) {
            setTimeout(() => {
                sectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }, 100);
        }
    }, [isActive]);

    return (
        <div
            ref={sectionRef}
            className={`transition-all duration-1000 ease-in-out py-12 md:py-24 ${isLocked ? 'opacity-20 blur-xl pointer-events-none scale-95' : 'opacity-100 blur-0 scale-100'
                } ${isActive ? 'active-section' : ''}`}
            id={`section-${index}`}
        >
            <div className="max-w-[700px] mx-auto px-4 md:px-0">
                {children}
            </div>
        </div>
    );
};
