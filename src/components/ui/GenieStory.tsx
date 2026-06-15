import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * GenieStory — "Aarav and the Genie". Tappable story beats: each wish is
 * granted EXACTLY as worded, with hilarious results, until Aarav learns to
 * be precise. Ends with one question that locks in the Day 1 lesson:
 * AI does what you SAY, not what you MEAN.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Beat {
  wish: string;
  poof: string;
  result: string;
  verdict: "fail" | "fail2" | "win";
}

const BEATS: Beat[] = [
  {
    wish: "Make me rich!",
    poof: "POOF!",
    result: "The genie turns Aarav into a man named Rich.",
    verdict: "fail",
  },
  {
    wish: "Okay — give me a big account!",
    poof: "POOF!",
    result: "Aarav gets a giant email account full of spam.",
    verdict: "fail2",
  },
  {
    wish: "Add ₹1,00,000 to my bank account, in Indian Rupees, legally, today.",
    poof: "POOF!",
    result: "It works — an exact wish gets an exact result.",
    verdict: "win",
  },
];

const OPTIONS = [
  { text: "Wish louder and more often", correct: false },
  { text: "Say exactly what you mean, with details", correct: true },
  { text: "Find a smarter genie", correct: false },
];

const NameChip: React.FC<{ name: string; tone: "child" | "genie" }> = ({ name, tone }) => (
  <span
    className={`mt-1 shrink-0 rounded-lg px-2 py-1 text-xs font-black tracking-widest ${
      tone === "child" ? "bg-[#ede9fe] text-[#6d28d9]" : "bg-amber-100 text-amber-700"
    }`}
  >
    {name}
  </span>
);

export const GenieStory: React.FC<Props> = ({ sectionIndex, explanation }) => {
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
        Aarav finds a genie. <span className="font-black">"I grant any wish — but I do EXACTLY what you say."</span>
      </div>

      <div className="space-y-3">
        {BEATS.slice(0, revealed).map((b, i) => (
          <div
            key={i}
            className={`rounded-3xl border-2 p-4 ${
              b.verdict === "win" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
            }`}
            style={{ animation: "genieBeat 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
          >
            <div className="mb-2 flex items-start gap-3">
              <NameChip name="AARAV" tone="child" />
              <p className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2 text-base md:text-lg font-bold leading-relaxed text-slate-700">
                "{b.wish}"
              </p>
            </div>
            <p className="mb-2 text-center text-sm font-black tracking-widest text-[#8B4EC4]">{b.poof}</p>
            <div className="flex items-start gap-3">
              <NameChip name="GENIE" tone="genie" />
              <p
                className={`rounded-2xl rounded-tl-sm px-4 py-2 text-base md:text-lg font-bold leading-relaxed ${
                  b.verdict === "win" ? "bg-emerald-100 text-emerald-800" : "bg-[#fff7ed] text-[#b45309]"
                }`}
              >
                {b.result}
              </p>
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
            {revealed === 0 ? "Aarav's first wish" : revealed === 1 ? "He tries again" : "Third time lucky?"}
          </button>
        </div>
      )}

      {allBeats && !solved && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">
            The genie was never broken. What was Aarav's trick in the end?
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
          AI is that genie. It does what you SAY, not what you MEAN.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes genieBeat { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="genieBeat"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
