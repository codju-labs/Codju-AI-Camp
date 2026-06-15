import { atom } from 'nanostores';

export const activeIndex = atom(0);
export const completedIndices = atom<Set<number>>(new Set());
export const totalSections = atom(0);
export const isFinished = atom(false);

export function completeSection(index: number, autoAdvance: boolean = true) {
    const currentCompleted = completedIndices.get();
    if (!currentCompleted.has(index)) {
        const nextCompleted = new Set(currentCompleted);
        nextCompleted.add(index);
        completedIndices.set(nextCompleted);

        // Auto-advance if requested and it's the current section
        if (autoAdvance && index === activeIndex.get()) {
            nextSection();
        }
    }
}

export function nextSection() {
    const current = activeIndex.get();
    const nextIndex = current + 1;
    if (nextIndex >= totalSections.get()) {
        isFinished.set(true);
    } else {
        activeIndex.set(nextIndex);
    }
}

export function resetLesson() {
    activeIndex.set(0);
    completedIndices.set(new Set());
    isFinished.set(false);
}

export function setTotal(count: number) {
    totalSections.set(count);
    isFinished.set(false);
}
