import React, { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * ImprovePrompt — AI Creator Camp Day 1 finale. "Prompt Battle" practice.
 * Student rewrites the weak prompt "tell me about tigers" in a textarea.
 * Four R-C-T-F letter tiles light up live as heuristics detect Role /
 * Context / Task / Format. 3 of 4 lit = prompt upgraded, section complete.
 * Heuristics are deliberately forgiving — effort wins.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const WEAK_PROMPT = "tell me about tigers";

const PRO_EXAMPLE =
  "You are a wildlife expert talking to a 12-year-old. Explain 5 amazing facts about tigers in short bullet points.";

interface ChipCheck {
  key: string;
  letter: string;
  label: string;
  litClass: string;
  test: (t: string) => boolean;
  hint: string;
}

const CHIPS: ChipCheck[] = [
  {
    key: "role",
    letter: "R",
    label: "Role",
    litClass: "border-[#8B4EC4] bg-[#8B4EC4] text-white",
    test: (t) => /you are|act as|pretend/i.test(t),
    hint: 'Add a role. Who should the AI be? Try "You are a wildlife expert".',
  },
  {
    key: "context",
    letter: "C",
    label: "Context",
    litClass: "border-blue-600 bg-blue-600 text-white",
    test: (t) =>
      /audience|age|grade|for a|i am|i'm|i’m/i.test(t) ||
      (t.length > 60 && /for/i.test(t)),
    hint: 'Add context. Who is this for? Try "for a 12-year-old" or "I am in grade 7".',
  },
  {
    key: "task",
    letter: "T",
    label: "Task",
    litClass: "border-emerald-600 bg-emerald-600 text-white",
    test: (t) =>
      t.trim().length >= 25 &&
      /explain|write|give|list|tell|create|describe/i.test(t),
    hint: 'Make the task clear. Use an action word like "explain", "list" or "write".',
  },
  {
    key: "format",
    letter: "F",
    label: "Format",
    litClass: "border-amber-500 bg-amber-500 text-white",
    test: (t) =>
      /points?|list|table|lines?|bullet|steps?|short|paragraph|rap|poem|story/i.test(
        t
      ),
    hint: "Pick a format. Bullet points? A table? A rap? Tell the AI the shape of the answer.",
  },
];

export const ImprovePrompt: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [text, setText] = useState(isCompleted ? PRO_EXAMPLE : "");
  const [solved, setSolved] = useState(isCompleted);

  const results = useMemo(
    () => CHIPS.map((c) => ({ ...c, lit: c.test(text) })),
    [text]
  );
  const litCount = results.filter((r) => r.lit).length;
  const firstMissing = results.find((r) => !r.lit);

  const onChange = (v: string) => {
    if (solved) return;
    setText(v);
    const score = CHIPS.filter((c) => c.test(v)).length;
    if (score >= 3) {
      setSolved(true);
      completeSection(sectionIndex, false);
    }
  };

  const feedback = solved
    ? ""
    : text.trim().length === 0
      ? "Type your upgraded prompt above. Make this weak prompt powerful."
      : litCount === 0
        ? firstMissing?.hint ?? ""
        : litCount < 3
          ? `Nice, ${litCount} of 4 lit. ${firstMissing?.hint ?? ""}`
          : "";

  return (
    <div className="space-y-4">
      {/* The weak prompt */}
      <div className="rounded-3xl border-2 border-red-100 bg-red-50/60 p-5">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-red-400">
          Weak prompt
        </p>
        <p className="rounded-2xl bg-white px-4 py-3 font-mono text-lg font-bold text-slate-500 line-through decoration-red-300">
          {WEAK_PROMPT}
        </p>
      </div>

      {/* Student's upgrade */}
      <div
        className={`rounded-3xl border-2 p-5 transition-colors ${
          solved ? "border-emerald-200 bg-emerald-50/60" : "border-[#e9d5ff] bg-white"
        }`}
      >
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#8B4EC4]">
          Your upgrade
        </p>
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          disabled={solved}
          rows={4}
          placeholder="Rewrite it with Role, Context, Task and Format"
          className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-mono text-lg font-bold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:bg-white disabled:opacity-80"
        />

        {/* R-C-T-F letter tiles */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {results.map((r) => (
            <span key={r.key} className="flex items-center gap-2">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-xl font-black transition-all duration-300 ${
                  r.lit
                    ? `scale-105 shadow-sm ${r.litClass}`
                    : "border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                {r.letter}
              </span>
              <span
                className={`text-lg font-black transition-colors duration-300 ${
                  r.lit ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {r.label}
              </span>
            </span>
          ))}
        </div>

        {feedback && (
          <p className="mt-4 text-center text-lg font-bold text-slate-500">
            {feedback}
          </p>
        )}
      </div>

      {solved && (
        <div
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center"
          style={{ animation: "ipPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <p className="mb-2 text-2xl font-black text-emerald-700">Prompt upgraded!</p>
          <p className="mb-3 text-lg font-bold text-emerald-800">
            You turned a weak prompt into a powerful one. Here is how a pro might write it:
          </p>
          <p className="rounded-2xl bg-white px-4 py-3 text-left font-mono text-lg font-bold text-slate-700">
            {PRO_EXAMPLE}
          </p>
        </div>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes ipPop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="ipPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
