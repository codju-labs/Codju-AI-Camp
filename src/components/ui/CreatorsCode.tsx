import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * CreatorsCode — AI Creator Camp Day 1 finale. The safety oath.
 * Five rules revealed as tappable numbered cards. Once all five are open,
 * the student takes the Creator's Oath and a badge stamps in.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Rule {
  title: string;
  body: string;
}

const RULES: Rule[] = [
  {
    title: "Protect yourself",
    body: "Never share your name, school, address, phone or photos with an AI.",
  },
  {
    title: "AI can be wrong",
    body: "It can invent facts with full confidence. Always check.",
  },
  {
    title: "AI is a helper, not a cheat",
    body: "It helps you think. It must not think for you.",
  },
  {
    title: "Be kind and honest",
    body: "Never make mean or fake things about real people.",
  },
  {
    title: "A human is the boss",
    body: "You decide. You create. You take credit.",
  },
];

export const CreatorsCode: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [opened, setOpened] = useState<Set<number>>(
    isCompleted ? new Set(RULES.map((_, i) => i)) : new Set()
  );
  const [sworn, setSworn] = useState(isCompleted);

  const allOpen = opened.size === RULES.length;

  const open = (i: number) => {
    if (sworn) return;
    setOpened((s) => new Set(s).add(i));
  };

  const swear = () => {
    if (sworn) return;
    setSworn(true);
    completeSection(sectionIndex, false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RULES.map((r, i) => {
          const isOpen = opened.has(i);
          return (
            <button
              key={i}
              onClick={() => open(i)}
              disabled={isOpen}
              className={`rounded-3xl border-2 p-5 text-left transition-all ${
                isOpen
                  ? "border-[#e9d5ff] bg-[#faf5ff]"
                  : "cursor-pointer border-slate-200 bg-white shadow-sm hover:border-[#8B4EC4] hover:shadow-md active:scale-[0.98]"
              } ${i === RULES.length - 1 ? "sm:col-span-2" : ""}`}
              style={
                isOpen
                  ? { animation: "ccReveal 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }
                  : undefined
              }
            >
              {isOpen ? (
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8B4EC4] text-2xl font-black text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xl font-black text-slate-900">{r.title}</p>
                    <p className="mt-1 text-lg font-bold leading-relaxed text-slate-600">
                      {r.body}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 py-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl font-black text-slate-400">
                    {i + 1}
                  </span>
                  <span className="text-lg font-black text-slate-500">
                    Rule {i + 1} — tap to reveal
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {allOpen && !sworn && (
        <div
          className="flex justify-center pt-2"
          style={{ animation: "ccReveal 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <button
            onClick={swear}
            className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            I take the Creator's Oath
          </button>
        </div>
      )}

      {sworn && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#8B4EC4] bg-[#faf5ff] text-xl font-black tracking-widest text-[#8B4EC4] shadow-lg shadow-purple-100"
            style={{ animation: "ccStamp 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
          >
            OATH
          </div>
          <p
            className="text-center text-xl font-black text-[#15803d]"
            style={{ animation: "ccReveal 0.5s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}
          >
            Oath taken. You are now a responsible AI creator.
          </p>
        </div>
      )}
      {sworn && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes ccReveal { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes ccStamp { 0% { opacity: 0; transform: scale(2.2) rotate(-14deg); } 60% { opacity: 1; transform: scale(0.92) rotate(3deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @media (prefers-reduced-motion: reduce) { [style*="ccReveal"], [style*="ccStamp"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
