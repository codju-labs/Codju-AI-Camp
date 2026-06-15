import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * AiDebate — "The Great AI Debate". Motion: "AI should do your homework."
 * Student picks a side (no wrong choice), then discovers a pro-debater
 * trick: prep with an AI debate coach (the prompt is sneaky R-C-T-F).
 * Their 3 arguments reveal staggered, the opponent strikes back with 3
 * more — and the final question locks in the real lesson: AI argues
 * both sides equally well, so a HUMAN must judge.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

type Side = "for" | "against";

const SIDE_LABEL: Record<Side, string> = { for: "FOR", against: "AGAINST" };

const ARGS: Record<Side, string[]> = {
  for: [
    "It saves hours of busywork, so you can spend that time understanding ideas.",
    "AI is the calculator for words. We did not ban calculators — we taught maths smarter.",
    "Every future job will use AI. Homework that ignores it trains you for a world that is gone.",
  ],
  against: [
    "If AI does the thinking, you learn nothing — you just get good at pasting.",
    "AI makes confident mistakes. You would hand in errors with your name on top.",
    "Homework trains YOUR brain. Letting AI do it is like sending a robot to the gym for you.",
  ],
};

const OPTIONS = [
  {
    text: "The AI — it's smarter",
    correct: false,
    nudge: "Smarter with words, maybe — but it just argued BOTH sides with equal confidence. It has arguments, not beliefs.",
  },
  {
    text: "Nobody — ban everything",
    correct: false,
    nudge: "Banning a tool never made anyone wiser. Calculators survived school — so will AI. Someone still has to decide HOW it's used.",
  },
  {
    text: "The human — AI helps you think, it shouldn't think FOR you",
    correct: true,
    nudge: "",
  },
];

export const AiDebate: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [side, setSide] = useState<Side | null>(isCompleted ? "for" : null);
  const [argsShown, setArgsShown] = useState(isCompleted);
  const [oppShown, setOppShown] = useState(isCompleted);
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(isCompleted);
  const [shake, setShake] = useState(false);

  const opp: Side | null = side ? (side === "for" ? "against" : "for") : null;

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
      {/* The motion — debate stage */}
      <div className="rounded-3xl border-2 border-[#e9d5ff] bg-gradient-to-b from-[#faf5ff] to-white p-6 text-center shadow-sm">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#8B4EC4]">
          Tonight's motion
        </p>
        <p className="text-2xl font-black tracking-tight text-slate-800">
          "AI should do your homework."
        </p>
        {side && (
          <p className="mt-3 inline-block rounded-full bg-[#8B4EC4] px-5 py-1.5 text-base font-black text-white">
            You're arguing {SIDE_LABEL[side]}
          </p>
        )}
      </div>

      {/* Step 1: pick a side */}
      {!side && (
        <div className="space-y-3">
          <p className="text-center text-lg font-bold text-slate-600">
            Pick your side. There is no wrong one — yet.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setSide("for")}
              className="rounded-3xl border-2 border-slate-200 bg-white p-6 text-center transition active:scale-[0.97] hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
            >
              <span className="block text-3xl font-black tracking-widest text-slate-800">FOR</span>
              <span className="block text-lg font-bold text-slate-500">I'll argue yes</span>
            </button>
            <button
              onClick={() => setSide("against")}
              className="rounded-3xl border-2 border-slate-200 bg-white p-6 text-center transition active:scale-[0.97] hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
            >
              <span className="block text-3xl font-black tracking-widest text-slate-800">AGAINST</span>
              <span className="block text-lg font-bold text-slate-500">I'll argue no</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: the twist — pro debaters prep with AI */}
      {side && (
        <div className="space-y-3" style={{ animation: "debateIn 0.45s cubic-bezier(0.16,1,0.3,1) both" }}>
          <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
            Plot twist: pro debaters don't argue alone — they{" "}
            <span className="font-black">prep with AI</span>. Watch the move.
          </div>
          <div className="rounded-3xl border-2 border-slate-700 bg-slate-900 p-5 shadow-md">
            <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">
              Your debate-coach prompt
            </p>
            <p className="font-mono text-lg font-medium leading-relaxed text-emerald-300">
              You are a debate coach. I'm arguing{" "}
              <span className="rounded bg-[#8B4EC4] px-1.5 py-0.5 font-black text-white">
                {SIDE_LABEL[side]}
              </span>{" "}
              "AI should do your homework" in a class debate. Give me my 3 strongest
              arguments, each in one line.
            </p>
          </div>
          <p className="text-center text-base font-bold text-slate-400">
            (Did you spot the R-C-T-F in that prompt?)
          </p>
          {!argsShown && (
            <div className="flex justify-center">
              <button
                onClick={() => setArgsShown(true)}
                className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
              >
                Get my arguments
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: YOUR arguments, staggered */}
      {side && argsShown && (
        <div className="space-y-3">
          <p className="text-center text-sm font-black uppercase tracking-widest text-[#8B4EC4]">
            Your 3 strongest arguments · {SIDE_LABEL[side]}
          </p>
          {ARGS[side].map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-3xl border-2 border-[#e9d5ff] bg-[#faf5ff] px-5 py-4"
              style={{
                animation: `debateIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) ${i * 0.45}s both`,
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B4EC4] text-base font-black text-white">
                {i + 1}
              </span>
              <p className="text-lg font-bold leading-relaxed text-slate-700">{a}</p>
            </div>
          ))}
          {!oppShown && (
            <div className="flex justify-center pt-1">
              <button
                onClick={() => setOppShown(true)}
                className="rounded-full bg-slate-800 px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-slate-700"
                style={{ animation: "debateIn 0.45s cubic-bezier(0.16,1,0.3,1) 1.4s both" }}
              >
                The opponent strikes back
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: the opponent's arguments */}
      {side && opp && oppShown && (
        <div className="space-y-3">
          <div
            className="rounded-2xl bg-[#fff7ed] px-5 py-3 text-center text-lg font-bold text-[#b45309]"
            style={{ animation: "debateIn 0.45s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            Uh oh — the other team asked the <span className="font-black">same AI</span>.
            And it argued just as hard for THEM.
          </div>
          <p className="text-center text-sm font-black uppercase tracking-widest text-slate-500">
            Their 3 strongest arguments · {SIDE_LABEL[opp]}
          </p>
          {ARGS[opp].map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-3xl border-2 border-slate-200 bg-white px-5 py-4"
              style={{
                animation: `debateIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) ${0.3 + i * 0.45}s both`,
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700 text-base font-black text-white">
                {i + 1}
              </span>
              <p className="text-lg font-bold leading-relaxed text-slate-700">{a}</p>
            </div>
          ))}
        </div>
      )}

      {/* Step 5: the judgement */}
      {oppShown && !solved && (
        <div
          className="space-y-3 pt-2"
          style={{ animation: "debateIn 0.45s cubic-bezier(0.16,1,0.3,1) 1.8s both" }}
        >
          <p className="text-center text-xl font-bold text-slate-600">
            Both sides are done. Who should make the final call on how AI is used
            for homework?
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
          {pick !== null && !OPTIONS[pick].correct && (
            <p className="text-center text-lg font-bold text-amber-600">
              {OPTIONS[pick].nudge}
            </p>
          )}
        </div>
      )}

      {/* Solved banner */}
      {solved && (
        <div
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center"
          style={{ animation: "debateIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="mb-1 text-2xl font-black text-emerald-700">Debate champion!</p>
          <p className="text-lg font-bold text-emerald-800">
            AI argues both sides — but a HUMAN judges.
          </p>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes debateIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="debateIn"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
