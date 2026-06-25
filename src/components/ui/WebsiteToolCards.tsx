import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * WebsiteToolCards — AI Creator Camp Day 5. Flippable cards for the AI
 * website builders: Lovable and v0 — what each is best at and why.
 * Section completes once all cards are flipped.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Tool {
  id: string;
  initial: string;
  name: string;
  nickname: string;
  bestFor: string;
  whyBetter: string;
  kidLine: string;
  border: string;
  frontBg: string;
  accent: string;
  chipBg: string;
  tileBg: string;
}

const TOOLS: Tool[] = [
  {
    id: "lovable",
    initial: "Lv",
    name: "Lovable",
    nickname: "The Full Builder",
    bestFor: "Real websites that DO things and save data.",
    whyBetter: "You describe it in words and it builds a working site with a database built in.",
    kidLine: "Describe it, get a real working site.",
    border: "border-rose-200",
    frontBg: "bg-rose-50",
    accent: "text-rose-700",
    chipBg: "bg-rose-100",
    tileBg: "bg-rose-500",
  },
  {
    id: "v0",
    initial: "v0",
    name: "v0",
    nickname: "The Pro Builder",
    bestFor: "Sleek, modern sites built from a chat.",
    whyBetter: "Made by Vercel — you describe your site and it builds a polished page with real code behind it.",
    kidLine: "Chat your idea into a modern site.",
    border: "border-indigo-200",
    frontBg: "bg-indigo-50",
    accent: "text-indigo-700",
    chipBg: "bg-indigo-100",
    tileBg: "bg-slate-900",
  },
];

export const WebsiteToolCards: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [flipped, setFlipped] = useState<Set<string>>(isCompleted ? new Set(TOOLS.map((t) => t.id)) : new Set());
  const [met, setMet] = useState<Set<string>>(isCompleted ? new Set(TOOLS.map((t) => t.id)) : new Set());
  const solved = met.size === TOOLS.length;

  const flip = (id: string) => {
    setFlipped((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setMet((s) => {
      if (s.has(id)) return s;
      const next = new Set(s).add(id);
      if (next.size === TOOLS.length) completeSection(sectionIndex, false);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <style>{`
        .wt-scene { perspective: 1200px; }
        .wt-inner { position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4,0.2,0.2,1); width: 100%; height: 100%; }
        .wt-inner.wt-flipped { transform: rotateY(180deg); }
        .wt-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .wt-back { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) { .wt-inner { transition: none; } }
      `}</style>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const isFlipped = flipped.has(t.id);
          const wasMet = met.has(t.id);
          return (
            <button key={t.id} onClick={() => flip(t.id)} className="wt-scene block h-[360px] w-full text-left" aria-pressed={isFlipped} aria-label={`${t.name} card`}>
              <div className={`wt-inner ${isFlipped ? "wt-flipped" : ""}`}>
                <div className={`wt-face flex flex-col items-center justify-center rounded-3xl border-2 ${t.border} ${t.frontBg} p-5 shadow-sm`}>
                  <span className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${t.tileBg} text-2xl font-black text-white shadow-md`}>{t.initial}</span>
                  <p className="text-2xl font-black text-slate-800">{t.name}</p>
                  <p className={`mt-1 text-lg font-black ${t.accent}`}>{t.nickname}</p>
                  <span className={`mt-6 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest ${wasMet ? "bg-white text-slate-400" : `${t.chipBg} ${t.accent}`}`}>{wasMet ? "Met" : "Tap to flip"}</span>
                </div>
                <div className={`wt-face wt-back flex flex-col rounded-3xl border-2 ${t.border} bg-white p-5 shadow-sm`}>
                  <p className={`text-xl font-black ${t.accent}`}>{t.name}</p>
                  <p className="mt-3 text-lg font-bold leading-snug text-slate-700"><span className="text-slate-400">Best at: </span>{t.bestFor}</p>
                  <p className="mt-3 text-base font-bold leading-snug text-slate-600"><span className="text-slate-400">Why: </span>{t.whyBetter}</p>
                  <div className={`mt-auto rounded-2xl ${t.frontBg} px-4 py-3`}>
                    <p className={`text-lg font-black leading-snug ${t.accent}`}>“{t.kidLine}”</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!solved && <p className="text-center text-lg font-bold text-slate-400">{met.size === 0 ? "Tap a card to meet your first builder." : `${met.size} of ${TOOLS.length} met — keep going.`}</p>}
      {solved && <p className="text-center text-xl font-black text-[#15803d]">Two AI builders, ready when you are. Pick whichever fits your site.</p>}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
