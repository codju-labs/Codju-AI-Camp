import React, { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { isFinished, resetLesson, setTotal } from "./lessonStore";
import { completeLevel } from "./progressStore";
import { LessonAppBar } from "./LessonAppBar";

interface LessonContainerProps {
  children: React.ReactNode;
  levelId: string;
  levelTitle: string;
  sectionCount: number;
  nextLevelId: string | null;
}

export function LessonContainer({
  children,
  levelId,
  levelTitle,
  sectionCount,
  nextLevelId,
}: LessonContainerProps) {
  const finished = useStore(isFinished);

  useEffect(() => {
    resetLesson();
    setTotal(sectionCount);
  }, [levelId, sectionCount]);

  useEffect(() => {
    if (finished) void completeLevel(levelId);
  }, [finished, levelId]);

  return (
    <div className="min-h-screen bg-white">
      <LessonAppBar levelTitle={levelTitle} sectionCount={sectionCount} />

      {!finished ? (
        <main className="pb-28">{children}</main>
      ) : (
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-16">
          <section className="w-full max-w-xl rounded-3xl border-2 border-purple-200 bg-white p-8 text-center shadow-xl md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-3xl font-black text-purple-700">
              ✓
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-600">
              Level complete
            </p>
            <h1 className="mb-3 text-3xl font-extrabold text-gray-800">
              {levelTitle}
            </h1>
            <p className="mb-8 text-base text-gray-500">
              Your progress has been saved. Keep the momentum going.
            </p>
            <a
              href={nextLevelId ? `/learn/lesson/${nextLevelId}` : "/learn"}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#8623d5] bg-[#8623d5] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-purple-600 sm:w-auto"
            >
              {nextLevelId ? "Start next level" : "Return to camp"}
            </a>
          </section>
        </main>
      )}
    </div>
  );
}
