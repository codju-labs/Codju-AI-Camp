import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * TrickCards — the 5 prompt tricks as tappable flip cards.
 * Front: numbered tile + trick name. Back: what it does + an example snippet.
 * Section completes once all 5 cards have been flipped at least once.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const TRICKS = [
  {
    name: "The Role Trick",
    what: "Start with \"You are a ___.\" The AI acts like that expert.",
    example: "You are a sports commentator. Describe my school day.",
  },
  {
    name: "The Make-It-Better Trick",
    what: "The AI remembers your chat. Don't restart — just refine.",
    example: "Make it funnier. Make it shorter. Give me 3 more options.",
  },
  {
    name: "The Explain-Like-I'm-Ten Trick",
    what: "You choose how simple or deep the answer is.",
    example: "Explain black holes like I'm ten.",
  },
  {
    name: "The Format Trick",
    what: "Ask for the exact shape you want the answer in.",
    example: "Give it as a table. · 5 bullet points. · Step by step.",
  },
  {
    name: "The Show-Your-Sources Trick",
    what: "For facts, make the AI prove it. Then double-check.",
    example: "Show me where this information comes from.",
  },
];

export const TrickCards: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [opened, setOpened] = useState<Set<number>>(
    isCompleted ? new Set(TRICKS.map((_, i) => i)) : new Set()
  );
  const [flipped, setFlipped] = useState<Set<number>>(
    isCompleted ? new Set(TRICKS.map((_, i) => i)) : new Set()
  );
  const [solved, setSolved] = useState(isCompleted);

  const tap = (i: number) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
    if (!opened.has(i)) {
      const nextOpened = new Set(opened);
      nextOpened.add(i);
      setOpened(nextOpened);
      if (nextOpened.size === TRICKS.length && !solved) {
        setSolved(true);
        completeSection(sectionIndex, false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-sm font-black uppercase tracking-widest text-slate-400">
        {solved ? "All 5 collected" : `Collected ${opened.size}/5 — tap to flip`}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TRICKS.map((t, i) => {
          const isFlipped = flipped.has(i);
          const wasOpened = opened.has(i);
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              className="tc-scene min-h-[200px] text-left"
              aria-pressed={isFlipped}
            >
              <div className={`tc-inner ${isFlipped ? "tc-flipped" : ""}`}>
                {/* Front */}
                <div
                  className={`tc-face flex flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center shadow-sm ${
                    wasOpened
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-slate-200 bg-white hover:border-[#8B4EC4]"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white ${
                      wasOpened ? "bg-emerald-500" : "bg-[#8B4EC4]"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-lg font-black leading-tight text-slate-800">{t.name}</span>
                  <span className="text-sm font-bold text-slate-400">
                    {wasOpened ? "collected — tap to re-read" : "tap to reveal"}
                  </span>
                </div>
                {/* Back */}
                <div className="tc-face tc-back flex flex-col justify-center gap-2 rounded-3xl border-2 border-[#e9d5ff] bg-[#faf5ff] p-4 shadow-sm">
                  <p className="flex items-center gap-2 text-base font-black text-[#6b21a8]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8B4EC4] text-sm font-black text-white">
                      {i + 1}
                    </span>
                    {t.name}
                  </p>
                  <p className="text-lg font-bold leading-snug text-slate-700">{t.what}</p>
                  <p className="rounded-xl bg-white px-3 py-2 font-mono text-base font-bold text-slate-600">
                    {t.example}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {solved && (
        <p className="text-center text-lg font-black text-[#15803d]">
          Five tricks collected — and they work in every AI tool.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        .tc-scene { perspective: 1000px; }
        .tc-inner { position: relative; width: 100%; height: 100%; min-height: 200px; transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); transform-style: preserve-3d; }
        .tc-flipped { transform: rotateY(180deg); }
        .tc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .tc-back { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) { .tc-inner { transition: none; } }
      `}</style>
    </div>
  );
};
