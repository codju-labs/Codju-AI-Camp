import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * DpaaPlan — AI Creator Camp Day 4, Level 2. The student runs the four DPAA
 * moves on a real project by CHOOSING from options (no typing). Pick a
 * project, then tap the parts (D), the repeat (P), what to keep (A), and the
 * order (A). The choices assemble into a one-page build plan. Saved to
 * localStorage so it carries into the website build.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface KeepOpt {
  label: string;
  keep: boolean; // true = a good "keep", false = a noise option to leave out
}

interface ProjectDef {
  id: string;
  name: string;
  parts: string[];
  patterns: string[]; // pick the one repeating unit
  keeps: KeepOpt[];
  steps: string[]; // tap into order
}

const PROJECTS: ProjectDef[] = [
  {
    id: "lostfound",
    name: "A Lost & Found website for my school",
    parts: ["Report a lost item", "Report a found item", "A list of all items", "Mark an item claimed", "A search box"],
    patterns: ["Every item = photo + name + place + date", "Every visitor is totally different", "Nothing repeats at all"],
    keeps: [
      { label: "Item name", keep: true },
      { label: "Photo", keep: true },
      { label: "A way to contact", keep: true },
      { label: "Fancy animations", keep: false },
      { label: "Login accounts", keep: false },
    ],
    steps: ["Someone reports an item", "It appears in the list", "The owner spots it", "The owner claims it"],
  },
  {
    id: "fanpage",
    name: "A fan page about something I love",
    parts: ["A big home banner", "An about section", "A photo gallery", "Fun facts", "A follow button"],
    patterns: ["Every gallery card = photo + caption", "Every fan is different", "Nothing is the same"],
    keeps: [
      { label: "Best photos", keep: true },
      { label: "Short captions", keep: true },
      { label: "One clear title", keep: true },
      { label: "Long essays", keep: false },
      { label: "Auto-playing music", keep: false },
    ],
    steps: ["Welcome the visitor", "Show the best stuff", "Tell the story", "Invite them to follow"],
  },
  {
    id: "studyhelper",
    name: "A study helper site for my class",
    parts: ["A topic list", "Short notes", "A quiz", "Flashcards", "A timer"],
    patterns: ["Every topic = title + notes + a quiz", "Every student is different", "Nothing repeats"],
    keeps: [
      { label: "Clear notes", keep: true },
      { label: "Quizzes", keep: true },
      { label: "A simple layout", keep: true },
      { label: "Flashy effects", keep: false },
      { label: "Pop-up ads", keep: false },
    ],
    steps: ["Pick a topic", "Read the notes", "Take the quiz", "Check your score"],
  },
];

const STORAGE_KEY = "aicc-dpaa-plan";

interface SavedPlan {
  idea: string;
  decompose: string;
  pattern: string;
  abstraction: string;
  algorithm: string;
}

const MOVES = [
  { key: "decompose", letter: "D", name: "Decompose", hint: "Tap the parts it needs.", dot: "bg-[#8B4EC4]" },
  { key: "pattern", letter: "P", name: "Pattern", hint: "Tap the thing that repeats.", dot: "bg-blue-500" },
  { key: "abstraction", letter: "A", name: "Abstraction", hint: "Tap what to keep for version 1.", dot: "bg-emerald-500" },
  { key: "algorithm", letter: "A", name: "Algorithm", hint: "Tap the steps in order.", dot: "bg-amber-500" },
] as const;

export const DpaaPlan: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [pid, setPid] = useState<string | null>(null);
  const [parts, setParts] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<number | null>(null);
  const [keep, setKeep] = useState<Set<number>>(new Set());
  const [order, setOrder] = useState<number[]>([]);
  const [saved, setSaved] = useState<SavedPlan | null>(null);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const loaded = useRef(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
  }, []);

  const project = PROJECTS.find((p) => p.id === pid) || null;

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void, i: number) => {
    const n = new Set(set);
    n.has(i) ? n.delete(i) : n.add(i);
    setter(n);
  };

  const tapStep = (i: number) => {
    if (order.includes(i)) return;
    setOrder((o) => [...o, i]);
  };

  const ready =
    project && parts.size >= 1 && pattern !== null && keep.size >= 1 && order.length === project.steps.length;

  const makePlan = () => {
    if (!project || !ready) {
      setErr("Make a choice for all four moves first.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErr("");
    const plan: SavedPlan = {
      idea: project.name,
      decompose: [...parts].map((i) => project.parts[i]).join(", "),
      pattern: project.patterns[pattern],
      abstraction: [...keep].map((i) => project.keeps[i].label).join(", "),
      algorithm: order.map((i) => project.steps[i]).join("  ->  "),
    };
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

  const resetPlan = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSaved(null);
    setPid(null);
    setParts(new Set());
    setPattern(null);
    setKeep(new Set());
    setOrder([]);
  };

  const savedRows: [string, string][] = saved
    ? [
        ["D - Decompose", saved.decompose],
        ["P - Pattern", saved.pattern],
        ["A - Abstraction", saved.abstraction],
        ["A - Algorithm", saved.algorithm],
      ]
    : [];

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Same four moves, your real idea. Tap your choices to build the plan.
      </div>

      {/* Pick a project */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Pick a project</p>
        <div className="mt-3 flex flex-col gap-2">
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setPid(p.id); setParts(new Set()); setPattern(null); setKeep(new Set()); setOrder([]); }}
              className={`rounded-2xl border-2 px-5 py-3 text-left text-lg font-black transition active:scale-[0.98] ${
                pid === p.id ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4]"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {project && (
        <>
          {/* D — Decompose (multi) */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B4EC4] text-sm font-black text-white">D</span>
              <span className="text-lg font-black text-slate-800">Decompose</span>
              <span className="text-base font-bold text-slate-400">· tap the parts it needs</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {project.parts.map((p, i) => (
                <button key={i} onClick={() => toggle(parts, setParts, i)} className={`rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition active:scale-95 ${parts.has(i) ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-700"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* P — Pattern (single) */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-black text-white">P</span>
              <span className="text-lg font-black text-slate-800">Pattern</span>
              <span className="text-base font-bold text-slate-400">· tap the thing that repeats</span>
            </div>
            <div className="flex flex-col gap-2">
              {project.patterns.map((p, i) => (
                <button key={i} onClick={() => setPattern(i)} className={`rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition active:scale-[0.98] ${pattern === i ? "border-blue-400 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* A — Abstraction (multi keep) */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-white">A</span>
              <span className="text-lg font-black text-slate-800">Abstraction</span>
              <span className="text-base font-bold text-slate-400">· tap what to keep for version 1</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {project.keeps.map((k, i) => (
                <button key={i} onClick={() => toggle(keep, setKeep, i)} className={`rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition active:scale-95 ${keep.has(i) ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* A — Algorithm (order) */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-white">A</span>
              <span className="text-lg font-black text-slate-800">Algorithm</span>
              <span className="text-base font-bold text-slate-400">· tap the steps in order</span>
            </div>
            <div className="flex flex-col gap-2">
              {project.steps.map((s, i) => {
                const picked = order.indexOf(i);
                return (
                  <button key={i} onClick={() => tapStep(i)} disabled={picked !== -1} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition active:scale-[0.98] ${picked !== -1 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700"}`}>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white ${picked !== -1 ? "bg-amber-500" : "bg-slate-300"}`}>{picked !== -1 ? picked + 1 : "?"}</span>
                    {s}
                  </button>
                );
              })}
            </div>
            {order.length > 0 && order.length < project.steps.length && (
              <button onClick={() => setOrder([])} className="mt-2 text-sm font-bold text-slate-400 underline">reset order</button>
            )}
          </div>

          {err && <p className="text-center text-base font-bold text-red-500">{err}</p>}
          <div className="flex justify-center">
            <button onClick={makePlan} className={`rounded-full px-12 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${ready ? "bg-[#8B4EC4] hover:bg-[#7a41b0]" : "bg-slate-300"}`}>
              Build Plan
            </button>
          </div>
        </>
      )}

      {saved && (
        <>
          <div ref={planRef} className="overflow-hidden rounded-3xl border-2 border-indigo-200 shadow-sm" style={{ animation: "dpPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
            <div className="bg-gradient-to-br from-[#8B4EC4] to-indigo-600 px-6 py-5 text-white">
              <p className="text-sm font-black uppercase tracking-widest text-indigo-100">My build plan</p>
              <p className="text-2xl font-black leading-tight">{saved.idea}</p>
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
                This plan is your blueprint. In the next lesson, it turns into prompts for Lovable and Canva.
              </p>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={resetPlan}
                  className="rounded-full border-2 border-slate-200 bg-white px-6 py-3 text-base font-black text-slate-500 transition hover:border-[#8B4EC4] hover:text-[#8B4EC4]"
                >
                  Start over
                </button>
              </div>
            </div>
          </div>
          <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
          <style>{`@keyframes dpPop { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="dpPop"]{animation:none!important;}}`}</style>
        </>
      )}
    </div>
  );
};
