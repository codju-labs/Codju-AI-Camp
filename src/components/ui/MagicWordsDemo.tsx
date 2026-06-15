import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * MagicWordsDemo — AI Creator Camp Day 1, Level 2 hook.
 * Student "runs" two prompts on the same simulated AI: a lazy one and a
 * magic one. Output types out chat-style. Then one question locks in the
 * insight: the only difference was the words.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const BORING_PROMPT = "Write a poem.";
const BORING_OUTPUT =
  "Roses are red,\nViolets are blue,\nPoems are nice,\nAnd flowers are too.";

const MAGIC_PROMPT =
  "You are a funny rap artist. Write a 4-line rap about a student who forgot his homework. Make it rhyme.";
const MAGIC_OUTPUT =
  "My homework's gone, it vanished from sight,\nI blame my dog — he ate it last night.\nTeacher is staring, I'm frozen in fear,\n\"The WiFi was down!\" — my best excuse this year.";

const OPTIONS = [
  { text: "The AI got smarter", correct: false },
  { text: "The words in the prompt", correct: true },
  { text: "Just luck", correct: false },
];

// Types text into `out` character by character; calls onDone when finished.
const useTypewriter = (text: string, run: boolean, onDone: () => void, instant: boolean) => {
  const [out, setOut] = useState(instant ? text : "");
  const doneRef = useRef(false);
  useEffect(() => {
    if (!run || doneRef.current) return;
    if (instant) {
      setOut(text);
      doneRef.current = true;
      onDone();
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setOut(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        doneRef.current = true;
        onDone();
      }
    }, 24);
    return () => clearInterval(id);
  }, [run, text, instant]);
  return out;
};

const PromptCard: React.FC<{
  label: string;
  labelColor: string;
  prompt: string;
  output: string;
  run: boolean;
  instant: boolean;
  onRun: () => void;
  onDone: () => void;
  buttonText: string;
}> = ({ label, labelColor, prompt, output, run, instant, onRun, onDone, buttonText }) => {
  const typed = useTypewriter(output, run, onDone, instant);
  return (
    <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
      <p className={`mb-2 text-sm font-black uppercase tracking-widest ${labelColor}`}>{label}</p>
      <div className="rounded-2xl bg-slate-100 px-4 py-3 font-mono text-base md:text-lg font-bold leading-relaxed text-slate-700">
        {prompt}
      </div>
      {!run && !instant ? (
        <button
          onClick={onRun}
          className="mt-3 w-full rounded-full bg-[#8B4EC4] py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
        >
          {buttonText}
        </button>
      ) : (
        <div className="mt-3 rounded-2xl border-2 border-slate-100 bg-[#fafaff] px-4 py-3">
          <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-400">AI says:</p>
          <p className="whitespace-pre-line text-base md:text-lg font-bold leading-relaxed text-slate-700">
            {typed}
            {typed.length < output.length && <span className="animate-pulse">|</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export const MagicWordsDemo: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [stage, setStage] = useState(isCompleted ? 4 : 0); // 0 idle, 1 boring done, 2 magic running, 3 magic done, 4 solved
  const [runBoring, setRunBoring] = useState(isCompleted);
  const [runMagic, setRunMagic] = useState(isCompleted);
  const [pick, setPick] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  const solved = stage >= 4;

  const choose = (i: number) => {
    if (solved) return;
    setPick(i);
    if (OPTIONS[i].correct) {
      setStage(4);
      completeSection(sectionIndex, false);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <PromptCard
        label="Prompt 1 · what most people type"
        labelColor="text-slate-400"
        prompt={BORING_PROMPT}
        output={BORING_OUTPUT}
        run={runBoring}
        instant={isCompleted}
        onRun={() => setRunBoring(true)}
        onDone={() => setStage((s) => Math.max(s, 1))}
        buttonText="Run this prompt"
      />

      {stage >= 1 && (
        <>
          <p className="text-center text-lg font-bold text-slate-500">
            A bit boring. Now watch what the <span className="text-[#8B4EC4] font-black">magic words</span> do to the SAME AI.
          </p>
          <PromptCard
            label="Prompt 2 · the magic words"
            labelColor="text-[#8B4EC4]"
            prompt={MAGIC_PROMPT}
            output={MAGIC_OUTPUT}
            run={runMagic}
            instant={isCompleted}
            onRun={() => {
              setRunMagic(true);
              setStage(2);
            }}
            onDone={() => setStage((s) => Math.max(s, 3))}
            buttonText="Run the magic prompt"
          />
        </>
      )}

      {stage >= 3 && !solved && (
        <div className="space-y-3 pt-2">
          <p className="text-center text-lg md:text-xl font-bold text-slate-600">
            Same AI. What made answer 2 so much better?
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
          Exactly. The only thing that changed was the words.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
