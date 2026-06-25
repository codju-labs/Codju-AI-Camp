import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * SiteAnatomy — AI Creator Camp Day 5, Level 2. A simple website wireframe
 * with 8 tappable parts. Tapping a part reveals its job, purpose and a
 * real example. Section completes once all 8 parts have been explored.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Part {
  id: string;
  label: string;
  what: string;
  purpose: string;
  example: string;
}

const PARTS: Part[] = [
  { id: "header", label: "Header", what: "The strip across the very top.", purpose: "Shows the logo and name so visitors know whose site this is.", example: "The YouTube logo in the top-left corner." },
  { id: "nav", label: "Navigation Menu", what: "The row of links near the top.", purpose: "Lets people jump to different pages of the site.", example: "Home, Shop, About, Contact links." },
  { id: "hero", label: "Hero Section", what: "The big eye-catching area at the top of the page.", purpose: "Grabs attention and says what the site is about in one line.", example: "Amazon's big banner with today's deal." },
  { id: "media", label: "Images & Videos", what: "Pictures and clips on the page.", purpose: "Show, not just tell. They make a page interesting and clear.", example: "Product photos on a shopping site." },
  { id: "buttons", label: "Buttons", what: "Clickable boxes that do something.", purpose: "Let visitors take an action with one tap.", example: "The red Subscribe button on YouTube." },
  { id: "content", label: "Content Sections", what: "The main blocks of text and info.", purpose: "Carry the real message: who you are, what you offer.", example: "An 'About Us' paragraph on a school site." },
  { id: "form", label: "Forms", what: "Boxes where visitors type and submit info.", purpose: "Collect details from people: names, messages, sign-ups.", example: "A Contact Us box that emails the school." },
  { id: "footer", label: "Footer", what: "The strip at the very bottom.", purpose: "Holds extra links, contact info and copyright.", example: "Social media links at the bottom of Instagram." },
];

export const SiteAnatomy: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [active, setActive] = useState<string>(isCompleted ? "footer" : "");
  const [seen, setSeen] = useState<Set<string>>(isCompleted ? new Set(PARTS.map((p) => p.id)) : new Set());

  const open = (id: string) => {
    setActive(id);
    setSeen((s) => {
      if (s.has(id)) return s;
      const n = new Set(s).add(id);
      if (n.size === PARTS.length) completeSection(sectionIndex, false);
      return n;
    });
  };

  const current = PARTS.find((p) => p.id === active) || null;
  const done = seen.size === PARTS.length;

  const block = (id: string, extra: string, label: string) => {
    const isActive = active === id;
    const wasSeen = seen.has(id);
    return (
      <button
        onClick={() => open(id)}
        className={`w-full rounded-xl border-2 px-3 py-2 text-center text-sm font-black transition active:scale-[0.98] ${extra} ${
          isActive ? "border-[#8B4EC4] bg-[#8B4EC4] text-white" : wasSeen ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white text-slate-600 hover:border-[#8B4EC4]"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Almost every website is built from the same 8 parts. Tap each part to learn its job.
      </div>

      {/* Mock website wireframe */}
      <div className="mx-auto max-w-md space-y-2 rounded-3xl border-2 border-slate-200 bg-slate-50 p-3 shadow-sm">
        {block("header", "", "Header")}
        {block("nav", "", "Navigation Menu")}
        {block("hero", "py-4", "Hero Section")}
        <div className="grid grid-cols-2 gap-2">
          {block("media", "py-4", "Images & Videos")}
          {block("buttons", "py-4", "Buttons")}
        </div>
        {block("content", "py-4", "Content Sections")}
        {block("form", "py-4", "Forms")}
        {block("footer", "", "Footer")}
      </div>

      {current ? (
        <div className="rounded-3xl border-2 border-[#d8b4fe] bg-[#faf5ff] p-5" style={{ animation: "saPop 0.35s ease both" }}>
          <p className="text-xl font-black text-[#6b21a8]">{current.label}</p>
          <p className="mt-2 text-lg font-bold text-slate-700">{current.what}</p>
          <p className="mt-2 text-lg font-bold text-slate-700"><span className="text-slate-400">Why: </span>{current.purpose}</p>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3"><p className="text-base font-bold text-slate-600"><span className="font-black text-[#8B4EC4]">Example: </span>{current.example}</p></div>
        </div>
      ) : (
        <p className="text-center text-lg font-bold text-slate-400">Tap a part above to see what it does.</p>
      )}

      <p className="text-center text-lg font-bold text-slate-400">{seen.size} of {PARTS.length} parts explored</p>
      {done && <p className="text-center text-xl font-black text-[#15803d]">Now you can read any website like a builder.</p>}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`@keyframes saPop { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="saPop"]{animation:none!important;}}`}</style>
    </div>
  );
};
