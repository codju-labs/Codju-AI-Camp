import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * AiccQuiz — AI Creator Camp Day 1 finale. The Prompt Master Quiz.
 * Five MCQs, one at a time: instant feedback, a fun fact after each
 * correct answer, progress dots, gentle retry on wrong. Score counts
 * first-try hits.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Question {
  q: string;
  options: string[];
  correct: number;
  funFact: string;
}

const QUESTIONS: Question[] = [
  {
    q: 'What is a "prompt"?',
    options: ["The AI's answer", "The instruction you give the AI", "A type of robot", "A website"],
    correct: 1,
    funFact: "A prompt is a nudge — you nudge the AI into action.",
  },
  {
    q: "R-C-T-F stands for…",
    options: ["Read-Copy-Test-Finish", "Role-Context-Task-Format", "Run-Click-Type-Find", "Robot-Code-Tool-File"],
    correct: 1,
    funFact: "Prompt Engineer is a real, paid job at AI companies.",
  },
  {
    q: "Which tool is BEST for finding true facts WITH sources?",
    options: ["ChatGPT", "Gemini", "Perplexity", "YouTube"],
    correct: 2,
    funFact: "Perplexity is like a detective who always shows the evidence.",
  },
  {
    q: "Your AI answer is boring. Smartest fix?",
    options: ["Give up", "Blame the AI", "Improve your prompt", "Use a different computer"],
    correct: 2,
    funFact: "The mantra: fix the prompt, not the AI.",
  },
  {
    q: "Which is a SAFE thing to do with AI?",
    options: [
      "Type your home address",
      "Share your school photo",
      "Double-check facts before trusting them",
      "Write mean things about a classmate",
    ],
    correct: 2,
    funFact: "Checking facts is a creator superpower.",
  },
];

const NUDGES = [
  "Not quite — give it another shot.",
  "Close! Think back to what you learned today.",
  "Hmm, try once more — you've got this.",
];

const recap = (score: number) => {
  if (score === 5) return "5/5 — Prompt genius!";
  if (score === 4) return "4/5 — Almost flawless.";
  if (score === 3) return "3/5 — Solid! The craft is sinking in.";
  return `${score}/5 — You got there in the end. That's what matters.`;
};

export const AiccQuiz: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [current, setCurrent] = useState(isCompleted ? QUESTIONS.length : 0);
  const [pick, setPick] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false); // current q answered correctly
  const [missedFirst, setMissedFirst] = useState(false);
  const [score, setScore] = useState(isCompleted ? QUESTIONS.length : 0);
  const [shake, setShake] = useState(false);
  const [nudge, setNudge] = useState("");

  const done = current >= QUESTIONS.length;
  const q = done ? null : QUESTIONS[current];

  const choose = (i: number) => {
    if (!q || answered) return;
    setPick(i);
    if (i === q.correct) {
      setAnswered(true);
      setNudge("");
      if (!missedFirst) setScore((s) => s + 1);
    } else {
      setMissedFirst(true);
      setNudge(NUDGES[Math.floor(Math.random() * NUDGES.length)]);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const next = () => {
    const n = current + 1;
    setCurrent(n);
    setPick(null);
    setAnswered(false);
    setMissedFirst(false);
    setNudge("");
    if (n >= QUESTIONS.length) {
      completeSection(sectionIndex, false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2">
        {QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-emerald-400"
                : i === current && !done
                  ? "scale-125 bg-[#8B4EC4]"
                  : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {!done && q && (
        <div
          key={current}
          className={`rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm ${shake ? "animate-shake" : ""}`}
          style={{ animation: "quizIn 0.45s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">
            Question {current + 1} of {QUESTIONS.length}
          </p>
          <p className="mb-5 text-xl font-black text-slate-800 md:text-2xl">{q.q}</p>

          <div className="flex flex-col gap-2">
            {q.options.map((o, i) => {
              const isRight = answered && i === q.correct;
              const isWrong = pick === i && i !== q.correct;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={answered}
                  className={`rounded-2xl border-2 px-5 py-3 text-left text-lg font-bold transition active:scale-[0.98] ${
                    isRight
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : isWrong
                        ? "border-red-200 bg-red-50 text-red-500"
                        : answered
                          ? "border-slate-100 bg-white text-slate-400"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
                  }`}
                >
                  <span className="mr-2 font-black text-slate-400">
                    {String.fromCharCode(65 + i)})
                  </span>
                  {o}
                </button>
              );
            })}
          </div>

          {nudge && !answered && (
            <p className="mt-4 text-center text-lg font-bold text-amber-600">{nudge}</p>
          )}

          {answered && (
            <div
              className="mt-4 space-y-3"
              style={{ animation: "quizIn 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
            >
              <div className="rounded-2xl border-2 border-[#fed7aa] bg-[#fff7ed] px-5 py-4">
                <p className="text-lg font-bold text-[#b45309]">
                  <span className="font-black">Fun fact:</span> {q.funFact}
                </p>
              </div>
              <button
                onClick={next}
                className="w-full rounded-full bg-[#8B4EC4] py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
              >
                {current === QUESTIONS.length - 1 ? "See my score" : "Next question →"}
              </button>
            </div>
          )}
        </div>
      )}

      {done && (
        <div
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center"
          style={{ animation: "quizIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="mb-1 text-2xl font-black text-emerald-700">{recap(score)}</p>
          <p className="text-lg font-bold text-emerald-800">
            Quiz cleared. One thing left: build your superhero.
          </p>
        </div>
      )}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes quizIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="quizIn"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
