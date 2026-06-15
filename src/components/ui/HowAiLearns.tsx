import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * HowAiLearns — AI Creator Camp Day 1, Level 1. The student becomes the AI:
 * they study a few labelled examples, spot the hidden pattern (antennae =
 * Glorp), and then classify new creatures. Colour and eye-count are random
 * noise; the antenna is the real signal. Lesson: AI learns the pattern that
 * matters from examples — nobody writes the rule.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Creature {
  color: string;
  eyes: number;
  antenna: boolean;
}

const TRAIN: { c: Creature; label: "Glorp" | "Blorp" }[] = [
  { c: { color: "#93c5fd", eyes: 2, antenna: true }, label: "Glorp" },
  { c: { color: "#fdba74", eyes: 2, antenna: false }, label: "Blorp" },
  { c: { color: "#86efac", eyes: 3, antenna: true }, label: "Glorp" },
  { c: { color: "#d8b4fe", eyes: 1, antenna: false }, label: "Blorp" },
];

const TEST: { c: Creature; answer: "Glorp" | "Blorp" }[] = [
  { c: { color: "#fdba74", eyes: 3, antenna: true }, answer: "Glorp" },
  { c: { color: "#93c5fd", eyes: 1, antenna: false }, answer: "Blorp" },
];

const CreatureSVG: React.FC<{ c: Creature; size?: number }> = ({ c, size = 108 }) => {
  const eyeXs = c.eyes === 1 ? [50] : c.eyes === 2 ? [38, 62] : [34, 50, 66];
  return (
    <svg viewBox="0 0 100 112" width={size} height={(size * 112) / 100} aria-hidden="true">
      {c.antenna && (
        <g stroke="#64748b" strokeWidth="3" strokeLinecap="round">
          <line x1="40" y1="30" x2="33" y2="12" />
          <line x1="60" y1="30" x2="67" y2="12" />
          <circle cx="33" cy="10" r="4" fill="#64748b" stroke="none" />
          <circle cx="67" cy="10" r="4" fill="#64748b" stroke="none" />
        </g>
      )}
      <ellipse cx="50" cy="64" rx="34" ry="40" fill={c.color} stroke="#0f172a" strokeWidth="2.5" />
      {eyeXs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="58" r="8.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx={x} cy="59" r="3.6" fill="#0f172a" />
        </g>
      ))}
      <path d="M40 84 Q50 92 60 84" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};

export const HowAiLearns: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [phase, setPhase] = useState<"study" | "test">(isCompleted ? "test" : "study");
  const [testIdx, setTestIdx] = useState(isCompleted ? TEST.length : 0);
  const [pick, setPick] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState(false);

  const solved = testIdx >= TEST.length;

  const choose = (label: "Glorp" | "Blorp") => {
    if (solved) return;
    setPick(label);
    if (label === TEST[testIdx].answer) {
      setPick(null);
      setHint(false);
      const next = testIdx + 1;
      setTestIdx(next);
      if (next >= TEST.length) completeSection(sectionIndex, false);
    } else {
      setShake(true);
      setHint(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`space-y-5 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Nobody tells the AI the rule. It learns the rule from examples. Now you try.
      </div>

      {/* Training examples — always visible */}
      <div>
        <p className="mb-3 text-center text-base font-black uppercase tracking-widest text-slate-400">
          The examples
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TRAIN.map((t, i) => (
            <div
              key={i}
              className={`flex flex-col items-center rounded-3xl border-2 p-3 ${
                t.label === "Glorp" ? "border-violet-200 bg-violet-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <CreatureSVG c={t.c} size={92} />
              <span
                className={`mt-1 text-lg font-black ${
                  t.label === "Glorp" ? "text-violet-700" : "text-amber-700"
                }`}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {phase === "study" && !solved && (
        <div className="flex justify-center">
          <button
            onClick={() => setPhase("test")}
            className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            I see the pattern
          </button>
        </div>
      )}

      {phase === "test" && !solved && (
        <div className="space-y-4 rounded-3xl border-2 border-slate-200 bg-white p-5">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">
            New creature. Glorp or Blorp?
          </p>
          <div className="flex justify-center">
            <CreatureSVG c={TEST[testIdx].c} size={128} />
          </div>
          {hint && (
            <p className="text-center text-base font-bold text-red-500">
              Look again. What do all the Glorps have that the Blorps don't?
            </p>
          )}
          <div className="flex justify-center gap-3">
            {(["Glorp", "Blorp"] as const).map((label) => {
              const wrong = pick === label;
              return (
                <button
                  key={label}
                  onClick={() => choose(label)}
                  className={`min-w-[130px] rounded-2xl border-2 px-6 py-4 text-lg font-black transition active:scale-95 ${
                    wrong
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="text-center text-base font-bold text-slate-400">
            Creature {testIdx + 1} of {TEST.length}
          </p>
        </div>
      )}

      {solved && (
        <div
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center"
          style={{ animation: "learnPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="text-xl font-black text-[#15803d]">You found the pattern.</p>
          <p className="mt-2 text-lg font-bold text-emerald-700">
            Colour and eyes were random. Every Glorp had antennae. No Blorp did.
          </p>
          <p className="mt-2 text-lg font-bold text-emerald-700">
            You learned the rule from examples — just like AI does.
          </p>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes learnPop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="learnPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
