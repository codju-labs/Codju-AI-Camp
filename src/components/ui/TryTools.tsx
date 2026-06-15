import React, { useState } from "react";

/**
 * TryTools — AI Creator Camp Day 1, Level 3. Live-demo launcher.
 * One card per tool: an "Open" link (new tab) plus a ready-made prompt with
 * a Copy button, so the teacher can open the tool, paste the prompt, and
 * show a real result in seconds. Presentational — the section's RevealButton
 * handles progression, so this does not call completeSection.
 */

interface ToolDemo {
  id: string;
  name: string;
  bestFor: string;
  url: string;
  prompt: string;
  tileBg: string;
  initial: string;
  border: string;
  accent: string;
  btn: string;
}

const DEMOS: ToolDemo[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    bestFor: "Creative writing",
    url: "https://chatgpt.com",
    prompt:
      "You are a funny rap artist. Write a 4-line rap about a student who forgot his homework. Make it rhyme.",
    tileBg: "bg-emerald-500",
    initial: "C",
    border: "border-emerald-200",
    accent: "text-emerald-700",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    id: "claude",
    name: "Claude",
    bestFor: "Careful writing and code",
    url: "https://claude.ai",
    prompt:
      "You are a patient coding teacher. Write a short Python program that prints a colourful \"Welcome to AI Creator Camp!\" banner, then explain each line in one simple sentence.",
    tileBg: "bg-amber-500",
    initial: "Cl",
    border: "border-amber-200",
    accent: "text-amber-700",
    btn: "bg-amber-600 hover:bg-amber-700",
  },
  {
    id: "gemini",
    name: "Gemini",
    bestFor: "Images and video",
    url: "https://gemini.google.com",
    prompt:
      "Create a colourful comic-book style poster of a teen superhero glowing with blue lightning, standing on a city rooftop at night, dynamic action pose, bright neon colours.",
    tileBg: "bg-blue-500",
    initial: "G",
    border: "border-blue-200",
    accent: "text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    bestFor: "Facts with sources",
    url: "https://www.perplexity.ai",
    prompt:
      "Is it true that octopuses have three hearts? Answer in 3 short bullet points and show your sources.",
    tileBg: "bg-purple-500",
    initial: "P",
    border: "border-purple-200",
    accent: "text-[#8B4EC4]",
    btn: "bg-[#8B4EC4] hover:bg-[#7a41b0]",
  },
];

const DemoCard: React.FC<{ d: ToolDemo }> = ({ d }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(d.prompt);
    } catch {
      // ignore — some browsers block clipboard without a gesture
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={`rounded-3xl border-2 ${d.border} bg-white p-5 shadow-sm`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${d.tileBg} text-xl font-black text-white shadow`}
        >
          {d.initial}
        </span>
        <div>
          <p className="text-xl font-black text-slate-800">{d.name}</p>
          <p className={`text-base font-black ${d.accent}`}>{d.bestFor}</p>
        </div>
        <a
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`ml-auto rounded-full ${d.btn} px-6 py-3 text-base font-black text-white shadow-md transition active:scale-95`}
        >
          Open
        </a>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Try this prompt</p>
        <p className="mt-1 font-mono text-base font-bold leading-relaxed text-slate-700">{d.prompt}</p>
      </div>

      <button
        onClick={copy}
        className="mt-3 w-full rounded-full border-2 border-slate-200 bg-white py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]"
      >
        {copied ? "Copied!" : "Copy prompt"}
      </button>
    </div>
  );
};

export const TryTools: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Open a tool, paste the prompt, and watch it work. A parent's account is best for under-13s.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DEMOS.map((d) => (
          <DemoCard key={d.id} d={d} />
        ))}
      </div>
    </div>
  );
};
