import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PromptBuilder — the flagship interactive of AI Creator Camp Day 1.
 * Four labelled inputs (Role, Context, Task, Format) feed a live preview
 * card that assembles the full prompt in real time, colour-coded per
 * ingredient. A "CRAFT level" meter fills as fields get meaningful
 * content; when all four are filled the student can copy their pro
 * prompt and the section completes.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

type Key = "R" | "C" | "T" | "F";

const FIELDS: {
  key: Key;
  name: string;
  question: string;
  placeholder: string;
  label: string; // label colour
  ring: string; // focus ring colour
  dot: string;
  preview: string; // preview text colour classes
}[] = [
  {
    key: "R",
    name: "Role",
    question: "Who should the AI be?",
    placeholder: "You are a comic book writer…",
    label: "text-[#6b21a8]",
    ring: "focus:border-[#8B4EC4]",
    dot: "bg-[#8B4EC4]",
    preview: "bg-[#f3e8ff] text-[#6b21a8]",
  },
  {
    key: "C",
    name: "Context",
    question: "What's the background?",
    placeholder: "I'm a 12-year-old who loves cricket and space…",
    label: "text-blue-700",
    ring: "focus:border-blue-500",
    dot: "bg-blue-500",
    preview: "bg-blue-100 text-blue-800",
  },
  {
    key: "T",
    name: "Task",
    question: "What exactly do you want?",
    placeholder: "Invent an original superhero for me…",
    label: "text-emerald-700",
    ring: "focus:border-emerald-500",
    dot: "bg-emerald-500",
    preview: "bg-emerald-100 text-emerald-800",
  },
  {
    key: "F",
    name: "Format",
    question: "What shape should the answer be?",
    placeholder: "Give it as: Name, 3 Powers, 1 Mission, 1 Weakness, 2-line backstory…",
    label: "text-amber-700",
    ring: "focus:border-amber-500",
    dot: "bg-amber-500",
    preview: "bg-amber-100 text-amber-800",
  },
];

const SAMPLE: Record<Key, string> = {
  R: "You are a comic book writer.",
  C: "I'm a 12-year-old who loves cricket and space.",
  T: "Invent an original superhero for me.",
  F: "Give it as: Name, 3 Powers, 1 Mission, 1 Weakness, 2-line backstory.",
};

const MIN_CHARS = 8;

type ToolId = "chatgpt" | "claude" | "gemini" | "perplexity";

// Tool launch links. ChatGPT and Perplexity accept the prompt as a URL query
// (so it pre-fills / runs); Gemini and Claude just open the app and the
// student pastes the prompt we copy for them.
const TOOL_LINKS: {
  id: ToolId;
  name: string;
  initial: string;
  tileBg: string;
  border: string;
  url: (p: string) => string;
}[] = [
  { id: "chatgpt", name: "ChatGPT", initial: "C", tileBg: "bg-emerald-500", border: "border-emerald-300", url: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
  { id: "claude", name: "Claude", initial: "Cl", tileBg: "bg-amber-500", border: "border-amber-300", url: () => "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", initial: "G", tileBg: "bg-blue-500", border: "border-blue-300", url: () => "https://gemini.google.com/app" },
  { id: "perplexity", name: "Perplexity", initial: "P", tileBg: "bg-purple-500", border: "border-purple-300", url: (p) => `https://www.perplexity.ai/search?q=${encodeURIComponent(p)}` },
];

const RECO_REASON: Record<ToolId, string> = {
  chatgpt: "great for all-round creative writing.",
  claude: "best for long writing and code.",
  gemini: "best for images and video.",
  perplexity: "best for real facts with sources.",
};

// Pick the best-fit tool from what the student actually wrote.
const recommend = (p: string): ToolId => {
  const s = p.toLowerCase();
  if (/\b(research|find out|fact|facts|true|sources?|prove|proof|compare|latest|news|statistics?|evidence)\b/.test(s)) return "perplexity";
  if (/\b(image|picture|poster|draw|drawing|logo|illustration|photo|art|comic|video|animate)\b/.test(s)) return "gemini";
  if (/\b(code|coding|program|python|javascript|html|debug|bug|function|essay|document|summari|analy|report)\b/.test(s)) return "claude";
  return "chatgpt";
};

export const PromptBuilder: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [values, setValues] = useState<Record<Key, string>>(
    isCompleted ? { ...SAMPLE } : { R: "", C: "", T: "", F: "" }
  );
  const [solved, setSolved] = useState(isCompleted);
  const [copied, setCopied] = useState(false);
  const completedRef = useRef(isCompleted);

  const filled = FIELDS.filter((f) => values[f.key].trim().length >= MIN_CHARS).length;
  const allFilled = filled === 4;
  const anyTyped = FIELDS.some((f) => values[f.key].trim().length > 0);

  useEffect(() => {
    if (allFilled && !completedRef.current) {
      completedRef.current = true;
      setSolved(true);
      completeSection(sectionIndex, false);
    }
  }, [allFilled, sectionIndex]);

  const fullPrompt = FIELDS.map((f) => values[f.key].trim())
    .filter(Boolean)
    .join(" ");

  const reco = recommend(fullPrompt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* The 4 ingredient inputs */}
      <div className="space-y-3">
        {FIELDS.map((f) => {
          const ok = values[f.key].trim().length >= MIN_CHARS;
          return (
            <div key={f.key} className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-2 flex items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-white ${f.dot}`}
                >
                  {f.key}
                </span>
                <span className={`text-lg font-black ${f.label}`}>
                  {f.name} · {f.question}
                </span>
                {ok && (
                  <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                    added
                  </span>
                )}
              </label>
              <input
                type="text"
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={`w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 ${f.ring}`}
              />
            </div>
          );
        })}
      </div>

      {/* CRAFT meter */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
            CRAFT level
          </p>
          <p className={`text-base font-black ${allFilled ? "text-[#8B4EC4]" : "text-slate-400"}`}>
            {allFilled ? "MAX — pro prompt" : `${filled}/4 ingredients`}
          </p>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allFilled
                ? "bg-gradient-to-r from-[#8B4EC4] via-emerald-400 to-amber-400"
                : "bg-[#8B4EC4]"
            }`}
            style={{ width: `${(filled / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-3xl border-2 border-[#e9d5ff] bg-[#faf5ff] p-5">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-[#8B4EC4]">
          Your prompt, building live
        </p>
        {anyTyped ? (
          <p className="font-mono text-lg md:text-xl font-bold leading-loose">
            {FIELDS.map((f) =>
              values[f.key].trim() ? (
                <span key={f.key} className={`rounded-md px-1 py-0.5 ${f.preview}`}>
                  {values[f.key].trim()}{" "}
                </span>
              ) : null
            )}
          </p>
        ) : (
          <p className="text-lg font-bold text-slate-400">
            Start typing above — your prompt builds itself here.
          </p>
        )}
      </div>

      {/* Done state */}
      {allFilled && (
        <div className="pb-pop space-y-4">
          <div className="space-y-3 text-center">
            <button
              onClick={copy}
              className={`rounded-full px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${
                copied ? "bg-emerald-500" : "bg-[#8B4EC4] hover:bg-[#7a41b0]"
              }`}
            >
              {copied ? "Copied!" : "Copy my prompt"}
            </button>
            <p className="text-lg font-black text-[#15803d]">That is a pro prompt. Now try it for real.</p>
          </div>

          {/* Open in a real tool */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-center text-sm font-black uppercase tracking-widest text-slate-400">
              Open your prompt in
            </p>
            <p className="mt-1 text-center text-base font-bold text-slate-500">
              Best fit:{" "}
              <span className="font-black text-[#8B4EC4]">
                {TOOL_LINKS.find((t) => t.id === reco)!.name}
              </span>{" "}
              — {RECO_REASON[reco]}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
              {TOOL_LINKS.map((t) => {
                const isReco = t.id === reco;
                return (
                  <a
                    key={t.id}
                    href={t.url(fullPrompt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => navigator.clipboard?.writeText(fullPrompt).catch(() => {})}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition active:scale-95 ${
                      isReco
                        ? `${t.border} bg-slate-50 ring-2 ring-[#8B4EC4]`
                        : "border-slate-200 bg-white hover:border-[#8B4EC4]"
                    }`}
                  >
                    {isReco && (
                      <span className="absolute -top-2.5 rounded-full bg-[#8B4EC4] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Best fit
                      </span>
                    )}
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${t.tileBg} text-lg font-black text-white shadow`}
                    >
                      {t.initial}
                    </span>
                    <span className="text-base font-black text-slate-700">{t.name}</span>
                  </a>
                );
              })}
            </div>
            <p className="mt-3 text-center text-sm font-bold text-slate-400">
              We copy your prompt when you open a tool — just paste.
            </p>
          </div>
        </div>
      )}

      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes pbPop { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .pb-pop { animation: pbPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        @media (prefers-reduced-motion: reduce) { .pb-pop { animation: none; } }
      `}</style>
    </div>
  );
};
