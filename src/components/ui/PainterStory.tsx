import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PainterStory — "The Artist Who Could Only Describe" (Day 2, Level 1).
 * Mirrors GenieStory's tappable-beats pattern. Maya can't draw a single
 * line, but a magic painter paints exactly what she describes. A vague
 * order makes a dull picture; a rich description makes art come alive.
 * Ends with one question that locks in the lesson:
 * AI is that painter — the better you describe, the closer the picture.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Beat {
  order: string;
  brush: string;
  result: string;
  verdict: "fail" | "win";
}

const BEATS: Beat[] = [
  {
    order: "Paint a dog.",
    brush: "SWISH",
    result: "The painter paints a plain grey dog on a blank white wall. Boring.",
    verdict: "fail",
  },
  {
    order:
      "Paint a fluffy golden puppy chasing a red kite on a beach at sunset, cartoon style.",
    brush: "SWISH",
    result: "The wall comes alive — golden fur, an orange sky, the red kite caught mid-air.",
    verdict: "win",
  },
];

const OPTIONS = [
  { text: "Drawing lessons", correct: false },
  { text: "Describing exactly what she imagined", correct: true },
  { text: "A better paintbrush", correct: false },
];

const NameChip: React.FC<{ name: string; tone: "child" | "painter" }> = ({ name, tone }) => (
  <span
    className={`mt-1 shrink-0 rounded-lg px-2 py-1 text-xs font-black tracking-widest ${
      tone === "child" ? "bg-[#ede9fe] text-[#6d28d9]" : "bg-amber-100 text-amber-700"
    }`}
  >
    {name}
  </span>
);

// Dull grey result card for beat 1.
const DullCanvas: React.FC = () => (
  <svg viewBox="0 0 200 120" width="100%" height="auto" aria-hidden="true" className="max-w-[260px]">
    <rect x="0" y="0" width="200" height="120" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
    <ellipse cx="100" cy="84" rx="36" ry="22" fill="#cbd5e1" />
    <circle cx="100" cy="56" r="20" fill="#cbd5e1" />
    <ellipse cx="88" cy="40" rx="5" ry="9" fill="#94a3b8" />
    <ellipse cx="112" cy="40" rx="5" ry="9" fill="#94a3b8" />
    <circle cx="94" cy="55" r="2.4" fill="#475569" />
    <circle cx="106" cy="55" r="2.4" fill="#475569" />
    <ellipse cx="100" cy="64" rx="4" ry="3" fill="#475569" />
  </svg>
);

// Warm colourful result card for beat 2.
const RichCanvas: React.FC = () => (
  <svg viewBox="0 0 200 120" width="100%" height="auto" aria-hidden="true" className="max-w-[260px]">
    <defs>
      <linearGradient id="psSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="55%" stopColor="#fdba74" />
        <stop offset="55%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="200" height="120" rx="12" fill="url(#psSky)" />
    <circle cx="158" cy="40" r="16" fill="#f97316" />
    {/* red kite */}
    <path d="M150 34 L160 44 L150 54 L140 44 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
    <line x1="150" y1="54" x2="118" y2="92" stroke="#92400e" strokeWidth="1.5" />
    {/* golden puppy */}
    <ellipse cx="84" cy="92" rx="30" ry="18" fill="#fcd34d" stroke="#92400e" strokeWidth="1.5" />
    <circle cx="84" cy="70" r="17" fill="#fcd34d" stroke="#92400e" strokeWidth="1.5" />
    <path d="M71 58 L66 44 L80 56 Z" fill="#f59e0b" />
    <path d="M97 58 L102 44 L88 56 Z" fill="#f59e0b" />
    <circle cx="78" cy="69" r="2.6" fill="#0f172a" />
    <circle cx="90" cy="69" r="2.6" fill="#0f172a" />
    <ellipse cx="84" cy="77" rx="4" ry="3" fill="#92400e" />
  </svg>
);

export const PainterStory: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [revealed, setRevealed] = useState(isCompleted ? BEATS.length : 0);
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(isCompleted);
  const [shake, setShake] = useState(false);

  const allBeats = revealed >= BEATS.length;

  const choose = (i: number) => {
    if (solved) return;
    setPick(i);
    if (OPTIONS[i].correct) {
      setSolved(true);
      completeSection(sectionIndex, false);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Maya can't draw a single line. But she owns a magic painter.{" "}
        <span className="font-black">"I paint EXACTLY what you describe."</span>
      </div>

      <div className="space-y-3">
        {BEATS.slice(0, revealed).map((b, i) => (
          <div
            key={i}
            className={`rounded-3xl border-2 p-4 ${
              b.verdict === "win" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
            }`}
            style={{ animation: "painterBeat 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
          >
            <div className="mb-2 flex items-start gap-3">
              <NameChip name="MAYA" tone="child" />
              <p className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2 text-base md:text-lg font-bold leading-relaxed text-slate-700">
                "{b.order}"
              </p>
            </div>
            <p className="mb-2 text-center text-sm font-black tracking-widest text-[#8B4EC4]">
              {b.brush}
            </p>
            <div className="flex items-start gap-3">
              <NameChip name="PAINTER" tone="painter" />
              <p
                className={`rounded-2xl rounded-tl-sm px-4 py-2 text-base md:text-lg font-bold leading-relaxed ${
                  b.verdict === "win" ? "bg-emerald-100 text-emerald-800" : "bg-[#fff7ed] text-[#b45309]"
                }`}
              >
                {b.result}
              </p>
            </div>
            <div className="mt-3 flex justify-center">
              {b.verdict === "win" ? <RichCanvas /> : <DullCanvas />}
            </div>
          </div>
        ))}
      </div>

      {!allBeats && (
        <div className="flex justify-center">
          <button
            onClick={() => setRevealed((r) => r + 1)}
            className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            {revealed === 0 ? "Maya's first order" : "She describes it fully"}
          </button>
        </div>
      )}

      {allBeats && !solved && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">
            Maya can't draw a single line. What was her secret?
          </p>
          <div className="flex flex-col gap-2">
            {OPTIONS.map((o, i) => {
              const wrong = pick === i && !o.correct;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className={`rounded-2xl border-2 px-5 py-4 text-left text-lg font-bold transition active:scale-[0.98] ${
                    wrong
                      ? "border-red-200 bg-red-50 text-red-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
                  }`}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {solved && (
        <p className="text-center text-lg md:text-xl font-black text-[#15803d]">
          AI is that painter. The better you describe, the closer the picture.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes painterBeat { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="painterBeat"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
