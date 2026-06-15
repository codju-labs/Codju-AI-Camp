import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PromptDoctor — AI Creator Camp Day 1, Level 4 warm-up.
 * Three sick prompts, each missing a DIFFERENT mix of R-C-T-F. The student
 * diagnoses which ingredients are missing; the prompt then heals into a
 * complete version. Patient 1 runs a full R-C-T-F guided tour (each step
 * spotlights one ingredient's words and explains it); patients 2 and 3 are
 * quicker spot-the-gap rounds.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

type Key = "R" | "C" | "T" | "F";
type Status = "missing" | "vague" | "present";

const ORDER: Key[] = ["R", "C", "T", "F"];

const KEY_META: Record<
  Key,
  { name: string; meaning: string; dot: string; tint: string; ink: string; chip: string; seg: string }
> = {
  R: {
    name: "Role",
    meaning: "WHO the AI should pretend to be.",
    dot: "bg-[#8B4EC4]",
    tint: "bg-[#f3e8ff]",
    ink: "text-[#6b21a8]",
    chip: "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]",
    seg: "bg-[#f3e8ff] text-[#6b21a8]",
  },
  C: {
    name: "Context",
    meaning: "The background the AI needs to know.",
    dot: "bg-blue-500",
    tint: "bg-blue-100",
    ink: "text-blue-800",
    chip: "border-blue-400 bg-blue-50 text-blue-700",
    seg: "bg-blue-100 text-blue-800",
  },
  T: {
    name: "Task",
    meaning: "The exact job you want done.",
    dot: "bg-emerald-500",
    tint: "bg-emerald-100",
    ink: "text-emerald-800",
    chip: "border-emerald-400 bg-emerald-50 text-emerald-700",
    seg: "bg-emerald-100 text-emerald-800",
  },
  F: {
    name: "Format",
    meaning: "The SHAPE the answer should take.",
    dot: "bg-amber-500",
    tint: "bg-amber-100",
    ink: "text-amber-800",
    chip: "border-amber-400 bg-amber-50 text-amber-700",
    seg: "bg-amber-100 text-amber-800",
  },
};

interface CaseDef {
  sick: string;
  missing: Key[];
  status: Record<Key, Status>;
  diagnosis: Record<Key, string>;
  healed: { text: string; tag: Key }[];
  tour: boolean;
  tourContent?: Record<Key, { text: string; why: string }>;
  summary: string;
}

const CASES: CaseDef[] = [
  {
    sick: "tell me about dogs",
    missing: ["R", "C", "F"],
    status: { R: "missing", C: "missing", T: "vague", F: "missing" },
    diagnosis: {
      R: "Missing! No expert here. Add: \"You are a vet…\"",
      C: "Missing! Who is asking, and why? Add: \"…to an 11-year-old…\"",
      T: "It HAS a task, but a vague one. \"Tell me about dogs\" could mean a thousand things.",
      F: "Missing! What shape? Add: \"…in 4 short fun points.\"",
    },
    healed: [
      { text: "You are a vet.", tag: "R" },
      { text: " Explain", tag: "T" },
      { text: " to an 11-year-old", tag: "C" },
      { text: " why dogs wag their tails,", tag: "T" },
      { text: " in 4 short fun points.", tag: "F" },
    ],
    tour: true,
    tourContent: {
      R: { text: "You are a vet.", why: "An expert gives a far better answer than a stranger." },
      C: { text: "to an 11-year-old", why: "Now it knows who it is talking to, so it keeps things simple." },
      T: { text: "Explain why dogs wag their tails", why: "A clear job beats a vague topic like \"dogs\"." },
      F: { text: "in 4 short fun points.", why: "You decide how the answer looks — short, listed, fun." },
    },
    summary: "Three ingredients were missing. Now all four are in.",
  },
  {
    sick: "You are a coding tutor. Explain what a loop is.",
    missing: ["C", "F"],
    status: { R: "present", C: "missing", T: "present", F: "missing" },
    diagnosis: {
      R: "Already here. \"You are a coding tutor\" gives it a role.",
      C: "Missing! For whom? Add: \"…to a 12-year-old beginner…\"",
      T: "Already here. \"Explain what a loop is\" is a clear task.",
      F: "Missing! What shape? Add: \"…with one example, in 3 short steps.\"",
    },
    healed: [
      { text: "You are a coding tutor.", tag: "R" },
      { text: " Explain what a loop is", tag: "T" },
      { text: " to a 12-year-old beginner,", tag: "C" },
      { text: " with one example, in 3 short steps.", tag: "F" },
    ],
    tour: true,
    tourContent: {
      R: { text: "You are a coding tutor.", why: "An expert tutor explains far better than a random helper." },
      C: { text: "to a 12-year-old beginner", why: "Now it pitches the answer at exactly the right level." },
      T: { text: "Explain what a loop is", why: "A clear, specific question to answer." },
      F: { text: "with one example, in 3 short steps", why: "You choose the shape — short, with an example." },
    },
    summary: "Role and Task were already here. You added Context and Format.",
  },
  {
    sick: "You are a chef. I'm a beginner who loves pasta.",
    missing: ["T", "F"],
    status: { R: "present", C: "present", T: "missing", F: "missing" },
    diagnosis: {
      R: "Already here. \"You are a chef\" sets the role.",
      C: "Already here. \"a beginner who loves pasta\" is the background.",
      T: "Missing! You never said what you WANT. Add: \"Give me one easy recipe…\"",
      F: "Missing! What shape? Add: \"…as a numbered list of 5 steps.\"",
    },
    healed: [
      { text: "You are a chef.", tag: "R" },
      { text: " I'm a beginner who loves pasta.", tag: "C" },
      { text: " Give me one easy pasta recipe,", tag: "T" },
      { text: " as a numbered list of 5 steps.", tag: "F" },
    ],
    tour: true,
    tourContent: {
      R: { text: "You are a chef.", why: "A chef gives a far better recipe than a stranger." },
      C: { text: "I'm a beginner who loves pasta", why: "Now it knows your skill level and what you like." },
      T: { text: "Give me one easy pasta recipe", why: "Finally, the actual job — what you WANT." },
      F: { text: "as a numbered list of 5 steps", why: "You decide the shape — a clear 5-step list." },
    },
    summary: "Role and Context were here, but you forgot the Task. You added Task and Format.",
  },
];

const lineStyle = (s: Status) =>
  s === "missing"
    ? "border-red-100 bg-red-50/60 text-slate-700"
    : s === "vague"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

export const PromptDoctor: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);
  const lastIdx = CASES.length - 1;

  const [caseIdx, setCaseIdx] = useState(isCompleted ? lastIdx : 0);
  const cur = CASES[caseIdx];

  const [found, setFound] = useState<Set<Key>>(
    isCompleted ? new Set(CASES[lastIdx].missing) : new Set()
  );
  const [revealed, setRevealed] = useState<Set<Key>>(new Set());
  const [healed, setHealed] = useState(isCompleted);
  const [tourStep, setTourStep] = useState(isCompleted ? ORDER.length : 0);

  const tourDone = tourStep >= ORDER.length;
  const resultReady = healed && (cur.tour ? tourDone : true);
  const activeKey: Key | null = cur.tour && !tourDone ? ORDER[tourStep] : null;
  const allDone = resultReady && caseIdx === lastIdx;

  const tap = (key: Key) => {
    if (healed) return;
    setRevealed((r) => new Set(r).add(key));
    if (cur.missing.includes(key)) {
      if (found.has(key)) return;
      const next = new Set(found).add(key);
      setFound(next);
      if (cur.missing.every((k) => next.has(k))) {
        setTimeout(() => {
          setHealed(true);
          if (caseIdx === lastIdx) completeSection(sectionIndex, false);
        }, 600);
      }
    }
  };

  const nextCase = () => {
    setCaseIdx((i) => i + 1);
    setFound(new Set());
    setRevealed(new Set());
    setHealed(false);
    setTourStep(0);
  };

  return (
    <div className="space-y-4">
      {/* The patient */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
            Patient {caseIdx + 1} of {CASES.length}
          </p>
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-500">
            {healed ? "CURED" : `${found.size}/${cur.missing.length} problems found`}
          </span>
        </div>
        {!healed ? (
          <div className="rounded-2xl bg-slate-100 px-4 py-4 text-center font-mono text-lg md:text-xl font-bold leading-relaxed text-slate-600">
            {cur.sick}
          </div>
        ) : (
          <div className="pd-heal rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-4 text-center">
            <p className="font-mono text-lg md:text-xl font-bold leading-loose">
              {cur.healed.map((seg, i) => {
                const active = !cur.tour || tourDone || seg.tag === activeKey;
                return (
                  <span
                    key={i}
                    className={`rounded-md px-1 py-0.5 transition-all duration-300 ${
                      active ? KEY_META[seg.tag].seg : "bg-slate-100 text-slate-300"
                    }`}
                  >
                    {seg.text}
                  </span>
                );
              })}
            </p>
            {resultReady && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-black">
                {ORDER.map((k) => (
                  <span key={k} className={`rounded-full px-2.5 py-1 ${KEY_META[k].seg}`}>
                    {k} · {KEY_META[k].name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnosis chips */}
      {!healed && (
        <>
          <p className="text-center text-lg font-bold text-slate-500">
            Tap every ingredient this prompt is <span className="font-black text-red-500">missing</span>:
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ORDER.map((k) => {
              const lit = revealed.has(k);
              return (
                <button
                  key={k}
                  onClick={() => tap(k)}
                  className={`rounded-2xl border-2 px-3 py-3 text-center transition active:scale-95 ${
                    lit
                      ? KEY_META[k].chip
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"
                  }`}
                >
                  <span
                    className={`mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-white ${
                      lit ? KEY_META[k].dot : "bg-slate-300"
                    }`}
                  >
                    {k}
                  </span>
                  <span className="text-base font-black">{KEY_META[k].name}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Diagnosis one-liners */}
      {!healed && (
        <div className="space-y-2">
          {ORDER.filter((k) => revealed.has(k)).map((k) => (
            <div
              key={k}
              className={`pd-pop flex items-start gap-2.5 rounded-2xl border-2 px-4 py-3 text-lg font-bold ${lineStyle(
                cur.status[k]
              )}`}
            >
              <span
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${KEY_META[k].dot}`}
              >
                {k}
              </span>
              <span>{cur.diagnosis[k]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Patient 1: guided R-C-T-F tour */}
      {cur.tour && healed && !tourDone && cur.tourContent && (
        <div className="space-y-3">
          <p className="text-center text-base font-black uppercase tracking-widest text-slate-400">
            Meet the 4 ingredients
          </p>

          <div className="flex justify-center gap-2">
            {ORDER.map((k, i) => (
              <span
                key={k}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black transition-all duration-300 ${
                  i === tourStep
                    ? `${KEY_META[k].dot} scale-110 text-white shadow-md`
                    : i < tourStep
                      ? "bg-slate-300 text-white"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {k}
              </span>
            ))}
          </div>

          {(() => {
            const k = ORDER[tourStep];
            const meta = KEY_META[k];
            const content = cur.tourContent![k];
            return (
              <div key={k} className="pd-pop rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow ${meta.dot}`}
                  >
                    {k}
                  </span>
                  <div>
                    <p className="text-2xl font-black text-slate-800">{meta.name}</p>
                    <p className="text-lg font-bold text-slate-500">{meta.meaning}</p>
                  </div>
                </div>
                <div className={`mt-4 rounded-2xl ${meta.tint} px-4 py-3`}>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">In this prompt</p>
                  <p className={`mt-1 font-mono text-lg font-black ${meta.ink}`}>“{content.text}”</p>
                </div>
                <p className="mt-3 text-lg font-bold text-slate-700">{content.why}</p>
              </div>
            );
          })()}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setTourStep((s) => Math.max(0, s - 1))}
              disabled={tourStep === 0}
              className={`rounded-full border-2 px-7 py-3 text-base font-black transition active:scale-95 ${
                tourStep === 0
                  ? "border-slate-100 bg-white text-slate-300"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4] hover:text-[#8B4EC4]"
              }`}
            >
              Back
            </button>
            <button
              onClick={() => setTourStep((s) => s + 1)}
              className="rounded-full bg-[#8B4EC4] px-8 py-3 text-base font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
            >
              {tourStep === ORDER.length - 1 ? "I've got it" : `Next: ${KEY_META[ORDER[tourStep + 1]].name}`}
            </button>
          </div>
        </div>
      )}

      {/* Result summary for the current patient */}
      {resultReady && (
        <p className="pd-pop text-center text-lg font-black text-[#15803d]">{cur.summary}</p>
      )}

      {/* Move to next patient, or finish */}
      {resultReady && caseIdx < lastIdx && (
        <div className="flex justify-center">
          <button
            onClick={nextCase}
            className="rounded-full bg-[#8B4EC4] px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Next patient
          </button>
        </div>
      )}

      {allDone && (
        <p className="text-center text-lg font-black text-[#15803d]">
          Three patients, all cured. You can spot a missing ingredient anywhere now.
        </p>
      )}
      {allDone && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes pdPop { from { opacity: 0; transform: scale(0.95) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pdHeal { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .pd-pop { animation: pdPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        .pd-heal { animation: pdHeal 0.6s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        @media (prefers-reduced-motion: reduce) { .pd-pop,.pd-heal { animation: none; } }
      `}</style>
    </div>
  );
};
