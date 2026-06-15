import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * ToolCards — AI Creator Camp Day 1, Level 3.
 * Four flippable character cards introducing ChatGPT, Claude, Gemini and
 * Perplexity as superheroes on one team — each with what it's best at and
 * WHY it's better at that job. Pure CSS 3D flip (no framer-motion).
 * Section completes once ALL cards have been flipped.
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
  maker: string;
  bestFor: string;
  whyBetter: string;
  kidLine: string;
  // brand tint
  border: string;
  frontBg: string;
  backBg: string;
  accent: string;
  chipBg: string;
  tileBg: string;
}

const TOOLS: Tool[] = [
  {
    id: "chatgpt",
    initial: "C",
    name: "ChatGPT",
    nickname: "The Creative Brain",
    maker: "by OpenAI",
    bestFor: "Stories, ideas, everyday questions.",
    whyBetter: "Fast and friendly, and brilliant at imagination and chat.",
    kidLine: "The friend who loves to imagine.",
    border: "border-emerald-200",
    frontBg: "bg-emerald-50",
    backBg: "bg-white",
    accent: "text-emerald-700",
    chipBg: "bg-emerald-100",
    tileBg: "bg-emerald-500",
  },
  {
    id: "claude",
    initial: "Cl",
    name: "Claude",
    nickname: "The Careful Thinker",
    maker: "by Anthropic",
    bestFor: "Long writing, coding, big documents.",
    whyBetter: "Patient and careful — it follows instructions closely and never loses track of long text.",
    kidLine: "The one that thinks before it writes.",
    border: "border-amber-200",
    frontBg: "bg-amber-50",
    backBg: "bg-white",
    accent: "text-amber-700",
    chipBg: "bg-amber-100",
    tileBg: "bg-amber-500",
  },
  {
    id: "gemini",
    initial: "G",
    name: "Google Gemini",
    nickname: "The All-Rounder",
    maker: "by Google",
    bestFor: "Pictures, video clips, study help.",
    whyBetter: "The only one here that makes images AND short videos — and it connects to Google.",
    kidLine: "The all-rounder that draws and films.",
    border: "border-blue-200",
    frontBg: "bg-blue-50",
    backBg: "bg-white",
    accent: "text-blue-700",
    chipBg: "bg-blue-100",
    tileBg: "bg-blue-500",
  },
  {
    id: "perplexity",
    initial: "P",
    name: "Perplexity",
    nickname: "The Research Detective",
    maker: "an AI search engine",
    bestFor: "True facts, research, proof.",
    whyBetter: "It searches the live internet and shows its sources, so you can check what's true.",
    kidLine: "The detective who shows evidence.",
    border: "border-purple-200",
    frontBg: "bg-purple-50",
    backBg: "bg-white",
    accent: "text-[#8B4EC4]",
    chipBg: "bg-purple-100",
    tileBg: "bg-purple-500",
  },
];

export const ToolCards: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [flipped, setFlipped] = useState<Set<string>>(
    isCompleted ? new Set(TOOLS.map((t) => t.id)) : new Set()
  );
  const [met, setMet] = useState<Set<string>>(
    isCompleted ? new Set(TOOLS.map((t) => t.id)) : new Set()
  );
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
      if (next.size === TOOLS.length) {
        completeSection(sectionIndex, false);
      }
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <style>{`
        .tc-scene { perspective: 1200px; }
        .tc-inner { position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); width: 100%; height: 100%; }
        .tc-inner.tc-flipped { transform: rotateY(180deg); }
        .tc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .tc-back { transform: rotateY(180deg); }
        @media (prefers-reduced-motion: reduce) { .tc-inner { transition: none; } }
      `}</style>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const isFlipped = flipped.has(t.id);
          const wasMet = met.has(t.id);
          return (
            <button
              key={t.id}
              onClick={() => flip(t.id)}
              className="tc-scene block h-[360px] w-full text-left"
              aria-pressed={isFlipped}
              aria-label={`${t.name} card — tap to flip`}
            >
              <div className={`tc-inner ${isFlipped ? "tc-flipped" : ""}`}>
                {/* Front */}
                <div
                  className={`tc-face flex flex-col items-center justify-center rounded-3xl border-2 ${t.border} ${t.frontBg} p-5 shadow-sm transition hover:shadow-md`}
                >
                  <span
                    className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${t.tileBg} text-4xl font-black text-white shadow-md`}
                  >
                    {t.initial}
                  </span>
                  <p className="text-2xl font-black text-slate-800">{t.name}</p>
                  <p className={`mt-1 text-lg font-black ${t.accent}`}>{t.nickname}</p>
                  <span
                    className={`mt-6 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest ${
                      wasMet ? "bg-white text-slate-400" : `${t.chipBg} ${t.accent}`
                    }`}
                  >
                    {wasMet ? "Met" : "Tap to flip"}
                  </span>
                </div>
                {/* Back */}
                <div
                  className={`tc-face tc-back flex flex-col rounded-3xl border-2 ${t.border} ${t.backBg} p-5 shadow-sm`}
                >
                  <p className={`text-xl font-black ${t.accent}`}>
                    {t.name} <span className="text-sm font-bold text-slate-400">· {t.maker}</span>
                  </p>
                  <p className="mt-3 text-lg font-bold leading-snug text-slate-700">
                    <span className="text-slate-400">Best at: </span>{t.bestFor}
                  </p>
                  <p className="mt-3 text-base font-bold leading-snug text-slate-600">
                    <span className="text-slate-400">Why it's better: </span>{t.whyBetter}
                  </p>
                  <div className={`mt-auto rounded-2xl ${t.frontBg} px-4 py-3`}>
                    <p className={`text-lg font-black leading-snug ${t.accent}`}>“{t.kidLine}”</p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!solved && (
        <p className="text-center text-lg font-bold text-slate-400">
          {met.size === 0
            ? "Tap a card to meet your first teammate."
            : `${met.size} of ${TOOLS.length} met — keep going.`}
        </p>
      )}

      {solved && (
        <p className="text-center text-xl font-black text-[#15803d]">
          Team assembled. Four heroes, four superpowers.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
