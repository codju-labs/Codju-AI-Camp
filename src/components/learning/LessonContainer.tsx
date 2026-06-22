import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { isFinished, resetLesson, setTotal } from "./lessonStore";
import { completeLevel } from "./progressStore";
import { LessonAppBar } from "./LessonAppBar";
import { getOpenLevels, hasFullCampAccess } from "../../lib/campContent";

interface LessonContainerProps {
  children: React.ReactNode;
  levelId: string;
  levelTitle: string;
  sectionCount: number;
}

export function LessonContainer({
  children,
  levelId,
  levelTitle,
  sectionCount,
}: LessonContainerProps) {
  const finished = useStore(isFinished);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const accessOptions = { unlockAllAvailableDays: hasFullCampAccess(userEmail) };
  const openLevelIds = getOpenLevels(new Date(), accessOptions).map((level) => level.id);
  const currentIndex = openLevelIds.indexOf(levelId);
  const nextLevelId = currentIndex >= 0 ? openLevelIds[currentIndex + 1] ?? null : null;

  useEffect(() => {
    resetLesson();
    setTotal(sectionCount);
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setUserEmail(data?.user?.email ?? null);
      })
      .catch(() => {})
      .finally(() => setAuthLoaded(true));
  }, [levelId, sectionCount]);

  useEffect(() => {
    if (finished) void completeLevel(levelId);
  }, [finished, levelId]);

  if (currentIndex < 0) {
    return (
      <div className="min-h-screen bg-white">
        <LessonAppBar levelTitle={levelTitle} sectionCount={sectionCount} />
        <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-16">
          <section className="w-full max-w-xl rounded-3xl border-2 border-purple-200 bg-white p-8 text-center shadow-xl md:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-3xl font-black text-purple-700">
              {authLoaded ? "Soon" : "..."}
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-600">
              {authLoaded ? "Available soon" : "Checking access"}
            </p>
            <h1 className="mb-3 text-3xl font-extrabold text-gray-800">
              {levelTitle}
            </h1>
            <p className="mb-8 text-base text-gray-500">
              {authLoaded
                ? "This lesson opens automatically on its camp day. Day 1 is open now."
                : "One moment while we load your portal access."}
            </p>
            {authLoaded && (
              <a
                href="/learn"
                className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#8623d5] bg-[#8623d5] px-6 py-3 text-sm font-bold text-white no-underline transition hover:bg-purple-600 sm:w-auto"
              >
                Return to camp
              </a>
            )}
          </section>
        </main>
      </div>
    );
  }

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
