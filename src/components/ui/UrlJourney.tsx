import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * UrlJourney — AI Creator Camp Day 5, Level 1. Tap-to-reveal the journey of
 * what happens when you type a web address and press Enter: browser → DNS →
 * server → files come back → page is drawn. Ends with one check question.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Step {
  tile: string;
  tileBg: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  { tile: "1", tileBg: "bg-[#8B4EC4]", title: "You type the address", body: "You type google.com in the browser and press Enter. This address is the website's name." },
  { tile: "2", tileBg: "bg-blue-500", title: "The browser asks: where is it?", body: "The internet looks up the name and finds the exact computer that holds the website. (This lookup is called DNS.)" },
  { tile: "3", tileBg: "bg-amber-500", title: "The request reaches a server", body: "A server is a powerful computer that stays on 24/7. It hears your request: 'Please send me this page.'" },
  { tile: "4", tileBg: "bg-emerald-500", title: "The files travel back", body: "The server sends back the website's files: the text, the layout, the pictures and buttons." },
  { tile: "5", tileBg: "bg-rose-500", title: "Your browser draws the page", body: "Your browser puts all the files together and shows you the finished page. All of this happens in under a second." },
];

const OPTIONS = [
  { text: "A powerful computer that stores the website and stays on all the time", correct: true },
  { text: "The picture you see on the screen", correct: false },
  { text: "The name you type, like google.com", correct: false },
];

export const UrlJourney: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [revealed, setRevealed] = useState(isCompleted ? STEPS.length : 1);
  const [pick, setPick] = useState<number | null>(null);
  const [solved, setSolved] = useState(isCompleted);
  const [shake, setShake] = useState(false);

  const allSteps = revealed >= STEPS.length;

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
        What really happens when you type a web address and press Enter?
      </div>

      <div className="space-y-3">
        {STEPS.slice(0, revealed).map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm"
            style={{ animation: "ujBeat 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.tileBg} text-lg font-black text-white shadow`}>{s.tile}</span>
            <div>
              <p className="text-xl font-black text-slate-800">{s.title}</p>
              <p className="mt-1 text-lg font-bold leading-snug text-slate-600">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      {!allSteps && (
        <div className="flex justify-center">
          <button
            onClick={() => setRevealed((r) => r + 1)}
            className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Next step
          </button>
        </div>
      )}

      {allSteps && !solved && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">Quick check: what is a <span className="font-black text-[#8B4EC4]">server</span>?</p>
          <div className="flex flex-col gap-2">
            {OPTIONS.map((o, i) => {
              const wrong = pick === i && !o.correct;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className={`rounded-2xl border-2 px-5 py-4 text-left text-lg font-bold transition active:scale-[0.98] ${
                    wrong ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
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
          That's it. A website lives on a server, and your browser fetches it every time you visit.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes ujBeat { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="ujBeat"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
