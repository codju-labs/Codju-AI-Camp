import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * WhereIsAI — AI Creator Camp Day 1, Level 1. "Where did you ALREADY use AI
 * today?" Tappable chips flip to reveal what the AI is doing behind the
 * scenes. After revealing at least 5, the punchline lands: AI isn't the
 * future — it's already in your pocket.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Chip {
  label: string;
  reveal: string;
}

const CHIPS: Chip[] = [
  {
    label: "YouTube / Instagram feed",
    reveal: "AI picks videos based on what you watched.",
  },
  {
    label: "Google Maps traffic",
    reveal: "AI predicts jams from millions of moving phones.",
  },
  {
    label: "Face unlock",
    reveal: "AI learned the pattern of your face.",
  },
  {
    label: "Game characters",
    reveal: "AI decides how enemies chase and dodge.",
  },
  {
    label: "Autocorrect",
    reveal: "AI guesses your next word from billions of sentences.",
  },
  {
    label: "\"People also bought\"",
    reveal: "AI spots what shoppers like you buy next.",
  },
  {
    label: "Spotify playlists",
    reveal: "AI maps your taste and finds songs that match.",
  },
];

const NEEDED = 5;

export const WhereIsAI: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [revealed, setRevealed] = useState<Set<number>>(
    isCompleted ? new Set(CHIPS.map((_, i) => i)) : new Set()
  );
  const [solved, setSolved] = useState(isCompleted);

  const tap = (i: number) => {
    if (revealed.has(i)) return;
    const next = new Set(revealed);
    next.add(i);
    setRevealed(next);
    if (next.size >= NEEDED && !solved) {
      setSolved(true);
      completeSection(sectionIndex, false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-base font-black uppercase tracking-widest text-slate-400">
        {solved
          ? "Found it. Everywhere."
          : `Tap to reveal: ${revealed.size}/${NEEDED} found`}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHIPS.map((c, i) => {
          const open = revealed.has(i);
          return (
            <button
              key={i}
              onClick={() => tap(i)}
              className={`rounded-3xl border-2 p-5 text-left transition-all duration-300 active:scale-[0.97] ${
                open
                  ? "border-[#d8b4fe] bg-[#faf5ff]"
                  : "border-slate-200 bg-white shadow-sm hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
              }`}
            >
              <span className="text-lg md:text-xl font-black text-slate-800">{c.label}</span>
              {open && (
                <p
                  className="mt-2 text-lg font-bold leading-snug text-[#6b21a8]"
                  style={{ animation: "chipReveal 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
                >
                  {c.reveal}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {solved && (
        <div
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5 text-center"
          style={{ animation: "chipReveal 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="text-xl font-black text-[#15803d]">
            AI isn't the future. It's already in your pocket.
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            Today you go from AI user → AI creator.
          </p>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes chipReveal { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="chipReveal"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
