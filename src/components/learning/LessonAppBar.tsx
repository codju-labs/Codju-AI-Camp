import React from "react";
import { useStore } from "@nanostores/react";
import {
  activeIndex,
  completedIndices,
  isFinished,
} from "./lessonStore";

interface LessonAppBarProps {
  levelTitle: string;
  sectionCount: number;
}

export function LessonAppBar({
  levelTitle,
  sectionCount,
}: LessonAppBarProps) {
  const currentSection = useStore(activeIndex);
  const completed = useStore(completedIndices);
  const finished = useStore(isFinished);
  const completedCount = finished
    ? sectionCount
    : Math.min(completed.size, sectionCount);
  const progress = sectionCount > 0
    ? Math.max((completedCount / sectionCount) * 100, 2)
    : 0;
  const step = finished
    ? sectionCount
    : Math.min(currentSection + 1, sectionCount);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-12">
        <div className="min-w-0 flex-1 sm:max-w-56">
          <p className="truncate font-heading text-sm font-extrabold text-gray-700 sm:text-[15px]">
            {levelTitle}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:hidden">
            Step {step} of {sectionCount}
          </p>
        </div>

        <div className="flex min-w-24 flex-[2] items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-label="Level progress"
            aria-valuemin={0}
            aria-valuemax={sectionCount}
            aria-valuenow={completedCount}
          >
            <div
              className="h-full rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="hidden whitespace-nowrap text-xs font-bold text-gray-400 sm:block">
            {completedCount}/{sectionCount}
          </span>
        </div>

        <a
          href="/learn"
          aria-label="Close level"
          title="Close level"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400 no-underline transition hover:bg-purple-50 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M6 6l12 12M18 6 6 18"
            />
          </svg>
        </a>
      </div>
    </header>
  );
}
