import React, { useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * PromptArena — AI Creator Camp Day 1, Level 5 "Prompting in Action".
 * A reusable chip-based prompt-assembly game. One mission per arena
 * (creative / productivity / research). Student fills the four R-C-T-F
 * slots by tapping chips (1 weak + 2 strong per slot), watches the
 * prompt assemble live, then "runs" it. Output quality depends on how
 * many strong chips were picked; only a 4-strong run completes the
 * section. Weak runs get a coach tip and an invitation to swap & re-run
 * — the "make it better" trick in action.
 */

type Arena = "creative" | "productivity" | "research";
type Key = "R" | "C" | "T" | "F";
type Tier = "amazing" | "decent" | "generic";

interface Props {
  sectionIndex: number;
  explanation?: string;
  arena: Arena;
}

interface Chip {
  text: string;
  strong: boolean;
}

interface ArenaConfig {
  mission: string;
  tool: string;
  toolChip: string; // tinted text-chip classes for the tool tag
  calloutBox: string; // tinted callout classes
  calloutText: string;
  slots: Record<Key, Chip[]>;
  outputs: Record<Tier, string>;
  coachTips: Record<Key, string>; // shown when that ingredient was weak
}

const KEYS: Key[] = ["R", "C", "T", "F"];

const KEY_META: Record<
  Key,
  { name: string; dot: string; label: string; chipOn: string; preview: string }
> = {
  R: {
    name: "Role",
    dot: "bg-[#8B4EC4]",
    label: "text-[#6b21a8]",
    chipOn: "border-[#8B4EC4] bg-[#f3e8ff] text-[#6b21a8]",
    preview: "bg-[#f3e8ff] text-[#6b21a8]",
  },
  C: {
    name: "Context",
    dot: "bg-blue-500",
    label: "text-blue-700",
    chipOn: "border-blue-500 bg-blue-100 text-blue-800",
    preview: "bg-blue-100 text-blue-800",
  },
  T: {
    name: "Task",
    dot: "bg-emerald-500",
    label: "text-emerald-700",
    chipOn: "border-emerald-500 bg-emerald-100 text-emerald-800",
    preview: "bg-emerald-100 text-emerald-800",
  },
  F: {
    name: "Format",
    dot: "bg-amber-500",
    label: "text-amber-700",
    chipOn: "border-amber-500 bg-amber-100 text-amber-800",
    preview: "bg-amber-100 text-amber-800",
  },
};

const BASE_TIPS: Record<Key, string> = {
  R: "Your Role was vague — the AI did not know who to be.",
  C: "Your Context was thin — the AI did not know your situation.",
  T: "Your Task was fuzzy — the AI had to guess what you wanted.",
  F: "Your Format was missing — the AI picked any old shape.",
};

const ARENAS: Record<Arena, ArenaConfig> = {
  creative: {
    mission: "Make AI write a mini story: your school secretly turns into a video game at night.",
    tool: "ChatGPT",
    toolChip: "bg-emerald-100 text-emerald-800",
    calloutBox: "border-[#f5d0fe] bg-[#fdf4ff]",
    calloutText: "text-[#86198f]",
    slots: {
      R: [
        { text: "You are an adventure-game storyteller", strong: true },
        { text: "(no role)", strong: false },
        { text: "You are a comedy writer for teens", strong: true },
      ],
      C: [
        { text: "about stuff", strong: false },
        { text: "for students my age who love gaming", strong: true },
        { text: "set in an Indian school after the last bell", strong: true },
      ],
      T: [
        { text: "write a short story where the school turns into a game level at night", strong: true },
        { text: "write a story with a twist ending where the janitor is the final boss", strong: true },
        { text: "write something", strong: false },
      ],
      F: [
        { text: "8 lines, end on a cliffhanger", strong: true },
        { text: "(no format)", strong: false },
        { text: "3 short paragraphs", strong: true },
      ],
    },
    outputs: {
      amazing:
        "11:58 PM. The bell rings backwards. Lockers flip into loot crates. The corridor lights up like a level map. \"PLAYER ONE: ENTER.\" Behind you, keys jingle. The janitor's eyes glow red.",
      decent:
        "One night, a school became a video game. The students jumped over desks and collected points. It was exciting. Then the sun came up and everything was normal again. The end.",
      generic:
        "Here is something: School is a place where students learn. Games are activities people enjoy. Both can be interesting. Let me know if you would like more!",
    },
    coachTips: { ...BASE_TIPS },
  },
  productivity: {
    mission: "Friday is the Science test. Make AI turn your chapter into a study kit.",
    tool: "Gemini",
    toolChip: "bg-blue-100 text-blue-800",
    calloutBox: "border-sky-200 bg-sky-50",
    calloutText: "text-sky-800",
    slots: {
      R: [
        { text: "(no role)", strong: false },
        { text: "You are a friendly Science teacher", strong: true },
        { text: "You are a study coach for Grade 7", strong: true },
      ],
      C: [
        { text: "I have a test on the 'Light' chapter this Friday", strong: true },
        { text: "I have school", strong: false },
        { text: "I only have 30 minutes a day to study", strong: true },
      ],
      T: [
        { text: "make me a 10-question practice quiz with answers", strong: true },
        { text: "help me", strong: false },
        { text: "turn the chapter into a day-by-day revision plan", strong: true },
      ],
      F: [
        { text: "as a table: question, answer, one-line why", strong: true },
        { text: "as a checklist I can tick off", strong: true },
        { text: "(no format)", strong: false },
      ],
    },
    outputs: {
      amazing:
        "Q1: What is reflection? Light bouncing off a surface — think mirror. Q2: Why can you see this screen? It sends light to your eyes. Eight more rows ready, answers included.",
      decent:
        "Light is a form of energy that travels in straight lines. Reflection means light bounces off surfaces. Revise a little every day and sleep well before your test. Good luck!",
      generic:
        "Sure! School can be challenging. Try to study hard, stay organised, and believe in yourself. You can do it!",
    },
    coachTips: { ...BASE_TIPS },
  },
  research: {
    mission: "Settle the debate: is cold water bad for you after exercise? Find the truth.",
    tool: "Perplexity",
    toolChip: "bg-violet-100 text-violet-800",
    calloutBox: "border-violet-200 bg-violet-50",
    calloutText: "text-violet-800",
    slots: {
      R: [
        { text: "You are a careful research assistant", strong: true },
        { text: "You are a sports-science explainer", strong: true },
        { text: "(no role)", strong: false },
      ],
      C: [
        { text: "people say things", strong: false },
        { text: "my PE teacher and my friend disagree about this", strong: true },
        { text: "I need to explain it to my class tomorrow", strong: true },
      ],
      T: [
        { text: "find out whether cold water after exercise is harmful", strong: true },
        { text: "tell me stuff", strong: false },
        { text: "compare what real studies say about it", strong: true },
      ],
      F: [
        { text: "3 bullet points and show your sources", strong: true },
        { text: "(no sources mentioned)", strong: false },
        { text: "short verdict plus the links you used", strong: true },
      ],
    },
    outputs: {
      amazing:
        "Verdict: studies find no real harm. Cool water after exercise is fine, and may help you rehydrate faster. Ice-cold gulps can cause brief cramps; sip slowly. Sources: [1] sports medicine journal [2] health site.",
      decent:
        "Some people believe cold water after exercise is bad, while others say it is fine. Opinions vary online. It probably depends on the person. Hope that helps!",
      generic:
        "Water is very important. Exercise is also very important. Remember to drink water and exercise regularly. Stay healthy!",
    },
    coachTips: {
      ...BASE_TIPS,
      F: "Facts need sources — always ask the AI to show where it found them.",
    },
  },
};

const TIER_STYLE: Record<Tier, { head: string; box: string; text: string }> = {
  amazing: {
    head: "AI output: Excellent",
    box: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-900",
  },
  decent: {
    head: "AI output: Decent",
    box: "border-amber-200 bg-amber-50",
    text: "text-amber-900",
  },
  generic: {
    head: "AI output: Generic",
    box: "border-slate-200 bg-slate-50",
    text: "text-slate-600",
  },
};

const strongIndex = (chips: Chip[]) => chips.findIndex((c) => c.strong);

export const PromptArena: React.FC<Props> = ({ sectionIndex, explanation, arena }) => {
  const cfg = ARENAS[arena];
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [picks, setPicks] = useState<Record<Key, number | null>>(() =>
    isCompleted
      ? { R: strongIndex(cfg.slots.R), C: strongIndex(cfg.slots.C), T: strongIndex(cfg.slots.T), F: strongIndex(cfg.slots.F) }
      : { R: null, C: null, T: null, F: null }
  );
  const [result, setResult] = useState<Tier | null>(isCompleted ? "amazing" : null);
  const [solved, setSolved] = useState(isCompleted);
  const [runs, setRuns] = useState(0);
  const completedRef = useRef(isCompleted);

  const allPicked = KEYS.every((k) => picks[k] !== null);
  const anyPicked = KEYS.some((k) => picks[k] !== null);

  const pickChip = (key: Key, i: number) => {
    if (solved) return;
    setPicks((p) => ({ ...p, [key]: i }));
    setResult(null); // swapped a chip → invite a fresh run
  };

  const run = () => {
    if (!allPicked || solved) return;
    const strong = KEYS.filter((k) => cfg.slots[k][picks[k] as number].strong).length;
    const tier: Tier = strong === 4 ? "amazing" : strong >= 2 ? "decent" : "generic";
    setResult(tier);
    setRuns((r) => r + 1);
    if (tier === "amazing" && !completedRef.current) {
      completedRef.current = true;
      setSolved(true);
      completeSection(sectionIndex, false);
    }
  };

  const weakKeys = allPicked
    ? KEYS.filter((k) => !cfg.slots[k][picks[k] as number].strong)
    : [];

  return (
    <div className="space-y-4">
      {/* Mission briefing */}
      <div className={`rounded-3xl border-2 px-6 py-5 ${cfg.calloutBox}`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-sm font-black uppercase tracking-widest ${cfg.calloutText}`}>
            Your mission
          </p>
          <span className={`rounded-full px-4 py-1.5 text-base font-black shadow-sm ${cfg.toolChip}`}>
            {cfg.tool}
          </span>
        </div>
        <p className={`text-xl font-black leading-snug ${cfg.calloutText}`}>{cfg.mission}</p>
        <p className="mt-2 text-base font-bold text-slate-500">
          Pick one chip per ingredient. Weak chips make weak prompts.
        </p>
      </div>

      {/* The four R-C-T-F slots */}
      <div className="space-y-3">
        {KEYS.map((k) => {
          const meta = KEY_META[k];
          return (
            <div key={k} className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white ${meta.dot}`}
                >
                  {k}
                </span>
                <span className={`text-base font-black ${meta.label}`}>{meta.name}</span>
                {picks[k] !== null && (
                  <span className="ml-auto text-sm font-black text-emerald-600">Picked</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {cfg.slots[k].map((chip, i) => {
                  const on = picks[k] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => pickChip(k, i)}
                      disabled={solved}
                      className={`rounded-full border-2 px-5 py-3 text-left text-base font-bold transition active:scale-95 md:text-lg ${
                        on
                          ? meta.chipOn
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                      } ${chip.strong ? "" : "italic"} ${solved && !on ? "opacity-40" : ""}`}
                    >
                      {chip.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live prompt preview */}
      <div className="rounded-3xl border-2 border-[#e9d5ff] bg-[#faf5ff] p-6">
        <p className="mb-3 text-sm font-black uppercase tracking-widest text-[#8B4EC4]">
          Your prompt, building live
        </p>
        {anyPicked ? (
          <p className="font-mono text-lg font-bold leading-loose">
            {KEYS.map((k) => {
              const i = picks[k];
              if (i === null) return null;
              const chip = cfg.slots[k][i];
              return (
                <span
                  key={k}
                  className={`rounded-md px-1 py-0.5 ${KEY_META[k].preview} ${
                    chip.strong ? "" : "italic opacity-50"
                  }`}
                >
                  {chip.text}{" "}
                </span>
              );
            })}
          </p>
        ) : (
          <p className="text-lg font-bold text-slate-400">
            Tap chips above. Your prompt builds itself here.
          </p>
        )}
      </div>

      {/* Run button */}
      {!solved && (
        <div className="flex justify-center">
          <button
            onClick={run}
            disabled={!allPicked}
            className={`rounded-full px-10 py-4 text-lg font-black text-white shadow-md transition active:scale-95 ${
              allPicked
                ? "bg-[#8B4EC4] hover:bg-[#7a41b0]"
                : "cursor-not-allowed bg-slate-300"
            }`}
          >
            {runs > 0 ? "Run it again" : "Run my prompt"}
          </button>
        </div>
      )}

      {/* Simulated AI output */}
      {result && (
        <div
          className={`pa-pop rounded-3xl border-2 p-6 ${TIER_STYLE[result].box}`}
          key={`${result}-${runs}`}
        >
          <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">
            {TIER_STYLE[result].head}
          </p>
          <p className={`text-lg font-bold leading-relaxed ${TIER_STYLE[result].text}`}>
            {cfg.outputs[result]}
          </p>
        </div>
      )}

      {/* Coach corner for weak runs */}
      {result === "decent" && (
        <div className="pa-pop rounded-2xl border-2 border-amber-200 bg-[#fff7ed] px-5 py-4">
          <p className="mb-1 text-sm font-black uppercase tracking-widest text-[#b45309]">
            Coach's tip
          </p>
          {weakKeys.map((k) => (
            <p key={k} className="text-base font-bold text-[#b45309]">
              {cfg.coachTips[k]}
            </p>
          ))}
          <p className="mt-1 text-base font-black text-[#b45309]">
            Swap the weak chip and run it again.
          </p>
        </div>
      )}
      {result === "generic" && (
        <p className="pa-pop text-center text-lg font-bold text-slate-500">
          That prompt gave the AI almost nothing. Swap in stronger chips and run it again.
        </p>
      )}

      {solved && (
        <p className="text-center text-xl font-black text-[#15803d]">
          4 out of 4 strong ingredients — that is a pro prompt.
        </p>
      )}
      {solved && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes paPop { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .pa-pop { animation: paPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) both; }
        @media (prefers-reduced-motion: reduce) { .pa-pop { animation: none; } }
      `}</style>
    </div>
  );
};
