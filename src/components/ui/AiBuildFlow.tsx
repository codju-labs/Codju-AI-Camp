import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * AiBuildFlow — AI Creator Camp Day 5, Level 4. Reveals the OLD way websites
 * were built (long chain of people) versus the AI way (idea to website in a
 * few steps), side by side. Ends with one check question.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const OLD_WAY = ["Idea", "Designer draws it", "Developer codes it", "Testing", "Deployment"];
const AI_WAY = ["Idea", "Write a prompt", "AI tool builds it", "Website"];

const OPTIONS = [
  { text: "It turns out an idea into a working website in far fewer steps", correct: true },
  { text: "It makes websites slower to build", correct: false },
  { text: "It removes the need to have an idea", correct: false },
];

const Chain: React.FC<{ steps: string[]; tone: "old" | "ai" }> = ({ steps, tone }) => (
  <div className="space-y-2">
    {steps.map((s, i) => (
      <div key={i} className="flex flex-col items-center">
        <div className={`w-full rounded-2xl border-2 px-4 py-3 text-center text-lg font-black ${tone === "ai" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}>{s}</div>
        {i < steps.length - 1 && <span className={`my-0.5 text-xl font-black ${tone === "ai" ? "text-emerald-400" : "text-slate-300"}`}>{"↓"}</span>}
      </div>
    ))}
  </div>
);

export const AiBuildFlow: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [showAi, setShowAi] = useState(isCompleted);
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(isCompleted);
  const [shake, setShake] = useState(false);

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
        Building a website used to take a whole team. AI changed that. Compare the two ways.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-center text-base font-black uppercase tracking-widest text-slate-400">The old way</p>
          <Chain steps={OLD_WAY} tone="old" />
        </div>
        <div className={`rounded-3xl border-2 p-4 transition ${showAi ? "border-emerald-200 bg-white" : "border-dashed border-slate-300 bg-white"}`}>
          <p className="mb-3 text-center text-base font-black uppercase tracking-widest text-emerald-600">The AI way</p>
          {showAi ? (
            <div style={{ animation: "afPop 0.4s ease both" }}><Chain steps={AI_WAY} tone="ai" /></div>
          ) : (
            <button onClick={() => setShowAi(true)} className="w-full rounded-2xl bg-[#8B4EC4] px-5 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">Show the AI way</button>
          )}
        </div>
      </div>

      {showAi && !solved && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">So what does AI actually do for website building?</p>
          <div className="flex flex-col gap-2">
            {OPTIONS.map((o, i) => {
              const wrong = pick === i && !o.correct;
              return (
                <button key={i} onClick={() => choose(i)} className={`rounded-2xl border-2 px-5 py-4 text-left text-lg font-bold transition active:scale-[0.98] ${wrong ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"}`}>{o.text}</button>
              );
            })}
          </div>
        </div>
      )}

      {solved && <p className="text-center text-lg md:text-xl font-black text-[#15803d]">Right. You bring the idea and the words; AI does the heavy building.</p>}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
      <style>{`@keyframes afPop { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="afPop"]{animation:none!important;}}`}</style>
    </div>
  );
};
