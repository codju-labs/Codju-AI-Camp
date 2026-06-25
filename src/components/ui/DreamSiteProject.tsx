import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import confetti from "canvas-confetti";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * DreamSiteProject — AI Creator Camp Day 5, Level 8. The capstone. Students
 * tick off the project steps, then paste the live link to their published
 * site to earn the Web Builder badge. Live link is saved to localStorage.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const STEPS = [
  "Choose your website idea",
  "Plan the sections it needs",
  "Write a strong AI prompt",
  "Generate it with Lovable or v0",
  "Improve the design and text",
  "Publish it to get a live link",
];

const STORAGE_KEY = "aicc-dream-site";

export const DreamSiteProject: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [checked, setChecked] = useState<Set<number>>(isCompleted ? new Set(STEPS.map((_, i) => i)) : new Set());
  const [link, setLink] = useState("");
  const [launched, setLaunched] = useState(isCompleted);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && raw.trim()) { setLink(raw); setLaunched(true); }
    } catch {
      /* ignore */
    }
  }, []);

  const allChecked = checked.size >= STEPS.length;
  const toggle = (i: number) => setChecked((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const launch = () => {
    if (!link.trim()) return;
    try { window.localStorage.setItem(STORAGE_KEY, link.trim()); } catch { /* ignore */ }
    setLaunched(true);
    completeSection(sectionIndex, false);
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } }), 150);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } }), 150);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Your mission: take a website from idea to a live link. Tick each step as you finish it.
      </div>

      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const on = checked.has(i);
          return (
            <button key={i} onClick={() => toggle(i)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:border-[#8B4EC4]"}`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black ${on ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                {on ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-lg font-bold ${on ? "text-emerald-800" : "text-slate-700"}`}>{s}</span>
            </button>
          );
        })}
      </div>

      {allChecked && !launched && (
        <div className="rounded-3xl border-2 border-[#fed7aa] bg-[#fff7ed] p-5" style={{ animation: "dsPop 0.4s ease both" }}>
          <p className="text-sm font-black uppercase tracking-widest text-[#b45309]">The finish line</p>
          <p className="mt-1 text-xl font-black text-slate-800">Paste your live website link</p>
          <p className="mt-1 text-lg font-bold text-slate-600">Then get ready to present it to the class.</p>
          <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://my-dream-site..." className="mt-4 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#8B4EC4]" />
          <button onClick={launch} className={`mt-3 w-full rounded-full px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${link.trim() ? "bg-[#8B4EC4] hover:bg-[#7a41b0]" : "bg-slate-300"}`}>Launch my site</button>
        </div>
      )}

      {!allChecked && <p className="text-center text-lg font-bold text-slate-400">{checked.size} of {STEPS.length} steps done</p>}

      {launched && (
        <div className="space-y-3" style={{ animation: "dsPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}>
          <div className="mx-auto flex max-w-xs flex-col items-center rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-xl font-black text-white shadow-md">WB</span>
            <p className="mt-2 text-sm font-black uppercase tracking-widest text-amber-700">Badge unlocked</p>
            <p className="text-2xl font-black text-slate-800">Web Builder</p>
          </div>
          {link.trim() && (
            <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-emerald-700">Your site is live</p>
              <a href={link.trim().startsWith("http") ? link.trim() : `https://${link.trim()}`} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-lg font-black text-[#15803d] underline">{link.trim()}</a>
            </div>
          )}
          <p className="text-center text-xl font-black text-[#15803d]">From idea to internet. You built that.</p>
          <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
        </div>
      )}
      <style>{`@keyframes dsPop { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="dsPop"]{animation:none!important;}}`}</style>
    </div>
  );
};
