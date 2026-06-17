import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * SayItSeeIt — AI Creator Camp Day 2, Level 1 hook.
 * First a vague prompt ("a dog") makes a dull grey blob. Then the student
 * builds a strong, specific description by tapping one chip per row
 * (subject / style / scene / details). On generate, a colourful SVG scene
 * appears that reacts to every choice. Lesson: same AI — your words made
 * the difference.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

type RowKey = "subject" | "style" | "scene" | "details";

const ROWS: { key: RowKey; label: string; color: string; chips: string[] }[] = [
  {
    key: "subject",
    label: "Subject",
    color: "#8B4EC4",
    chips: ["a fluffy puppy", "a baby tiger", "a robot cat"],
  },
  {
    key: "style",
    label: "Style",
    color: "#2563eb",
    chips: ["cartoon style", "watercolour", "pixel art"],
  },
  {
    key: "scene",
    label: "Scene",
    color: "#059669",
    chips: ["on a sunny beach", "in a snowy forest", "in outer space"],
  },
  {
    key: "details",
    label: "Details",
    color: "#d97706",
    chips: ["chasing a red kite", "wearing tiny sunglasses", "with a glowing collar"],
  },
];

const PART_COLOR: Record<RowKey, string> = {
  subject: "#8B4EC4",
  style: "#2563eb",
  scene: "#059669",
  details: "#d97706",
};

type Choice = Partial<Record<RowKey, string>>;

const ALL_PICKED: Choice = {
  subject: "a fluffy puppy",
  style: "cartoon style",
  scene: "on a sunny beach",
  details: "chasing a red kite",
};

// ---------- The dull "a dog" result ----------
const BoringDog: React.FC = () => (
  <svg viewBox="0 0 240 160" width="100%" height="auto" aria-hidden="true" className="max-w-[320px]">
    <rect x="0" y="0" width="240" height="160" rx="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
    <ellipse cx="120" cy="104" rx="44" ry="30" fill="#cbd5e1" />
    <circle cx="120" cy="70" r="26" fill="#cbd5e1" />
    <ellipse cx="104" cy="50" rx="7" ry="12" fill="#94a3b8" />
    <ellipse cx="136" cy="50" rx="7" ry="12" fill="#94a3b8" />
    <circle cx="112" cy="68" r="3" fill="#475569" />
    <circle cx="128" cy="68" r="3" fill="#475569" />
    <ellipse cx="120" cy="80" rx="5" ry="3.5" fill="#475569" />
  </svg>
);

// ---------- The rich, reactive result ----------
const Subject: React.FC<{ subject?: string; details?: string }> = ({ subject, details }) => {
  // body / head colours by subject
  const c =
    subject === "a baby tiger"
      ? { body: "#fb923c", head: "#fb923c", ear: "#f97316", accent: "#7c2d12" }
      : subject === "a robot cat"
      ? { body: "#a5b4fc", head: "#a5b4fc", ear: "#818cf8", accent: "#3730a3" }
      : { body: "#fcd34d", head: "#fcd34d", ear: "#f59e0b", accent: "#92400e" };

  return (
    <g>
      {/* body */}
      <ellipse cx="150" cy="170" rx="40" ry="28" fill={c.body} stroke={c.accent} strokeWidth="2" />
      {/* head */}
      <circle cx="150" cy="132" r="26" fill={c.head} stroke={c.accent} strokeWidth="2" />
      {/* ears */}
      <path d="M132 116 L126 96 L144 110 Z" fill={c.ear} stroke={c.accent} strokeWidth="1.5" />
      <path d="M168 116 L174 96 L156 110 Z" fill={c.ear} stroke={c.accent} strokeWidth="1.5" />
      {/* tiger stripes */}
      {subject === "a baby tiger" && (
        <g stroke={c.accent} strokeWidth="2.5" strokeLinecap="round">
          <line x1="142" y1="118" x2="146" y2="126" />
          <line x1="158" y1="118" x2="154" y2="126" />
          <line x1="150" y1="116" x2="150" y2="124" />
        </g>
      )}
      {/* robot antenna */}
      {subject === "a robot cat" && (
        <g stroke={c.accent} strokeWidth="2.5" strokeLinecap="round">
          <line x1="150" y1="106" x2="150" y2="94" />
          <circle cx="150" cy="91" r="4" fill={c.accent} stroke="none" />
        </g>
      )}
      {/* eyes */}
      <circle cx="141" cy="130" r="5" fill="#ffffff" stroke={c.accent} strokeWidth="1.5" />
      <circle cx="159" cy="130" r="5" fill="#ffffff" stroke={c.accent} strokeWidth="1.5" />
      <circle cx="141" cy="131" r="2.4" fill="#0f172a" />
      <circle cx="159" cy="131" r="2.4" fill="#0f172a" />
      {/* nose */}
      <ellipse cx="150" cy="140" rx="4" ry="3" fill={c.accent} />
      {/* sunglasses detail */}
      {details === "wearing tiny sunglasses" && (
        <g fill="#1e293b">
          <rect x="135" y="126" width="10" height="8" rx="3" />
          <rect x="155" y="126" width="10" height="8" rx="3" />
          <rect x="145" y="129" width="10" height="2" />
        </g>
      )}
      {/* glowing collar detail */}
      {details === "with a glowing collar" && (
        <g>
          <path d="M128 152 Q150 166 172 152" fill="none" stroke="#22d3ee" strokeWidth="5" strokeLinecap="round" />
          <circle cx="150" cy="161" r="4" fill="#67e8f9" />
        </g>
      )}
    </g>
  );
};

const ResultScene: React.FC<{ choice: Choice }> = ({ choice }) => {
  const scene = choice.scene;
  const bg =
    scene === "in a snowy forest"
      ? "snow"
      : scene === "in outer space"
      ? "space"
      : "beach"; // default sunny beach

  return (
    <svg viewBox="0 0 300 200" width="100%" height="auto" aria-hidden="true" className="max-w-[420px]">
      <defs>
        <linearGradient id="beachSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="60%" stopColor="#bae6fd" />
          <stop offset="60%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id="snowSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
      </defs>

      {/* background */}
      {bg === "beach" && <rect x="0" y="0" width="300" height="200" rx="14" fill="url(#beachSky)" />}
      {bg === "snow" && <rect x="0" y="0" width="300" height="200" rx="14" fill="url(#snowSky)" />}
      {bg === "space" && <rect x="0" y="0" width="300" height="200" rx="14" fill="#0b1437" />}

      {/* beach: sun + sand line */}
      {bg === "beach" && (
        <>
          <circle cx="246" cy="44" r="22" fill="#fbbf24" />
          <line x1="0" y1="120" x2="300" y2="120" stroke="#f59e0b" strokeWidth="2" opacity="0.4" />
        </>
      )}

      {/* snowy forest: simple trees + ground */}
      {bg === "snow" && (
        <>
          <rect x="0" y="150" width="300" height="50" fill="#f8fafc" />
          {[40, 90, 210, 260].map((x, i) => (
            <g key={i}>
              <rect x={x - 3} y={120} width="6" height="32" fill="#92400e" />
              <path d={`M${x} 88 L${x - 22} 134 L${x + 22} 134 Z`} fill="#16a34a" />
              <path d={`M${x} 104 L${x - 18} 142 L${x + 18} 142 Z`} fill="#15803d" />
            </g>
          ))}
        </>
      )}

      {/* outer space: fixed stars + planet (deterministic) */}
      {bg === "space" && (
        <>
          {[
            [30, 28], [70, 60], [110, 24], [200, 40], [250, 70],
            [40, 110], [264, 130], [90, 150], [160, 28], [230, 160],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.4 : 1.4} fill="#ffffff" />
          ))}
          <circle cx="252" cy="48" r="18" fill="#a78bfa" />
          <ellipse cx="252" cy="48" rx="28" ry="7" fill="none" stroke="#c4b5fd" strokeWidth="2" />
        </>
      )}

      {/* red kite detail */}
      {choice.details === "chasing a red kite" && (
        <g>
          <path d="M214 58 L226 72 L214 86 L202 72 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          <line x1="214" y1="86" x2="186" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M214 86 l4 8 l-4 -2 l-4 6 l0 -8 z" fill="#f59e0b" />
        </g>
      )}

      {/* the creature */}
      <Subject subject={choice.subject} details={choice.details} />
    </svg>
  );
};

export const SayItSeeIt: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [showWeak, setShowWeak] = useState(isCompleted);
  const [choice, setChoice] = useState<Choice>(isCompleted ? ALL_PICKED : {});
  const [generated, setGenerated] = useState(isCompleted);

  const allPicked = ROWS.every((r) => choice[r.key]);

  const pickChip = (key: RowKey, chip: string) => {
    if (generated) return;
    setChoice((c) => ({ ...c, [key]: chip }));
  };

  const generate = () => {
    if (!allPicked || generated) return;
    setGenerated(true);
    completeSection(sectionIndex, false);
  };

  return (
    <div className="space-y-5">
      {/* ---- WEAK PROMPT ---- */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">
          Prompt 1 · a vague description
        </p>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 font-mono text-lg font-bold text-slate-700">
          a dog
        </div>
        {!showWeak ? (
          <button
            onClick={() => setShowWeak(true)}
            className="mt-3 w-full rounded-full bg-[#8B4EC4] py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Generate
          </button>
        ) : (
          <div className="mt-3 flex flex-col items-center rounded-2xl border-2 border-slate-100 bg-[#fafaff] px-4 py-4">
            <BoringDog />
            <p className="mt-2 text-base font-black uppercase tracking-widest text-slate-400">
              boring
            </p>
          </div>
        )}
      </div>

      {showWeak && (
        <p className="text-center text-lg font-bold text-slate-500">
          Dull, right? Now <span className="font-black text-[#8B4EC4]">tell the AI exactly</span> what
          you imagine. Tap one chip in each row.
        </p>
      )}

      {/* ---- STRONG BUILDER ---- */}
      {showWeak && (
        <div className="space-y-4">
          {ROWS.map((row) => (
            <div key={row.key}>
              <p
                className="mb-2 text-sm font-black uppercase tracking-widest"
                style={{ color: row.color }}
              >
                {row.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {row.chips.map((chip) => {
                  const active = choice[row.key] === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => pickChip(row.key, chip)}
                      disabled={generated}
                      className="rounded-2xl border-2 px-4 py-3 text-base md:text-lg font-bold transition active:scale-95 disabled:cursor-default"
                      style={
                        active
                          ? { borderColor: row.color, background: row.color, color: "#ffffff" }
                          : { borderColor: "#e2e8f0", background: "#ffffff", color: "#334155" }
                      }
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* live assembled sentence */}
          <div className="rounded-2xl border-2 border-slate-100 bg-[#fafaff] px-5 py-4 text-center text-lg md:text-xl font-black leading-relaxed">
            {ROWS.some((r) => choice[r.key]) ? (
              <span>
                {ROWS.map((r, i) =>
                  choice[r.key] ? (
                    <React.Fragment key={r.key}>
                      <span style={{ color: PART_COLOR[r.key] }}>{choice[r.key]}</span>
                      {i < ROWS.length - 1 ? " " : ""}
                    </React.Fragment>
                  ) : null
                )}
              </span>
            ) : (
              <span className="text-slate-400">Your description appears here...</span>
            )}
          </div>

          {!generated && (
            <div className="flex justify-center">
              <button
                onClick={generate}
                disabled={!allPicked}
                className={`rounded-full px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${
                  allPicked
                    ? "bg-[#8B4EC4] hover:bg-[#7a41b0]"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                {allPicked ? "Generate my picture" : "Pick all four first"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- RESULT ---- */}
      {generated && (
        <div
          className="flex flex-col items-center rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-5"
          style={{ animation: "sisPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
        >
          <ResultScene choice={choice} />
          <p className="mt-3 text-center text-xl md:text-2xl font-black text-[#15803d]">
            Same AI. Your words made the difference.
          </p>
        </div>
      )}

      {generated && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes sisPop { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="sisPop"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
