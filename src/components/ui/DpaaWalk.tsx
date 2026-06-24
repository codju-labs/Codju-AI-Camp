import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * DpaaWalk — AI Creator Camp Day 4, Level 1. Teaches the four moves of
 * computational thinking (Decomposition, Pattern, Abstraction, Algorithm)
 * with ONE easy worked example: "Plan the perfect pizza party". Each move is
 * a small tap interaction; the student walks D -> P -> A -> A, then the
 * section completes.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const ORDER = ["D", "P", "A1", "A2"] as const;
const META: Record<string, { letter: string; name: string; dot: string; tint: string; ink: string }> = {
  D: { letter: "D", name: "Decomposition", dot: "bg-[#8B4EC4]", tint: "bg-[#f3e8ff]", ink: "text-[#6b21a8]" },
  P: { letter: "P", name: "Pattern recognition", dot: "bg-blue-500", tint: "bg-blue-100", ink: "text-blue-800" },
  A1: { letter: "A", name: "Abstraction", dot: "bg-emerald-500", tint: "bg-emerald-100", ink: "text-emerald-800" },
  A2: { letter: "A", name: "Algorithm", dot: "bg-amber-500", tint: "bg-amber-100", ink: "text-amber-800" },
};

// D — pick the parts that belong
const D_PARTS = [
  { label: "Food", belongs: true },
  { label: "Guests", belongs: true },
  { label: "Games", belongs: true },
  { label: "Music", belongs: true },
  { label: "Homework", belongs: false },
  { label: "Spelling test", belongs: false },
];

// P — single choice
const P_OPTIONS = [
  { text: "A plate, a slice, and a drink", correct: true },
  { text: "A completely different surprise", correct: false },
  { text: "Nothing at all", correct: false },
];

// A1 — keep vs ignore
const A1_ITEMS = [
  { label: "Tasty pizza", keep: true },
  { label: "Good friends", keep: true },
  { label: "Fun games", keep: true },
  { label: "Exact napkin colour", keep: false },
  { label: "Balloon shape", keep: false },
];

// A2 — order the steps
const A2_STEPS = ["Invite friends", "Order the pizza", "Set up games", "Eat and play"];

export const DpaaWalk: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [step, setStep] = useState(isCompleted ? ORDER.length : 0);
  const done = step >= ORDER.length;
  const key = done ? "A2" : ORDER[step];

  // per-step state
  const [dPick, setDPick] = useState<Set<number>>(new Set());
  const [dOk, setDOk] = useState(false);
  const [pPick, setPPick] = useState<number | null>(null);
  const [aKeep, setAKeep] = useState<Record<number, boolean>>({});
  const [aOk, setAOk] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [shake, setShake] = useState(false);

  const buzz = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };
  const next = () => setStep((s) => s + 1);

  // D handlers
  const toggleD = (i: number) => {
    if (dOk) return;
    setDPick((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const checkD = () => {
    const ok = D_PARTS.every((p, i) => p.belongs === dPick.has(i));
    if (ok) setDOk(true);
    else buzz();
  };

  // A1 handlers
  const setKeep = (i: number, v: boolean) => {
    if (aOk) return;
    setAKeep((s) => ({ ...s, [i]: v }));
  };
  const checkA = () => {
    const ok = A1_ITEMS.every((it, i) => aKeep[i] === it.keep);
    if (ok) setAOk(true);
    else buzz();
  };

  // A2 handlers
  const tapStep = (i: number) => {
    if (order.includes(i)) return;
    const expected = order.length; // correct next index in original order
    if (i === expected) {
      const n = [...order, i];
      setOrder(n);
      if (n.length === A2_STEPS.length) {
        completeSection(sectionIndex, false);
        setStep(ORDER.length);
      }
    } else {
      buzz();
    }
  };

  return (
    <div className={`space-y-5 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Let's crack one easy problem with the four moves: <span className="font-black">throw the perfect pizza party.</span>
      </div>

      {/* progress letters */}
      <div className="flex justify-center gap-2">
        {ORDER.map((k, i) => (
          <span
            key={k}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black transition-all ${
              i === step && !done
                ? `${META[k].dot} scale-110 text-white shadow-md`
                : i < step || done
                  ? "bg-slate-300 text-white"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {META[k].letter}
          </span>
        ))}
      </div>

      {/* D — Decomposition */}
      {key === "D" && !done && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
          <p className="text-sm font-black uppercase tracking-widest text-[#6b21a8]">D — Decomposition</p>
          <p className="mt-1 text-xl font-black text-slate-800">Break it into parts.</p>
          <p className="mt-1 text-lg font-bold text-slate-500">Tap the parts that a pizza party is made of.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {D_PARTS.map((p, i) => {
              const on = dPick.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleD(i)}
                  disabled={dOk}
                  className={`rounded-2xl border-2 px-4 py-3 text-lg font-black transition active:scale-95 ${
                    on ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {!dOk ? (
            <button onClick={checkD} className="mt-4 w-full rounded-full bg-[#8B4EC4] py-3 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">
              Check
            </button>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-lg font-black text-[#15803d]">A big job = a few smaller parts. That's decomposition.</p>
              <button onClick={next} className="mt-3 rounded-full bg-[#2EB85C] px-10 py-3 text-base font-black text-white shadow-md transition active:scale-95">Next: Pattern</button>
            </div>
          )}
        </div>
      )}

      {/* P — Pattern */}
      {key === "P" && !done && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
          <p className="text-sm font-black uppercase tracking-widest text-blue-700">P — Pattern recognition</p>
          <p className="mt-1 text-xl font-black text-slate-800">Spot what repeats.</p>
          <p className="mt-1 text-lg font-bold text-slate-500">For every single guest, what do you need? Find the repeat.</p>
          <div className="mt-4 flex flex-col gap-2">
            {P_OPTIONS.map((o, i) => {
              const wrong = pPick === i && !o.correct;
              const right = pPick === i && o.correct;
              return (
                <button
                  key={i}
                  onClick={() => { if (right) return; setPPick(i); if (!o.correct) buzz(); }}
                  className={`rounded-2xl border-2 px-5 py-3 text-left text-lg font-bold transition active:scale-[0.98] ${
                    wrong ? "border-red-200 bg-red-50 text-red-500" : right ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-400"
                  }`}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
          {pPick !== null && P_OPTIONS[pPick].correct && (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-lg font-black text-[#15803d]">Same thing for every guest = a pattern. Spot it once, reuse it.</p>
              <button onClick={next} className="mt-3 rounded-full bg-[#2EB85C] px-10 py-3 text-base font-black text-white shadow-md transition active:scale-95">Next: Abstraction</button>
            </div>
          )}
        </div>
      )}

      {/* A1 — Abstraction */}
      {key === "A1" && !done && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
          <p className="text-sm font-black uppercase tracking-widest text-emerald-700">A — Abstraction</p>
          <p className="mt-1 text-xl font-black text-slate-800">Keep what matters.</p>
          <p className="mt-1 text-lg font-bold text-slate-500">For a FUN party, mark each thing Keep or Ignore.</p>
          <div className="mt-4 space-y-2">
            {A1_ITEMS.map((it, i) => (
              <div key={i} className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2">
                <span className="flex-1 text-lg font-bold text-slate-700">{it.label}</span>
                <button onClick={() => setKeep(i, true)} disabled={aOk} className={`rounded-xl px-4 py-2 text-base font-black transition active:scale-95 ${aKeep[i] === true ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>Keep</button>
                <button onClick={() => setKeep(i, false)} disabled={aOk} className={`rounded-xl px-4 py-2 text-base font-black transition active:scale-95 ${aKeep[i] === false ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-500"}`}>Ignore</button>
              </div>
            ))}
          </div>
          {!aOk ? (
            <button onClick={checkA} className="mt-4 w-full rounded-full bg-[#8B4EC4] py-3 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">Check</button>
          ) : (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-lg font-black text-[#15803d]">Drop the tiny stuff, keep what counts. That's abstraction.</p>
              <button onClick={next} className="mt-3 rounded-full bg-[#2EB85C] px-10 py-3 text-base font-black text-white shadow-md transition active:scale-95">Next: Algorithm</button>
            </div>
          )}
        </div>
      )}

      {/* A2 — Algorithm */}
      {key === "A2" && !done && (
        <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
          <p className="text-sm font-black uppercase tracking-widest text-amber-700">A — Algorithm</p>
          <p className="mt-1 text-xl font-black text-slate-800">Put it in order.</p>
          <p className="mt-1 text-lg font-bold text-slate-500">Tap the steps in the right order, 1 to 4.</p>
          <div className="mt-4 space-y-2">
            {A2_STEPS.map((s, i) => {
              const picked = order.indexOf(i);
              return (
                <button
                  key={i}
                  onClick={() => tapStep(i)}
                  disabled={picked !== -1}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold transition active:scale-[0.98] ${
                    picked !== -1 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700 hover:border-amber-400"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base font-black text-white ${picked !== -1 ? "bg-amber-500" : "bg-slate-300"}`}>
                    {picked !== -1 ? picked + 1 : "?"}
                  </span>
                  {s}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-sm font-bold text-slate-400">Order picked: {order.length} of {A2_STEPS.length}</p>
        </div>
      )}

      {done && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center" style={{ animation: "dpaaPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
          <p className="text-xl font-black text-[#15803d]">That is DPAA.</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">Decompose, spot Patterns, keep what matters (Abstraction), then write the Algorithm. Four moves that crack any problem.</p>
        </div>
      )}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes dpaaPop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="dpaaPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
