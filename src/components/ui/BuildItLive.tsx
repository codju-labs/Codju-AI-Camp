import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * BuildItLive — AI Creator Camp Day 5, Level 6. Reads the prompt the student
 * built in Level 5 (localStorage `aicc-web-prompt`) and walks them through
 * actually building the site: open Lovable or v0, paste, generate, refine.
 * Completes once they mark a tool done.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const EXAMPLE = 'Build a page about my hobby for kids my age. Pages: Home, About, Contact. Include a photo gallery. Make it fun and colourful with a blue and white colour theme. Add a clear "Follow me" button. Also make sure it works well on phones.';

interface Tool {
  id: string;
  name: string;
  initial: string;
  url: string;
  tileBg: string;
  border: string;
  btn: string;
}

const TOOLS: Tool[] = [
  { id: "lovable", name: "Lovable", initial: "Lv", url: "https://lovable.dev", tileBg: "bg-rose-500", border: "border-rose-200", btn: "bg-rose-600 hover:bg-rose-700" },
  { id: "v0", name: "v0", initial: "v0", url: "https://v0.app", tileBg: "bg-slate-900", border: "border-indigo-200", btn: "bg-slate-900 hover:bg-slate-800" },
];

const STEPS = [
  "Open the tool and sign in.",
  "Paste your prompt into the chat box.",
  "Press Enter and watch it build your site.",
  "Read the result. What is good? What is missing?",
  "Refine: type a follow-up like 'make the header bigger' or 'change the colours'.",
];

export const BuildItLive: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [prompt, setPrompt] = useState<string>(EXAMPLE);
  const [hasOwn, setHasOwn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<Set<string>>(isCompleted ? new Set(["lovable"]) : new Set());
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem("aicc-web-prompt");
      if (raw && raw.trim()) { setPrompt(raw); setHasOwn(true); }
    } catch {
      /* ignore */
    }
  }, []);

  const copy = () => { navigator.clipboard?.writeText(prompt).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const markDone = (id: string) => {
    setDone((s) => {
      if (s.has(id)) return s;
      const n = new Set(s).add(id);
      completeSection(sectionIndex, false);
      return n;
    });
  };
  const anyDone = done.size > 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl px-5 py-3 text-center text-lg font-bold ${hasOwn ? "bg-[#faf5ff] text-[#6b21a8]" : "bg-amber-50 text-amber-700"}`}>
        {hasOwn ? "Here is the prompt you built. Time to make it real." : "Tip: build your prompt in Lesson 5 first. Here's an example to use."}
      </div>

      <div className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Your prompt</p>
        <p className="mt-1 whitespace-pre-line font-mono text-base font-bold leading-relaxed text-slate-700">{prompt}</p>
        <button onClick={copy} className="mt-3 w-full rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]">{copied ? "Copied!" : "Copy prompt"}</button>
      </div>

      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">The 5 build steps</p>
        <ol className="mt-2 space-y-1.5">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-lg font-bold text-slate-700">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#8B4EC4] text-sm font-black text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-center text-base font-black uppercase tracking-widest text-slate-400">Open a builder and go</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TOOLS.map((t) => {
          const isDone = done.has(t.id);
          return (
            <div key={t.id} className={`rounded-3xl border-2 p-4 shadow-sm transition ${isDone ? "border-emerald-300 bg-emerald-50" : `${t.border} bg-white`}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${t.tileBg} text-base font-black text-white shadow`}>{t.initial}</span>
                <p className="text-xl font-black text-slate-800">{t.name}</p>
                {isDone && <span className="ml-auto rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">Built</span>}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <a href={t.url} target="_blank" rel="noopener noreferrer" className={`rounded-full ${t.btn} px-5 py-3 text-center text-base font-black text-white shadow-sm transition active:scale-95`}>Open {t.name}</a>
                <button onClick={() => markDone(t.id)} className={`rounded-full px-5 py-3 text-base font-black shadow-sm transition active:scale-95 ${isDone ? "bg-emerald-100 text-emerald-700" : "bg-[#2EB85C] text-white hover:bg-[#28a745]"}`}>{isDone ? "Done" : "I built it here"}</button>
              </div>
            </div>
          );
        })}
      </div>

      {anyDone && <p className="text-center text-xl font-black text-[#15803d]">Your website exists. Next: what makes it actually go live?</p>}
      {anyDone && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
