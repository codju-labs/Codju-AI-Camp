import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * BuildAppFromPlan — AI Creator Camp Day 5, Level 3. Reads the startup plan
 * (localStorage `aicc-startup-plan`) and turns it into a Lovable "vibe coding"
 * app prompt and a Canva logo prompt — so the student builds THEIR app for
 * real. Section completes when both are marked done.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Plan {
  problem: string;
  product: string;
  audience: string;
  name: string;
}

const STORAGE_KEY = "aicc-startup-plan";
const EXAMPLE: Plan = {
  problem: "Lost items pile up at school",
  product: "A lost-and-found app",
  audience: "My whole school",
  name: "FindIt",
};

const lovableOf = (p: Plan) =>
  `Build a colourful, kid-friendly app called ${p.name}. It is ${p.product.toLowerCase()} for ${p.audience.toLowerCase()}, ` +
  `made to solve this problem: ${p.problem.toLowerCase()}.\n\n` +
  `Include the main screens this app needs, big friendly buttons, and large easy-to-read text. ` +
  `Make it simple to use and work well on phones.`;

const canvaOf = (p: Plan) =>
  `Design a fun, modern logo for an app called ${p.name} (${p.product.toLowerCase()}). ` +
  `Make it bright and friendly, with a simple icon kids would recognise. Show a few options.`;

interface Card {
  id: string;
  name: string;
  initial: string;
  url: string;
  tileBg: string;
  accent: string;
  border: string;
  btn: string;
  heading: string;
  promptLabel: string;
  promptOf: (p: Plan) => string;
  steps: string[];
}

const CARDS: Card[] = [
  {
    id: "lovable",
    name: "Lovable",
    initial: "Lv",
    url: "https://lovable.dev",
    tileBg: "bg-rose-500",
    accent: "text-rose-700",
    border: "border-rose-200",
    btn: "bg-rose-600 hover:bg-rose-700",
    heading: "Build your app",
    promptLabel: "Copy app prompt",
    promptOf: lovableOf,
    steps: [
      "Open Lovable and sign in.",
      "Paste your app prompt below.",
      "Watch it build your app live (this is vibe coding).",
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
    heading: "Design your logo",
    promptLabel: "Copy logo prompt",
    promptOf: canvaOf,
    steps: [
      "Open Canva AI from the left sidebar.",
      "Paste your logo prompt below.",
      "Pick your favourite logo.",
      "Download it for your app.",
    ],
  },
];

const CardView: React.FC<{ card: Card; plan: Plan; done: boolean; onDone: () => void }> = ({ card, plan, done, onDone }) => {
  const [copied, setCopied] = useState(false);
  const prompt = card.promptOf(plan);
  const copy = () => { navigator.clipboard?.writeText(prompt).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <div className={`rounded-3xl border-2 p-5 shadow-sm transition ${done ? "border-emerald-300 bg-emerald-50" : `${card.border} bg-white`}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.tileBg} text-lg font-black text-white shadow`}>{card.initial}</span>
        <div>
          <p className="text-xl font-black text-slate-800">{card.heading}</p>
          <p className={`text-base font-black ${card.accent}`}>on {card.name}, from your plan</p>
        </div>
        {done && <span className="ml-auto rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white">Done</span>}
      </div>

      <p className="mt-4 text-lg font-bold text-slate-700"><span className="text-slate-400">App: </span>{plan.name}</p>

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
          {copied ? "Copied!" : card.promptLabel}
        </button>
        <button onClick={onDone} className={`flex-1 rounded-full px-5 py-3 text-base font-black shadow-sm transition active:scale-95 ${done ? "bg-emerald-100 text-emerald-700" : "bg-[#2EB85C] text-white hover:bg-[#28a745]"}`}>
          {done ? "Undo" : "Mark done"}
        </button>
      </div>
    </div>
  );
};

export const BuildAppFromPlan: React.FC<Props> = ({ sectionIndex, explanation }) => {
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
      if (raw) { setPlan({ ...EXAMPLE, ...JSON.parse(raw) }); setHasOwn(true); return; }
    } catch {
      /* ignore */
    }
    setPlan(EXAMPLE);
  }, []);

  if (!plan) return null;
  const allDone = done.size >= CARDS.length;
  const toggle = (id: string) => {
    setDone((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      if (n.size >= CARDS.length) completeSection(sectionIndex, false);
      return n;
    });
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl px-5 py-3 text-center text-lg font-bold ${hasOwn ? "bg-[#faf5ff] text-[#6b21a8]" : "bg-amber-50 text-amber-700"}`}>
        {hasOwn ? "Your plan is now the prompt. Build your real app and logo." : "Tip: make your startup in Lesson 1 first. Here's an example to build."}
      </div>

      {CARDS.map((c) => (
        <CardView key={c.id} card={c} plan={plan} done={done.has(c.id)} onDone={() => toggle(c.id)} />
      ))}

      <p className="text-center text-lg font-bold text-slate-400">{done.size} of {CARDS.length} built</p>

      {allDone && <p className="text-center text-xl font-black text-[#15803d]">You are a founder. Idea to app, all by you.</p>}
      {allDone && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
