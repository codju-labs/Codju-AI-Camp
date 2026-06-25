import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PromptForge — AI Creator Camp Day 5, Level 5. Students build a strong
 * website prompt by choosing one option for each of the 8 ingredients of a
 * good prompt. A live prompt assembles as they pick. Completes when all 8
 * are chosen; they can copy the finished prompt to paste into Lovable or v0.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Ingredient {
  key: string;
  label: string;
  hint: string;
  options: string[];
}

const INGREDIENTS: Ingredient[] = [
  { key: "purpose", label: "Purpose", hint: "what the site is for", options: ["a page about my hobby", "a small online shop", "a portfolio of my work", "a page for my school club"] },
  { key: "audience", label: "Audience", hint: "who it is for", options: ["kids my age", "my whole school", "customers", "anyone online"] },
  { key: "pages", label: "Pages", hint: "the sections it needs", options: ["Home, About, Contact", "Home, Gallery, Contact", "Home, Shop, Cart", "Home, Blog, About"] },
  { key: "features", label: "Features", hint: "what it can do", options: ["a photo gallery", "a contact form", "a sign-up button", "a product list"] },
  { key: "style", label: "Design Style", hint: "the overall look", options: ["clean and simple", "bold and playful", "modern and sleek", "fun and colourful"] },
  { key: "colour", label: "Colour Theme", hint: "the colours", options: ["blue and white", "warm orange", "green and earthy", "purple and pink"] },
  { key: "cta", label: "Call-to-Action", hint: "the main button", options: ["Sign up", "Buy now", "Contact me", "Follow me"] },
  { key: "extra", label: "Extra Requirement", hint: "one more must-have", options: ["works well on phones", "large easy-to-read text", "smooth animations", "a dark mode"] },
];

const WEAK = "Make me a website.";

const buildPrompt = (c: Record<string, string>) =>
  `Build ${c.purpose} for ${c.audience}. Pages: ${c.pages}. Include ${c.features}. ` +
  `Make it ${c.style} with a ${c.colour} colour theme. Add a clear "${c.cta}" button. ` +
  `Also make sure it has ${c.extra}.`;

export const PromptForge: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const preset: Record<string, string> = {};
  if (isCompleted) INGREDIENTS.forEach((g) => (preset[g.key] = g.options[0]));

  const [choices, setChoices] = useState<Record<string, string>>(preset);
  const [copied, setCopied] = useState(false);

  const count = Object.keys(choices).length;
  const ready = count >= INGREDIENTS.length;
  const prompt = ready ? buildPrompt(choices) : "";

  useEffect(() => {
    if (ready) { try { window.localStorage.setItem("aicc-web-prompt", prompt); } catch { /* ignore */ } }
  }, [ready, prompt]);

  const pick = (key: string, val: string) => {
    setChoices((c) => {
      const n = { ...c, [key]: val };
      if (Object.keys(n).length >= INGREDIENTS.length) completeSection(sectionIndex, false);
      return n;
    });
  };

  const copy = () => { navigator.clipboard?.writeText(prompt).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        A great website prompt has 8 ingredients. Pick one for each and watch your prompt build.
      </div>

      <div className="rounded-2xl border-2 border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-red-400">Weak prompt</p>
        <p className="mt-1 text-lg font-bold text-red-500">"{WEAK}"</p>
        <p className="mt-1 text-sm font-bold text-red-400">The AI has to guess everything. You get a boring, random site.</p>
      </div>

      <div className="space-y-3">
        {INGREDIENTS.map((g, i) => (
          <div key={g.key} className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white ${choices[g.key] ? "bg-[#2EB85C]" : "bg-[#8B4EC4]"}`}>{i + 1}</span>
              <p className="text-lg font-black text-slate-800">{g.label}</p>
              <p className="text-base font-bold text-slate-400">· {g.hint}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = choices[g.key] === o;
                return (
                  <button key={o} onClick={() => pick(g.key, o)} className={`rounded-full border-2 px-4 py-2 text-base font-bold transition active:scale-95 ${on ? "border-[#8B4EC4] bg-[#8B4EC4] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4]"}`}>{o}</button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={`rounded-3xl border-2 p-5 transition ${ready ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Your prompt {ready ? "" : `· ${count} of ${INGREDIENTS.length} ingredients`}</p>
        {ready ? (
          <>
            <p className="mt-2 whitespace-pre-line font-mono text-base md:text-lg font-bold leading-relaxed text-slate-700">{prompt}</p>
            <button onClick={copy} className="mt-4 w-full rounded-full bg-[#8B4EC4] px-6 py-3 text-base font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">{copied ? "Copied! Paste it into Lovable or v0" : "Copy my prompt"}</button>
          </>
        ) : (
          <p className="mt-2 text-lg font-bold text-slate-400">Pick an option for every ingredient above to finish your prompt.</p>
        )}
      </div>

      {ready && <p className="text-center text-xl font-black text-[#15803d]">Specific prompt in, great website out.</p>}
      {ready && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
