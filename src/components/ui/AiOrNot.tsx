import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * AiOrNot — AI Creator Camp Day 1, Level 1. "AI or Not?" sorting game.
 * Six everyday things appear one at a time; the student taps "AI" or
 * "Not AI". Instant feedback with a one-line why. The key teaching:
 * fixed rules = not AI; LEARNS from examples/patterns = AI.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Item {
  text: string;
  isAi: boolean;
  why: string;
}

const ITEMS: Item[] = [
  {
    text: "A calculator",
    isAi: false,
    why: "Humans wrote every rule. It never learns.",
  },
  {
    text: "A cat-spotter trained on a million cat photos",
    isAi: true,
    why: "Nobody wrote cat rules. It learned the pattern from examples.",
  },
  {
    text: "YouTube picking your next video",
    isAi: true,
    why: "It learned your taste from what you watched.",
  },
  {
    text: "A light switch",
    isAi: false,
    why: "One fixed rule: on or off. Nothing to learn.",
  },
  {
    text: "Autocorrect guessing your next word",
    isAi: true,
    why: "It learned word patterns from billions of sentences.",
  },
  {
    text: "An alarm clock ringing at a set time",
    isAi: false,
    why: "It rings at the time you set. No learning.",
  },
];

export const AiOrNot: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [idx, setIdx] = useState(isCompleted ? ITEMS.length : 0);
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);
  const [solved, setSolved] = useState(isCompleted);
  const [shake, setShake] = useState(false);

  const allDone = idx >= ITEMS.length;
  const item = allDone ? null : ITEMS[idx];

  const pick = (saidAi: boolean) => {
    if (!item || status === "correct") return;
    if (saidAi === item.isAi) {
      setStatus("correct");
    } else {
      setStatus("wrong");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const next = () => {
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setStatus(null);
    if (nextIdx >= ITEMS.length) {
      setSolved(true);
      completeSection(sectionIndex, false);
    }
  };

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {ITEMS.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i < idx
                ? "bg-emerald-500"
                : i === idx && !allDone
                  ? "w-6 bg-[#8B4EC4]"
                  : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {!allDone && item && (
        <div
          key={idx}
          className="rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm"
          style={{ animation: "aiCardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="text-2xl md:text-3xl font-black text-slate-800">{item.text}</p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => pick(true)}
              disabled={status === "correct"}
              className={`min-w-[130px] rounded-2xl border-2 px-6 py-4 text-lg font-black transition active:scale-95 ${
                status === "wrong" && !item.isAi
                  ? "border-red-200 bg-red-50 text-red-500"
                  : status === "correct" && item.isAi
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
              }`}
            >
              AI
            </button>
            <button
              onClick={() => pick(false)}
              disabled={status === "correct"}
              className={`min-w-[130px] rounded-2xl border-2 px-6 py-4 text-lg font-black transition active:scale-95 ${
                status === "wrong" && item.isAi
                  ? "border-red-200 bg-red-50 text-red-500"
                  : status === "correct" && !item.isAi
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
              }`}
            >
              Not AI
            </button>
          </div>

          {status === "wrong" && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-lg font-bold text-red-500">
              Not quite. Does it learn from examples, or follow a fixed rule? Try again.
            </p>
          )}

          {status === "correct" && (
            <div className="mt-4 space-y-3">
              <p
                className={`rounded-2xl px-4 py-3 text-lg font-bold ${
                  item.isAi ? "bg-[#faf5ff] text-[#6b21a8]" : "bg-[#fff7ed] text-[#b45309]"
                }`}
              >
                {item.isAi ? "AI — it learns." : "Not AI — fixed rules."} {item.why}
              </p>
              <button
                onClick={next}
                className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
              >
                {idx === ITEMS.length - 1 ? "All sorted" : "Next one →"}
              </button>
            </div>
          )}
        </div>
      )}

      {solved && (
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center">
          <p className="text-xl font-black text-[#15803d]">All 6 sorted.</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            Fixed rules = a machine. Learns from examples = AI.
          </p>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes aiCardIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="aiCardIn"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
