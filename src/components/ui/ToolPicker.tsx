import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * ToolPicker — AI Creator Camp Day 1, Level 3.
 * "Right tool for the job" game: 5 mission cards shown one at a time.
 * Student picks ChatGPT / Gemini / Perplexity, gets instant feedback with a
 * one-line why, can retry on wrong, and sees a score recap at the end.
 * Score counts first-try hits. Section completes at the recap.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

type ToolId = "chatgpt" | "claude" | "gemini" | "perplexity";

const TOOL_BUTTONS: {
  id: ToolId;
  initial: string;
  tileBg: string;
  name: string;
  idle: string;
  hover: string;
}[] = [
  { id: "chatgpt", initial: "C", tileBg: "bg-emerald-500", name: "ChatGPT", idle: "border-emerald-200 bg-emerald-50 text-emerald-800", hover: "hover:border-emerald-400" },
  { id: "claude", initial: "Cl", tileBg: "bg-amber-500", name: "Claude", idle: "border-amber-200 bg-amber-50 text-amber-800", hover: "hover:border-amber-400" },
  { id: "gemini", initial: "G", tileBg: "bg-blue-500", name: "Gemini", idle: "border-blue-200 bg-blue-50 text-blue-800", hover: "hover:border-blue-400" },
  { id: "perplexity", initial: "P", tileBg: "bg-purple-500", name: "Perplexity", idle: "border-purple-200 bg-purple-50 text-[#5b2d86]", hover: "hover:border-purple-400" },
];

interface Mission {
  text: string;
  answer: ToolId;
  why: string;
  hint: string;
}

const MISSIONS: Mission[] = [
  {
    text: "Write a quick, funny poem about Mondays.",
    answer: "chatgpt",
    why: "Quick and fun and imaginative — that's the Creative Brain.",
    hint: "Fast and playful. Who loves to imagine?",
  },
  {
    text: "Read my long story and help me improve it, line by line.",
    answer: "claude",
    why: "Long, careful writing is the Careful Thinker's job.",
    hint: "It's long and needs care. Who never loses track?",
  },
  {
    text: "Make a poster image of my superhero.",
    answer: "gemini",
    why: "Only the All-Rounder makes pictures.",
    hint: "You need a picture, not words. Who can draw?",
  },
  {
    text: "Is it true the Great Wall is visible from space? Show proof.",
    answer: "perplexity",
    why: "Proof with sources means the Research Detective. (And no — it isn't.)",
    hint: "You need evidence. Who shows their sources?",
  },
  {
    text: "Find and fix the bug in my Python code.",
    answer: "claude",
    why: "Careful coding is where the Careful Thinker shines.",
    hint: "Code needs patience and care. Who thinks it through?",
  },
  {
    text: "Make a short video clip of a rocket taking off.",
    answer: "gemini",
    why: "Only the All-Rounder makes video.",
    hint: "A moving clip, not text. Who can film?",
  },
];

const recapLine = (score: number) => {
  const total = MISSIONS.length;
  if (score === total) return `${score} out of ${total}. You think like a pro.`;
  if (score >= total - 1) return `${score} out of ${total}. Almost perfect.`;
  if (score >= total - 3) return `${score} out of ${total}. Solid work.`;
  return `${score} out of ${total}. Every miss taught you something.`;
};

export const ToolPicker: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);
  // Captured at mount: true only when revisiting an already-solved section
  // (isCompleted flips true mid-session right after completeSection fires).
  const [restored] = useState(isCompleted);

  const [mission, setMission] = useState(0);
  const [score, setScore] = useState(0);
  const [missedThis, setMissedThis] = useState(false);
  const [pick, setPick] = useState<ToolId | null>(null);
  const [gotIt, setGotIt] = useState(false);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(isCompleted);

  const m = MISSIONS[mission];

  const choose = (id: ToolId) => {
    if (gotIt || done) return;
    setPick(id);
    if (id === m.answer) {
      setGotIt(true);
      if (!missedThis) setScore((s) => s + 1);
    } else {
      setMissedThis(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const next = () => {
    if (mission + 1 >= MISSIONS.length) {
      setDone(true);
      completeSection(sectionIndex, false);
    } else {
      setMission(mission + 1);
      setPick(null);
      setGotIt(false);
      setMissedThis(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
          <p className="text-2xl font-black text-slate-800">Missions complete!</p>
          <p className="mt-3 text-xl font-black text-[#15803d]">
            {restored ? "You picked the right hero for every mission." : recapLine(score)}
          </p>
          <p className="mt-3 text-lg font-bold text-slate-500">
            Quick creative? ChatGPT. Long writing or code? Claude. Pictures and video? Gemini. Proof? Perplexity.
          </p>
        </div>
        <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
      </div>
    );
  }

  const wrongPick = pick !== null && pick !== m.answer;

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      {/* progress dots */}
      <div className="flex items-center justify-center gap-2">
        {MISSIONS.map((_, i) => (
          <span
            key={i}
            className={`h-2.5 rounded-full transition-all ${
              i < mission ? "w-2.5 bg-[#2EB85C]" : i === mission ? "w-7 bg-[#8B4EC4]" : "w-2.5 bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* mission card */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">
          Mission {mission + 1} of {MISSIONS.length}
        </p>
        <p className="mt-3 text-xl font-black leading-snug text-slate-800 md:text-2xl">
          “{m.text}”
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TOOL_BUTTONS.map((t) => {
            const isWrong = pick === t.id && t.id !== m.answer;
            const isRight = gotIt && t.id === m.answer;
            return (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                disabled={gotIt}
                className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 text-lg font-black transition active:scale-95 ${
                  isWrong
                    ? "border-red-200 bg-red-50 text-red-500"
                    : isRight
                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                      : `${t.idle} ${t.hover}`
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.tileBg} text-base font-black text-white`}
                >
                  {t.initial}
                </span>
                {t.name}
              </button>
            );
          })}
        </div>

        {wrongPick && !gotIt && (
          <p className="mt-3 text-center text-lg font-bold text-red-500">
            Not quite. {m.hint}
          </p>
        )}
        {gotIt && (
          <div className="mt-4 rounded-2xl bg-[#E4F9E4] px-4 py-3 text-center">
            <p className="text-lg font-black text-[#15803d]">
              {missedThis ? "Got it on the retry! " : "Nailed it! "}
              {m.why}
            </p>
            <button
              onClick={next}
              className="mt-3 rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
            >
              {mission + 1 >= MISSIONS.length ? "See my score" : "Next mission →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
