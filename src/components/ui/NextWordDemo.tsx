import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * NextWordDemo — AI Creator Camp Day 1, Level 1. The core "how does
 * Generative AI work?" demo. The student builds a sentence one word at a
 * time. At each step the AI shows the most likely next words with
 * confidence bars (learned from real text). Silly words score tiny. The
 * lesson: ChatGPT writes by predicting the next word, again and again — and
 * YOUR words steer every guess. That bridges straight into prompting.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Option {
  word: string;
  p: number;
}

interface Step {
  lead: string; // scaffold words shown before this blank
  options: Option[];
}

const STEPS: Step[] = [
  {
    lead: "Every morning I eat",
    options: [
      { word: "breakfast", p: 52 },
      { word: "cereal", p: 28 },
      { word: "eggs", p: 16 },
      { word: "rockets", p: 1 },
    ],
  },
  {
    lead: "and then I",
    options: [
      { word: "go", p: 44 },
      { word: "walk", p: 26 },
      { word: "run", p: 22 },
      { word: "teleport", p: 2 },
    ],
  },
  {
    lead: "to",
    options: [
      { word: "school", p: 61 },
      { word: "work", p: 19 },
      { word: "the park", p: 14 },
      { word: "the moon", p: 1 },
    ],
  },
];

const topWords = STEPS.map((s) => s.options[0].word);

export const NextWordDemo: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [picks, setPicks] = useState<string[]>(isCompleted ? topWords : []);
  const solved = picks.length >= STEPS.length;
  const stepIdx = picks.length;

  const choose = (word: string) => {
    if (solved) return;
    const next = [...picks, word];
    setPicks(next);
    if (next.length >= STEPS.length) completeSection(sectionIndex, false);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Generative AI writes one word at a time. Tap a word and watch the sentence grow.
      </div>

      {/* The growing sentence */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 text-center">
        <p className="text-xl md:text-2xl font-black leading-relaxed text-slate-800">
          {STEPS.map((s, i) => (
            <span key={i}>
              <span className="text-slate-500">{s.lead} </span>
              {picks[i] ? (
                <span className="text-[#8B4EC4]">{picks[i]} </span>
              ) : i === stepIdx ? (
                <span className="inline-block border-b-4 border-[#8B4EC4] px-6 align-middle animate-pulse" />
              ) : null}
            </span>
          ))}
          {solved && <span className="text-slate-500">.</span>}
        </p>
      </div>

      {/* Prediction bars for the current blank */}
      {!solved && (
        <div className="space-y-3">
          <p className="text-center text-base font-black uppercase tracking-widest text-slate-400">
            The AI's next-word guesses
          </p>
          {STEPS[stepIdx].options.map((o) => (
            <button
              key={o.word}
              onClick={() => choose(o.word)}
              className="group block w-full overflow-hidden rounded-2xl border-2 border-slate-200 bg-white text-left transition active:scale-[0.99] hover:border-[#8B4EC4]"
            >
              <div className="relative flex items-center justify-between px-5 py-4">
                <div
                  className="absolute inset-y-0 left-0 bg-[#ede9fe] transition-all group-hover:bg-[#ddd6fe]"
                  style={{ width: `${o.p}%` }}
                />
                <span className="relative text-lg md:text-xl font-black text-slate-800">{o.word}</span>
                <span className="relative text-base font-black text-[#6b21a8]">{o.p}%</span>
              </div>
            </button>
          ))}
          <p className="text-center text-base font-bold text-slate-400">
            The AI usually picks the longest bar — but it can choose others. That's why answers can surprise you.
          </p>
        </div>
      )}

      {solved && (
        <div
          className="space-y-3"
          style={{ animation: "nwPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xl font-black text-[#15803d]">That's exactly how ChatGPT writes.</p>
            <p className="mt-2 text-lg font-bold text-emerald-700">
              One word at a time. Always guessing what is likely to come next.
            </p>
            <p className="mt-2 text-lg font-bold text-emerald-700">
              It learned those guesses by reading billions of sentences. Real words score high. Silly
              words like "rockets" and "the moon" score tiny.
            </p>
          </div>
          <div className="rounded-3xl border-2 border-[#fed7aa] bg-[#fff7ed] p-5 text-center">
            <p className="text-lg md:text-xl font-black text-[#b45309]">
              Your words changed the whole sentence. Your words steer the AI.
            </p>
          </div>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes nwPop { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="nwPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
