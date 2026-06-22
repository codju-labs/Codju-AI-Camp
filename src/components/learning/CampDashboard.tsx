import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  getLockedCampDays,
  getOpenCampDays,
  getOpenLevels,
  hasFullCampAccess,
} from "../../lib/campContent";
import { loadProgress, progressStore } from "./progressStore";

export function CampDashboard() {
  const progress = useStore(progressStore);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const accessOptions = { unlockAllAvailableDays: hasFullCampAccess(userEmail) };
  const openCampDays = getOpenCampDays(new Date(), accessOptions);
  const lockedDays = getLockedCampDays(new Date(), accessOptions);
  const allOpenLevels = getOpenLevels(new Date(), accessOptions);
  const openDayLabels = openCampDays.map((day) => day.label.toUpperCase());

  useEffect(() => {
    void loadProgress();
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setUserEmail(data?.user?.email ?? null);
      })
      .catch(() => {});
  }, []);

  const completed = progress.completedLevels.filter((id) =>
    allOpenLevels.some((level) => level.id === id),
  );
  const nextLevel =
    allOpenLevels.find((level) => !completed.includes(level.id)) ?? allOpenLevels[0];
  const percentage = Math.round((completed.length / allOpenLevels.length) * 100);

  return (
    <>
      <section className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-10 sm:px-5 md:py-14 lg:px-12">
        <div className="w-lim">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-100 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
              <span className="text-xs font-bold tracking-wide text-purple-700">
                {openDayLabels.length === 1 ? `${openDayLabels[0]} IS OPEN` : `${openDayLabels.join(", ")} ARE OPEN`}
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-extrabold text-gray-800 sm:text-4xl">
              Become an <span className="text-purple-600">AI Creator</span>
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
              Learn prompt engineering, create with AI, and build a study kit
              using the same interactive lessons from the camp.
            </p>
            <div className="mb-7 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                {allOpenLevels.length} interactive levels
              </span>
              <span className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                Progress saved
              </span>
              <span className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                Final creator project
              </span>
            </div>
            <a
              href={`/learn/lesson/${nextLevel.id}`}
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-[#8623d5] bg-[#8623d5] px-7 py-3 text-sm font-bold text-white no-underline transition hover:bg-purple-600 sm:w-auto"
            >
              {completed.length ? "Continue camp" : "Start Day 1"}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-5 md:py-14 lg:px-12">
        <div className="w-lim">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-600">
                Your journey
              </p>
              <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
                Open camp days
              </h2>
            </div>
            <div className="min-w-52">
              <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                <span>{completed.length} of {allOpenLevels.length} complete</span>
                <span>{percentage}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-purple-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {openCampDays.map((day) => {
              const dayCompleted = day.levels.filter((level) => completed.includes(level.id));
              const dayPercentage = Math.round((dayCompleted.length / day.levels.length) * 100);

              return (
                <div key={day.id} className="rounded-3xl border-2 border-purple-100 bg-purple-50/40 p-4 sm:p-6">
                  <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-600">
                        {day.label}
                      </p>
                      <h3 className="text-xl font-extrabold text-gray-800 md:text-2xl">
                        {day.title}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                        {day.description}
                      </p>
                      {day.recordingUrl && (
                        <div className="mt-5 overflow-hidden rounded-2xl border-2 border-purple-100 bg-white shadow-sm">
                          <div className="aspect-video bg-gray-100">
                            <iframe
                              className="h-full w-full"
                              src={day.recordingEmbedUrl}
                              title={`${day.label} recorded session`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
                                Recorded session
                              </p>
                              <p className="mt-1 text-sm font-semibold text-gray-700">
                                Watch the Day 1 class replay whenever you need to catch up.
                              </p>
                            </div>
                            <a
                              href={day.recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-full border-2 border-purple-200 px-4 py-2 text-xs font-bold text-purple-700 no-underline transition hover:border-purple-400 hover:bg-purple-50"
                            >
                              Open on YouTube
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-44">
                      <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                        <span>{dayCompleted.length} of {day.levels.length}</span>
                        <span>{dayPercentage}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all"
                          style={{ width: `${dayPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {day.levels.map((level, index) => {
                      const isComplete = completed.includes(level.id);
                      const isCurrent = level.id === nextLevel.id;

                      return (
                        <a
                          key={level.id}
                          href={`/learn/lesson/${level.id}`}
                          className={`rounded-2xl border-2 bg-white p-5 no-underline transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                            isCurrent ? "border-purple-400 shadow-md" : "border-purple-100 hover:border-purple-300"
                          }`}
                        >
                          <div className="mb-5 flex items-center justify-between">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 font-heading text-sm font-extrabold text-purple-700">
                              {index + 1}
                            </span>
                            <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                              isComplete
                                ? "bg-green-100 text-green-700"
                                : isCurrent
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-500"
                            }`}>
                              {isComplete ? "Complete" : isCurrent ? "Up next" : "Open"}
                            </span>
                          </div>
                          <h4 className="mb-2 text-lg font-bold text-gray-800">{level.title}</h4>
                          <p className="text-sm leading-relaxed text-gray-500">{level.summary}</p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-purple-50 px-4 py-10 sm:px-5 md:py-14 lg:px-12">
        <div className="w-lim">
          <div className="mb-7 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-purple-600">
              Coming next
            </p>
            <h2 className="text-2xl font-bold text-gray-800 md:text-3xl">
              The rest of your creator journey
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 md:text-base">
              New days unlock as the camp progresses.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lockedDays.map((day) => (
              <div
                key={day.id}
                className="rounded-2xl border-2 border-purple-100 bg-white/70 p-5 opacity-75"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                    {day.label}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4" />
                    </svg>
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-700">{day.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{day.description}</p>
                <p className="mt-2 text-xs font-semibold text-gray-400">Locked for now</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
