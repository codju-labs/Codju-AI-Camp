import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PitchFromPlan — AI Creator Camp Day 5, Level 2. Reads the startup plan from
 * Level 1 (localStorage `aicc-startup-plan`) and turns it into a ready 30-second
 * pitch plus a Gamma prompt for a pitch deck. Section completes when the deck
 * is marked done.
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

const pitchOf = (p: Plan) =>
  `Have you ever noticed that ${p.problem.toLowerCase()}? ` +
  `That is the problem I am solving. I built ${p.name}, ${p.product.toLowerCase()} for ${p.audience.toLowerCase()}. ` +
  `It is simple, fun, and it actually fixes the problem. ${p.name} - try it today!`;

const gammaPromptOf = (p: Plan) =>
  `Create a short, exciting pitch deck for a student startup called ${p.name}. ` +
  `Use these slides: 1) The problem: ${p.problem}. 2) Our solution: ${p.product}. ` +
  `3) Who it's for: ${p.audience}. 4) Why it's special. 5) A call to action to try ${p.name}. ` +
  `Make it bright, bold, and fun for a school presentation.`;

export const PitchFromPlan: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [hasOwn, setHasOwn] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [copiedDeck, setCopiedDeck] = useState(false);
  const [done, setDone] = useState(isCompleted);
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

  if (!plan) return null;
  const pitch = pitchOf(plan);
  const gammaPrompt = gammaPromptOf(plan);

  const copyPitch = () => { navigator.clipboard?.writeText(pitch).catch(() => {}); setCopiedPitch(true); setTimeout(() => setCopiedPitch(false), 1800); };
  const copyDeck = () => { navigator.clipboard?.writeText(gammaPrompt).catch(() => {}); setCopiedDeck(true); setTimeout(() => setCopiedDeck(false), 1800); };
  const markDone = () => { if (!done) { setDone(true); completeSection(sectionIndex, false); } };

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl px-5 py-3 text-center text-lg font-bold ${hasOwn ? "bg-[#faf5ff] text-[#6b21a8]" : "bg-amber-50 text-amber-700"}`}>
        {hasOwn ? "Built from YOUR startup. Practise the pitch, then make the deck." : "Tip: make your startup in the last lesson first. Here's an example to pitch."}
      </div>

      {/* The pitch script */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Your 30-second pitch</p>
        <p className="mt-2 text-xl font-bold leading-relaxed text-slate-700">{pitch}</p>
        <button onClick={copyPitch} className="mt-4 w-full rounded-full border-2 border-slate-300 bg-white py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]">
          {copiedPitch ? "Copied!" : "Copy my pitch"}
        </button>
        <p className="mt-3 text-center text-base font-bold text-slate-400">Read it out loud until it feels natural.</p>
      </div>

      {/* Gamma deck card */}
      <div className={`rounded-3xl border-2 p-5 shadow-sm transition ${done ? "border-emerald-300 bg-emerald-50" : "border-fuchsia-200 bg-white"}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500 text-lg font-black text-white shadow">Ga</span>
          <div>
            <p className="text-xl font-black text-slate-800">Make your pitch deck</p>
            <p className="text-base font-black text-fuchsia-700">on Gamma</p>
          </div>
          {done && <span className="ml-auto rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white">Done</span>}
        </div>

        <div className="mt-4 rounded-2xl border-2 border-fuchsia-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Your Gamma prompt</p>
          <p className="mt-1 whitespace-pre-line font-mono text-base font-bold leading-relaxed text-slate-700">{gammaPrompt}</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Steps</p>
          <ol className="mt-2 space-y-1.5">
            {["Open Gamma, click Create new, then Generate.", "Paste your pitch prompt.", "Pick a bold theme and generate.", "Practise presenting your deck."].map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-lg font-bold text-slate-700">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500 text-sm font-black text-white">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a href="https://gamma.app" target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-fuchsia-600 px-5 py-3 text-center text-base font-black text-white shadow-sm transition active:scale-95 hover:bg-fuchsia-700">
            Open Gamma
          </a>
          <button onClick={copyDeck} className="flex-1 rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]">
            {copiedDeck ? "Copied!" : "Copy Gamma prompt"}
          </button>
          <button onClick={markDone} className={`flex-1 rounded-full px-5 py-3 text-base font-black shadow-sm transition active:scale-95 ${done ? "bg-emerald-100 text-emerald-700" : "bg-[#2EB85C] text-white hover:bg-[#28a745]"}`}>
            {done ? "Done" : "Mark done"}
          </button>
        </div>
      </div>

      {done && <p className="text-center text-xl font-black text-[#15803d]">Pitch ready. Now let's build the real app.</p>}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
