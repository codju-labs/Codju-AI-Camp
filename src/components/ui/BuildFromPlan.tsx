import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * BuildFromPlan — AI Creator Camp Day 4, Level 3. Reads the DPAA build plan
 * the student made in Level 2 (localStorage `aicc-dpaa-plan`) and turns it
 * into ready-to-paste prompts for Lovable and Canva — so they build a real
 * website OF THEIR OWN IDEA. Falls back to an example plan if none saved.
 * Section completes once both builds are marked done.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Plan {
  idea: string;
  decompose: string;
  pattern: string;
  abstraction: string;
  algorithm: string;
}

const STORAGE_KEY = "aicc-dpaa-plan";

const EXAMPLE: Plan = {
  idea: "A Lost & Found website for my school",
  decompose: "Report a lost item, Report a found item, A list of all items, A search box",
  pattern: "Every item = photo + name + place + date",
  abstraction: "Item name, Photo, A way to contact",
  algorithm: "Someone reports an item -> It appears in the list -> The owner claims it",
};

const lovablePrompt = (p: Plan) =>
  `Build a colourful, kid-friendly website for this idea: ${p.idea}.\n\n` +
  `It should include: ${p.decompose}.\n\n` +
  `Each item follows the same pattern: ${p.pattern}.\n\n` +
  `For version 1, focus on the essentials: ${p.abstraction}.\n\n` +
  `The main flow: ${p.algorithm}.\n\n` +
  `Use bright friendly colours, big rounded buttons, and large easy-to-read text. Make it work well on phones.`;

const canvaPrompt = (p: Plan) =>
  `Create a colourful one-page website for this idea: ${p.idea}. ` +
  `Add clear sections for: ${p.decompose}. ` +
  `Keep it to the essentials: ${p.abstraction}. ` +
  `Use bright, modern design with large clear text and a friendly look.`;

interface ToolCard {
  id: string;
  name: string;
  initial: string;
  url: string;
  tileBg: string;
  accent: string;
  border: string;
  btn: string;
  promptOf: (p: Plan) => string;
  steps: string[];
}

const CARDS: ToolCard[] = [
  {
    id: "lovable",
    name: "Lovable",
    initial: "Lv",
    url: "https://lovable.dev",
    tileBg: "bg-rose-500",
    accent: "text-rose-700",
    border: "border-rose-200",
    btn: "bg-rose-600 hover:bg-rose-700",
    promptOf: lovablePrompt,
    steps: [
      "Open Lovable and sign in.",
      "Paste your plan prompt below.",
      "Watch it build your website live.",
      "Edit anything, then publish and copy the link.",
    ],
  },
  {
    id: "canva",
    name: "Canva",
    initial: "Cv",
    url: "https://www.canva.com",
    tileBg: "bg-cyan-500",
    accent: "text-cyan-700",
    border: "border-cyan-200",
    btn: "bg-cyan-600 hover:bg-cyan-700",
    promptOf: canvaPrompt,
    steps: [
      "Open Canva and choose the Website type (or Canva AI).",
      "Paste your plan prompt below.",
      "Edit the words and pictures.",
      "Click Publish and copy your link.",
    ],
  },
];

const BuildCardView: React.FC<{ card: ToolCard; plan: Plan; done: boolean; onDone: () => void }> = ({ card, plan, done, onDone }) => {
  const [copied, setCopied] = useState(false);
  const prompt = card.promptOf(plan);
  const copy = () => {
    navigator.clipboard?.writeText(prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className={`rounded-3xl border-2 p-5 shadow-sm transition ${done ? "border-emerald-300 bg-emerald-50" : `${card.border} bg-white`}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.tileBg} text-lg font-black text-white shadow`}>{card.initial}</span>
        <div>
          <p className="text-xl font-black text-slate-800">Build it with {card.name}</p>
          <p className={`text-base font-black ${card.accent}`}>from your plan</p>
        </div>
        {done && <span className="ml-auto rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white">Done</span>}
      </div>

      <p className="mt-4 text-lg font-bold text-slate-700">
        <span className="text-slate-400">You'll build: </span>{plan.idea}
      </p>

      <div className={`mt-3 rounded-2xl ${card.border} border-2 bg-slate-50 px-4 py-3`}>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Your prompt</p>
        <p className="mt-1 whitespace-pre-line font-mono text-base font-bold leading-relaxed text-slate-700">{prompt}</p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Steps</p>
        <ol className="mt-2 space-y-1.5">
          {card.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-lg font-bold text-slate-700">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${card.tileBg} text-sm font-black text-white`}>{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a href={card.url} target="_blank" rel="noopener noreferrer" className={`flex-1 rounded-full ${card.btn} px-5 py-3 text-center text-base font-black text-white shadow-sm transition active:scale-95`}>
          Open {card.name}
        </a>
        <button onClick={copy} className="flex-1 rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]">
          {copied ? "Copied!" : "Copy my prompt"}
        </button>
        <button onClick={onDone} className={`flex-1 rounded-full px-5 py-3 text-base font-black shadow-sm transition active:scale-95 ${done ? "bg-emerald-100 text-emerald-700" : "bg-[#2EB85C] text-white hover:bg-[#28a745]"}`}>
          {done ? "Undo" : "Mark done"}
        </button>
      </div>
    </div>
  );
};

export const BuildFromPlan: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [hasOwn, setHasOwn] = useState(false);
  const [done, setDone] = useState<Set<string>>(isCompleted ? new Set(CARDS.map((c) => c.id)) : new Set());
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setPlan({ ...EXAMPLE, ...JSON.parse(raw) });
        setHasOwn(true);
        return;
      }
    } catch {
      /* ignore */
    }
    setPlan(EXAMPLE);
  }, []);

  const allDone = done.size >= CARDS.length;

  const toggle = (id: string) => {
    setDone((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      if (n.size >= CARDS.length) completeSection(sectionIndex, false);
      return n;
    });
  };

  if (!plan) return null;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl px-5 py-3 text-center text-lg font-bold ${hasOwn ? "bg-[#faf5ff] text-[#6b21a8]" : "bg-amber-50 text-amber-700"}`}>
        {hasOwn
          ? "This prompt is built straight from YOUR plan. Open a tool and build it for real."
          : "Tip: make your own plan in the last lesson first. For now, here's an example to build."}
      </div>

      {CARDS.map((c) => (
        <BuildCardView key={c.id} card={c} plan={plan} done={done.has(c.id)} onDone={() => toggle(c.id)} />
      ))}

      <p className="text-center text-lg font-bold text-slate-400">{done.size} of {CARDS.length} built</p>

      {allDone && <p className="text-center text-xl font-black text-[#15803d]">You took an idea all the way to a real website.</p>}
      {allDone && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
