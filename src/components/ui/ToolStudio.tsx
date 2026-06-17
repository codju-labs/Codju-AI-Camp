import React, { useState } from "react";

/**
 * ToolStudio — AI Creator Camp Day 2, Level 2.
 * A teacher-led explainer for ONE creative web tool (Gemini, Canva, or Suno):
 * what it can do, how it works, what you can make, an Open-homepage button,
 * and a project to build live on the tool. Presentational — the section's
 * RevealButton handles progression, so this does not complete the section.
 */

type ToolId = "gemini" | "canva" | "suno";

interface Props {
  tool: ToolId;
}

interface Studio {
  name: string;
  nickname: string;
  initial: string;
  url: string;
  tileBg: string;
  accent: string;
  frontBg: string;
  border: string;
  btn: string;
  features: string[];
  how: string;
  makes: string[];
  projectTitle: string;
  projectDesc: string;
  starterPrompt: string;
  starterLabel: string;
}

const STUDIOS: Record<ToolId, Studio> = {
  gemini: {
    name: "Gemini",
    nickname: "The All-Rounder",
    initial: "G",
    url: "https://gemini.google.com",
    tileBg: "bg-blue-500",
    accent: "text-blue-700",
    frontBg: "bg-blue-50",
    border: "border-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
    features: [
      "Chats and answers like a smart helper",
      "Draws images from your words",
      "Can make short video clips",
      "Works with Google — Docs, search and more",
    ],
    how: "You type a description called a prompt. Gemini understands it and creates text, an image, or a video to match.",
    makes: ["Character art", "Story pictures", "Posters", "Short videos", "Study help"],
    projectTitle: "Make your superhero's poster",
    projectDesc: "Open Gemini, paste the prompt, and watch it draw your hero.",
    starterPrompt:
      "Draw a 13-year-old superhero glowing with blue lightning, comic-book style, on a city rooftop at night, neon colours, action pose.",
    starterLabel: "Copy image prompt",
  },
  canva: {
    name: "Canva",
    nickname: "The Design Studio",
    initial: "Cv",
    url: "https://www.canva.com",
    tileBg: "bg-cyan-500",
    accent: "text-cyan-700",
    frontBg: "bg-cyan-50",
    border: "border-cyan-200",
    btn: "bg-cyan-600 hover:bg-cyan-700",
    features: [
      "Drag-and-drop design, super easy",
      "Thousands of ready-made templates",
      "Canva AI builds a design from your words",
      "Free for students",
    ],
    how: "Open Canva AI from the sidebar and describe what you want, or start from a template. Canva creates an editable design and lays it out neatly for you.",
    makes: ["Comic pages", "Posters", "Storybook covers", "Slides", "Websites"],
    projectTitle: "Design your superhero comic page",
    projectDesc: "Open Canva AI from the sidebar, describe the comic, and let it build the page for you to edit.",
    starterPrompt:
      "Create a 3-panel comic strip in bold comic-book style: a teenage lightning superhero fights a glowing purple hacker villain called The Glitch in a neon city, with empty speech bubbles I can fill in.",
    starterLabel: "Copy Canva AI prompt",
  },
  suno: {
    name: "Suno",
    nickname: "The Songwriter",
    initial: "Su",
    url: "https://suno.com",
    tileBg: "bg-amber-500",
    accent: "text-amber-700",
    frontBg: "bg-amber-50",
    border: "border-amber-200",
    btn: "bg-amber-600 hover:bg-amber-700",
    features: [
      "Makes a full song from a few words",
      "Writes the music, the lyrics, and the vocals",
      "Pick any style or genre",
      "Download and share your song",
    ],
    how: "You describe the song — its style, mood, and topic. Suno composes the music, writes the words, and sings it.",
    makes: ["Theme songs", "Raps", "Jingles", "Soundtracks", "Birthday songs"],
    projectTitle: "Write your superhero's theme song",
    projectDesc: "Open Suno, paste the description, and let it compose your hero's anthem.",
    starterPrompt:
      "An upbeat, energetic hero anthem about courage and never giving up, with a catchy chorus.",
    starterLabel: "Copy song prompt",
  },
};

export const ToolStudio: React.FC<Props> = ({ tool }) => {
  const s = STUDIOS[tool];
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(s.starterPrompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Header + open homepage */}
      <div className={`flex items-center gap-4 rounded-3xl border-2 ${s.border} ${s.frontBg} p-5`}>
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${s.tileBg} text-2xl font-black text-white shadow-md`}
        >
          {s.initial}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-black text-slate-800">{s.name}</p>
          <p className={`text-lg font-black ${s.accent}`}>{s.nickname}</p>
        </div>
        <a
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto shrink-0 rounded-full ${s.btn} px-6 py-3 text-base font-black text-white shadow-md transition active:scale-95`}
        >
          Open {s.name}
        </a>
      </div>

      {/* What it can do */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">What it can do</p>
        <ul className="space-y-2">
          {s.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-lg font-bold text-slate-700">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${s.tileBg}`} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* How it works */}
      <div className={`rounded-3xl border-2 ${s.border} ${s.frontBg} p-5`}>
        <p className="mb-1 text-sm font-black uppercase tracking-widest text-slate-400">How it works</p>
        <p className={`text-lg font-bold leading-relaxed ${s.accent}`}>{s.how}</p>
      </div>

      {/* What you can make */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
        <p className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">What you can make</p>
        <div className="flex flex-wrap gap-2">
          {s.makes.map((m, i) => (
            <span
              key={i}
              className={`rounded-full ${s.frontBg} ${s.accent} px-4 py-2 text-base font-black`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Live project */}
      <div className="rounded-3xl border-2 border-[#fed7aa] bg-[#fff7ed] p-5">
        <p className="mb-1 text-sm font-black uppercase tracking-widest text-[#b45309]">Try it live</p>
        <p className="text-xl font-black text-slate-800">{s.projectTitle}</p>
        <p className="mt-1 text-lg font-bold text-slate-600">{s.projectDesc}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 rounded-full ${s.btn} px-5 py-3 text-center text-base font-black text-white shadow-sm transition active:scale-95`}
          >
            Open {s.name}
          </a>
          <button
            onClick={copy}
            className="flex-1 rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]"
          >
            {copied ? "Copied!" : s.starterLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
