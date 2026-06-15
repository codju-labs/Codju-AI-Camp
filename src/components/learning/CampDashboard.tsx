import React, { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { loadProgress, progressStore } from "./progressStore";

const dayOneLevels = [
  { id: "aicc-meet-ai", title: "About AI", summary: "Discover what AI is and how it learns." },
  { id: "aicc-magic-words", title: "The Magic Words", summary: "See how better prompts create better answers." },
  { id: "aicc-meet-tools", title: "Meet the Tools", summary: "Pick the right AI teammate for each job." },
  { id: "aicc-rctf", title: "The R-C-T-F Recipe", summary: "Build strong prompts with four ingredients." },
  { id: "aicc-prompting-in-action", title: "Prompting in Action", summary: "Create, study, and research with AI." },
  { id: "aicc-prompt-master", title: "Become the Prompt Master", summary: "Quiz, debate, and build your AI superhero." },
];

const futureDays = [
  ["Day 2", "Creativity with AI"],
  ["Day 3", "AI Research Skills"],
  ["Day 4", "Think Like a Founder"],
  ["Day 5", "Build a Website"],
  ["Day 6", "Create an AI Agent"],
  ["Day 7", "Demo Day"],
];

export function CampDashboard() {
  const progress = useStore(progressStore);

  useEffect(() => {
    void loadProgress();
  }, []);

  const completed = progress.completedLevels.filter((id) =>
    dayOneLevels.some((level) => level.id === id),
  );
  const nextLevel =
    dayOneLevels.find((level) => !completed.includes(level.id)) ?? dayOneLevels[0];
  const percentage = Math.round((completed.length / dayOneLevels.length) * 100);

  return (
    <>
      <section className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 py-10 sm:px-5 md:py-14 lg:px-12">
        <div className="w-lim">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-100 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
              <span className="text-xs font-bold tracking-wide text-purple-700">
                DAY 1 IS OPEN
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-extrabold text-gray-800 sm:text-4xl">
              Become an <span className="text-purple-600">AI Creator</span>
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-gray-500 md:text-base">
              Learn the foundations of AI, practise prompt engineering, and finish
              the day by designing your own AI superhero.
            </p>
            <div className="mb-7 flex flex-wrap justify-center gap-2">
              <span className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm">
                6 interactive levels
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
              {completed.length ? "Continue Day 1" : "Start Day 1"}
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
                Day 1 · Prompt Engineering
              </h2>
            </div>
            <div className="min-w-52">
              <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                <span>{completed.length} of {dayOneLevels.length} complete</span>
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dayOneLevels.map((level, index) => {
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
                  <h3 className="mb-2 text-lg font-bold text-gray-800">{level.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{level.summary}</p>
                </a>
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
            {futureDays.map(([day, title]) => (
              <div
                key={day}
                className="rounded-2xl border-2 border-purple-100 bg-white/70 p-5 opacity-75"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                    {day}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v4" />
                    </svg>
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-700">{title}</h3>
                <p className="mt-2 text-xs font-semibold text-gray-400">Locked for now</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
