import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * SiteTypeSort — AI Creator Camp Day 5, Level 3. One example at a time, the
 * student picks which TYPE of website it is. Teaches the common website
 * categories through real, familiar examples.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const TYPES = ["Portfolio", "Blog", "E-commerce", "Educational", "Social Media", "News"];

interface Q {
  example: string;
  answer: string;
  why: string;
}

const QUESTIONS: Q[] = [
  { example: "A site where an artist shows off all their best drawings to get hired.", answer: "Portfolio", why: "A portfolio shows your work to impress people." },
  { example: "Amazon, where you browse products and place orders.", answer: "E-commerce", why: "E-commerce sites sell things online." },
  { example: "A site with lessons, videos and quizzes to learn maths.", answer: "Educational", why: "Educational sites help you learn a subject." },
  { example: "Instagram, where people post photos and follow friends.", answer: "Social Media", why: "Social media sites connect people and let them share." },
  { example: "A page where someone writes regular posts about their travels.", answer: "Blog", why: "A blog is a stream of posts on a topic, newest first." },
  { example: "A site that updates all day with the latest headlines.", answer: "News", why: "News sites report current events as they happen." },
];

export const SiteTypeSort: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [idx, setIdx] = useState(isCompleted ? QUESTIONS.length : 0);
  const [pick, setPick] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const done = idx >= QUESTIONS.length;

  const q = done ? null : QUESTIONS[idx];
  const correct = pick !== null && q !== null && pick === q.answer;

  const choose = (t: string) => {
    if (!q || correct) return;
    setPick(t);
    if (t !== q.answer) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  const next = () => { setIdx((i) => i + 1); setPick(null); };

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Websites come in types, each built for a different job. Read each one and pick its type.
      </div>

      {!done && q && (
        <>
          <div className="flex items-center justify-center gap-2">
            {QUESTIONS.map((_, i) => (
              <span key={i} className={`h-2.5 rounded-full transition-all ${i < idx ? "w-2.5 bg-[#2EB85C]" : i === idx ? "w-7 bg-[#8B4EC4]" : "w-2.5 bg-slate-200"}`} />
            ))}
          </div>
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">Which type of website?</p>
            <p className="mt-3 text-xl md:text-2xl font-black leading-snug text-slate-800">{q.example}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPES.map((t) => {
                const wrong = pick === t && t !== q.answer;
                const right = correct && t === q.answer;
                return (
                  <button key={t} onClick={() => choose(t)} disabled={correct} className={`rounded-2xl border-2 px-3 py-3 text-base font-black transition active:scale-95 ${wrong ? "border-red-200 bg-red-50 text-red-500" : right ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"}`}>{t}</button>
                );
              })}
            </div>
            {pick !== null && !correct && <p className="mt-3 text-center text-base font-bold text-red-500">Not quite — think about what people DO on that site.</p>}
            {correct && (
              <div className="mt-4 rounded-2xl bg-[#E4F9E4] px-4 py-3 text-center">
                <p className="text-lg font-black text-[#15803d]">{q.why}</p>
                <button onClick={next} className="mt-3 rounded-full bg-[#8B4EC4] px-10 py-3 text-base font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">{idx + 1 >= QUESTIONS.length ? "Finish" : "Next"}</button>
              </div>
            )}
          </div>
        </>
      )}

      {done && (
        <div style={{ animation: "stPop 0.4s ease both" }} className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-5 py-5 text-center">
          <p className="text-xl font-black text-slate-800">You can spot website types now.</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">When you build yours, you'll know exactly which type it is.</p>
        </div>
      )}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
      <style>{`@keyframes stPop { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="stPop"]{animation:none!important;}}`}</style>
    </div>
  );
};
