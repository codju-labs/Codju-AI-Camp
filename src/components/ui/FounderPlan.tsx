import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * FounderPlan — AI Creator Camp Day 5, Level 1. The student builds a startup
 * plan by CHOOSING (no typing): a problem, an app idea, who it's for, and a
 * brand name. The plan is saved to localStorage `aicc-startup-plan` and flows
 * into the pitch (Level 2) and the app build (Level 3).
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Plan {
  problem: string;
  product: string;
  audience: string;
  name: string;
}

const STORAGE_KEY = "aicc-startup-plan";

interface Cat {
  key: keyof Plan;
  label: string;
  hint: string;
  dot: string;
  options: string[];
}

const CATS: Cat[] = [
  {
    key: "problem",
    label: "The problem",
    hint: "what bugs you?",
    dot: "bg-[#8B4EC4]",
    options: [
      "Kids forget their homework",
      "Lost items pile up at school",
      "Revising for tests is boring",
      "There is too much plastic waste",
      "New students feel lonely",
    ],
  },
  {
    key: "product",
    label: "Your app idea",
    hint: "what will you build?",
    dot: "bg-blue-500",
    options: [
      "A reminder app",
      "A lost-and-found app",
      "A quiz game app",
      "A recycling tracker app",
      "A buddy-finder app",
    ],
  },
  {
    key: "audience",
    label: "Who it's for",
    hint: "your customer",
    dot: "bg-emerald-500",
    options: ["Students my age", "My whole school", "Parents and kids", "My class", "Total beginners"],
  },
  {
    key: "name",
    label: "Your brand name",
    hint: "make it catchy",
    dot: "bg-amber-500",
    options: ["TaskTiger", "FindIt", "QuizQuest", "EcoTrack", "BuddyUp"],
  },
];

export const FounderPlan: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [pick, setPick] = useState<Partial<Plan>>({});
  const [saved, setSaved] = useState<Plan | null>(null);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const loaded = useRef(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const plan = JSON.parse(raw) as Plan;
        setPick(plan);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const ready = CATS.every((c) => pick[c.key]);

  const make = () => {
    if (!ready) {
      setErr("Make a choice in all four boxes.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErr("");
    const plan = pick as Plan;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      /* ignore */
    }
    setSaved(plan);
    completeSection(sectionIndex, false);
    setTimeout(() => {
      planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const reset = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setPick({});
  };

  const savedRows: [string, string][] = saved
    ? [
        ["The problem", saved.problem],
        ["Your app", saved.product],
        ["Who it's for", saved.audience],
        ["Brand name", saved.name],
      ]
    : [];

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Every startup begins with a plan. Tap your choices to build yours.
      </div>

      {CATS.map((c) => (
        <div key={c.key} className="rounded-3xl border-2 border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.dot} text-sm font-black text-white`}>{c.label.charAt(0)}</span>
            <span className="text-lg font-black text-slate-800">{c.label}</span>
            <span className="text-base font-bold text-slate-400">· {c.hint}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {c.options.map((o) => (
              <button
                key={o}
                onClick={() => setPick((p) => ({ ...p, [c.key]: o }))}
                className={`rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition active:scale-95 ${
                  pick[c.key] === o ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4]"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}

      {err && <p className="text-center text-base font-bold text-red-500">{err}</p>}
      <div className="flex justify-center">
        <button onClick={make} className={`rounded-full px-12 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${ready ? "bg-[#8B4EC4] hover:bg-[#7a41b0]" : "bg-slate-300"}`}>
          Startup Plan
        </button>
      </div>

      {saved && (
        <>
          <div ref={planRef} className="overflow-hidden rounded-3xl border-2 border-indigo-200 shadow-sm" style={{ animation: "fpPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
            <div className="bg-gradient-to-br from-[#8B4EC4] to-indigo-600 px-6 py-5 text-white">
              <p className="text-sm font-black uppercase tracking-widest text-indigo-100">My startup</p>
              <p className="text-3xl font-black leading-tight">{saved.name}</p>
            </div>
            <div className="space-y-3 bg-white px-6 py-5">
              {savedRows.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="text-lg font-bold text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-indigo-100 bg-indigo-50/60 px-6 py-5">
              <p className="text-center text-lg font-black text-[#15803d]">
                That's your startup. The next lessons turn it into a pitch, a Gamma deck prompt, and an app prompt.
              </p>
              <div className="mt-4 flex justify-center">
                <button onClick={reset} className="rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-base font-black text-slate-500 transition hover:border-[#8B4EC4] hover:text-[#8B4EC4]">
                  Start over
                </button>
              </div>
            </div>
          </div>
          <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
          <style>{`@keyframes fpPop { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="fpPop"]{animation:none!important;}}`}</style>
        </>
      )}
    </div>
  );
};
