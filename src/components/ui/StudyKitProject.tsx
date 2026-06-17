import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import confetti from "canvas-confetti";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * StudyKitProject — AI Creator Camp Day 3 capstone. A form pulls together
 * what the student made (summary, quiz, presentation) into one "Study Kit"
 * card. On submit: confetti, a SMART LEARNER badge, a styled card, and a
 * downloadable PNG drawn on an offscreen canvas. Persists to localStorage.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Kit {
  subject: string;
  topic: string;
  summary: string;
  quizQ: string;
  deckTitle: string;
}

const STORAGE_KEY = "aicc-studykit";
const EMPTY: Kit = { subject: "", topic: "", summary: "", quizQ: "", deckTitle: "" };

const FIELDS: { key: keyof Kit; label: string; placeholder: string; area?: boolean }[] = [
  { key: "subject", label: "Subject", placeholder: "Science" },
  { key: "topic", label: "Topic I studied", placeholder: "The Solar System" },
  { key: "summary", label: "My one-line summary", placeholder: "The Sun is a star and 8 planets orbit it...", area: true },
  { key: "quizQ", label: "A quiz question I can now answer", placeholder: "Which planet is the hottest?" },
  { key: "deckTitle", label: "My presentation title", placeholder: "A Tour of the Solar System" },
];

const wrap = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) => {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
};

export const StudyKitProject: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [kit, setKit] = useState<Kit>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Kit;
        setKit({ ...EMPTY, ...saved });
        setSubmitted(true);
      } else if (isCompleted) {
        setSubmitted(true);
      }
    } catch {
      /* ignore */
    }
  }, [isCompleted]);

  const filled = FIELDS.filter((f) => kit[f.key].trim().length > 0).length;

  const submit = () => {
    if (filled < FIELDS.length) {
      setErr("Fill in all five boxes to lock in your Study Kit.");
      return;
    }
    setErr("");
    setSubmitted(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kit));
    } catch {
      /* ignore */
    }
    completeSection(sectionIndex, false);
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } }), 150);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } }), 150);
  };

  const download = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx.createLinearGradient(0, 0, 800, 1000);
    g.addColorStop(0, "#2e1065");
    g.addColorStop(1, "#4c1d95");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 26px Arial";
    ctx.fillText("MY STUDY KIT", 60, 90);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Arial";
    wrap(ctx, kit.topic, 60, 160, 680, 60);

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 30px Arial";
    ctx.fillText(kit.subject, 60, 250);

    let y = 340;
    const row = (label: string, value: string) => {
      ctx.fillStyle = "#c4b5fd";
      ctx.font = "bold 22px Arial";
      ctx.fillText(label.toUpperCase(), 60, y);
      y += 38;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px Arial";
      y = wrap(ctx, value, 60, y, 680, 40) + 70;
    };
    row("Summary", kit.summary);
    row("Quiz question", kit.quizQ);
    row("Presentation", kit.deckTitle);

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 22px Arial";
    ctx.fillText("Made at Codju AI Creator Camp - Day 3", 60, 950);

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "my-study-kit.png";
    a.click();
  };

  if (!submitted) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#eef2ff] px-5 py-3 text-center text-lg font-bold text-indigo-700">
          Pull your work together. Fill in what you made today.
        </div>
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-lg font-black text-slate-700">{f.label}</label>
            {f.area ? (
              <textarea
                value={kit[f.key]}
                onChange={(e) => setKit((k) => ({ ...k, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#8B4EC4]"
              />
            ) : (
              <input
                type="text"
                value={kit[f.key]}
                onChange={(e) => setKit((k) => ({ ...k, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#8B4EC4]"
              />
            )}
          </div>
        ))}
        {err && <p className="text-center text-base font-bold text-red-500">{err}</p>}
        <div className="flex justify-center">
          <button
            onClick={submit}
            className="rounded-full bg-[#8B4EC4] px-12 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Lock in my Study Kit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div
        className="mx-auto flex max-w-xs flex-col items-center rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-center"
        style={{ animation: "skBadge 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-xl font-black text-white shadow-md">
          SL
        </span>
        <p className="mt-2 text-sm font-black uppercase tracking-widest text-amber-700">Badge unlocked</p>
        <p className="text-2xl font-black text-slate-800">Smart Learner</p>
      </div>

      <div
        className="overflow-hidden rounded-3xl border-2 border-indigo-200 shadow-sm"
        style={{ animation: "skPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
      >
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-6 text-white">
          <p className="text-sm font-black uppercase tracking-widest text-indigo-200">My Study Kit</p>
          <p className="text-3xl font-black leading-tight">{kit.topic}</p>
          <p className="text-lg font-black text-indigo-100">{kit.subject}</p>
        </div>
        <div className="space-y-3 bg-white px-6 py-5">
          {[
            ["Summary", kit.summary],
            ["Quiz question", kit.quizQ],
            ["Presentation", kit.deckTitle],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
              <p className="text-lg font-bold text-slate-700">{value}</p>
            </div>
          ))}
          <p className="pt-2 text-sm font-bold text-slate-400">Made at Codju AI Creator Camp - Day 3</p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={download}
          className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
        >
          Download my kit
        </button>
      </div>

      <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />

      <style>{`
        @keyframes skBadge { from { opacity: 0; transform: scale(0.6) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
        @keyframes skPop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="skBadge"],[style*="skPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
