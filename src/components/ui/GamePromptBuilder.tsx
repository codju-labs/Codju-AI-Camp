import React, { useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

interface GamePromptBuilderProps {
  sectionIndex: number;
  explanation?: string;
}

const starters = {
  title: "Space Snack Dash",
  player: "a tiny astronaut collecting snacks",
  goal: "collect 20 snacks before the timer ends",
  controls: "arrow keys or WASD to move",
  obstacles: "floating asteroids and a 60 second timer",
  style: "bright, playful, arcade style with simple animations",
  win: "show a win screen with score and a Play Again button",
};

export const GamePromptBuilder: React.FC<GamePromptBuilderProps> = ({
  sectionIndex,
  explanation,
}) => {
  const $completedIndices = useStore(completedIndices);
  const [form, setForm] = useState(starters);
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => `Build a browser game called "${form.title}".

Game idea:
The player controls ${form.player}. The goal is to ${form.goal}.

Controls:
Use ${form.controls}.

Rules and challenge:
Add ${form.obstacles}. Make the game easy to understand in the first 5 seconds.

Visual style:
Use a ${form.style}. Keep the layout responsive so it works on laptop and tablet screens.

Game states:
Include a start screen, the main gameplay screen, a score display, ${form.win}, and a restart flow.

Implementation:
Create the game in a format that I can preview and play directly in a browser using the preview feature of tools like ChatGPT, Gemini, Lovable, or v0. Keep it self-contained and easy to test. Add comments only where the logic is tricky. Use simple shapes or built-in browser-friendly visuals so the game works without needing extra assets.`,
    [form],
  );

  const done = $completedIndices.has(sectionIndex);

  const update = (key: keyof typeof starters, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(prompt).catch(() => {});
    setCopied(true);
    completeSection(sectionIndex, false);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(form).map(([key, value]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-sm font-black capitalize text-slate-700">
              {key}
            </span>
            <textarea
              value={value}
              rows={key === "title" ? 1 : 2}
              onChange={(event) => update(key as keyof typeof starters, event.target.value)}
              className="w-full resize-y rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:ring-2 focus:ring-purple-200"
            />
          </label>
        ))}
      </div>

      <div className="rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-purple-500">
              AI game prompt
            </p>
            <h3 className="text-xl font-black text-slate-800">Ready for an HTML game build</h3>
          </div>
          {!done && (
            <button
              onClick={copy}
              className="rounded-full bg-[#8B4EC4] px-5 py-2 text-sm font-black text-white transition hover:bg-[#7a41b0] active:scale-95"
            >
              {copied ? "Copied" : "Copy prompt"}
            </button>
          )}
        </div>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm font-semibold leading-relaxed text-slate-100">
          {prompt}
        </pre>
      </div>
      <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />
    </div>
  );
};

export default GamePromptBuilder;
