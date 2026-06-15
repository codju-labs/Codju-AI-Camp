import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import confetti from "canvas-confetti";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * SuperheroBuilder — AI Creator Camp Day 1 finale. THE Day 1 project.
 * Student designs an original AI Superhero (name, powers, mission,
 * weakness, backstory) plus the R-C-T-F prompt they'd use to bring it
 * to life. Submit → confetti + PROMPT MASTER badge + a shareable comic
 * card, downloadable as a PNG drawn on an offscreen canvas. The hero is
 * persisted to localStorage and restored on revisit.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Hero {
  name: string;
  powers: [string, string, string];
  mission: string;
  weakness: string;
  backstory: string;
  prompt: string;
}

const STORAGE_KEY = "aicc-superhero";

const PROMPT_TEMPLATE =
  "You are a comic book writer. I am a student at AI Creator Camp. " +
  "Write an exciting origin story for my superhero (details below). " +
  "Format: 3 short paragraphs, dramatic.";

const EMPTY: Hero = {
  name: "",
  powers: ["", "", ""],
  mission: "",
  weakness: "",
  backstory: "",
  prompt: PROMPT_TEMPLATE,
};

const loadHero = (): Hero | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw);
    if (h && typeof h.name === "string" && Array.isArray(h.powers)) {
      return {
        ...EMPTY,
        ...h,
        powers: [h.powers[0] ?? "", h.powers[1] ?? "", h.powers[2] ?? ""],
      };
    }
  } catch {
    /* corrupted storage — start fresh */
  }
  return null;
};

// Word-wraps `text` on a canvas context; returns the y after the last line.
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number => {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineHeight;
  }
  return yy;
};

const drawCard = (hero: Hero): string => {
  const W = 800;
  const H = 1130;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Deep purple gradient background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2e1065");
  bg.addColorStop(0.55, "#6b21a8");
  bg.addColorStop(1, "#8B4EC4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header banner
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fillRect(0, 0, W, 200);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fde68a";
  ctx.font = "900 26px 'Baloo 2', Nunito, sans-serif";
  ctx.fillText("AI SUPERHERO", W / 2, 70);
  ctx.fillStyle = "#ffffff";
  let nameSize = 64;
  ctx.font = `900 ${nameSize}px 'Baloo 2', Nunito, sans-serif`;
  const heroName = hero.name.toUpperCase();
  while (ctx.measureText(heroName).width > W - 100 && nameSize > 30) {
    nameSize -= 4;
    ctx.font = `900 ${nameSize}px 'Baloo 2', Nunito, sans-serif`;
  }
  ctx.fillText(heroName, W / 2, 150);

  // Sections
  ctx.textAlign = "left";
  const left = 70;
  const maxW = W - 140;
  let y = 270;

  const section = (label: string, body: string[]) => {
    ctx.fillStyle = "#fde68a";
    ctx.font = "900 28px 'Baloo 2', Nunito, sans-serif";
    ctx.fillText(label, left, y);
    y += 42;
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 24px Nunito, sans-serif";
    for (const b of body) {
      y = wrapText(ctx, b, left, y, maxW, 34);
    }
    y += 30;
  };

  section(
    "POWERS",
    hero.powers.filter((p) => p.trim()).map((p) => "-  " + p.trim())
  );
  section("MISSION", [hero.mission.trim()]);
  section("WEAKNESS", [hero.weakness.trim()]);
  section("BACKSTORY", [hero.backstory.trim()]);

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, H - 90, W, 90);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e9d5ff";
  ctx.font = "800 22px Nunito, sans-serif";
  ctx.fillText("Created at Codju AI Creator Camp - Day 1", W / 2, H - 38);

  return canvas.toDataURL("image/png");
};

const fireConfetti = () => {
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
  setTimeout(
    () => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } }),
    250
  );
  setTimeout(
    () => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } }),
    400
  );
};

const inputCls =
  "w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:bg-white";

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="mb-1.5 block text-lg font-black text-slate-600">
    {children}
  </label>
);

export const SuperheroBuilder: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [hero, setHero] = useState<Hero>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  // Restore a saved hero on mount (client only).
  useEffect(() => {
    const saved = loadHero();
    if (saved) {
      setHero(saved);
      if (isCompleted) setSubmitted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Hero>) => {
    setError("");
    setHero((h) => ({ ...h, ...patch }));
  };
  const setPower = (i: number, v: string) => {
    setError("");
    setHero((h) => {
      const powers = [...h.powers] as Hero["powers"];
      powers[i] = v;
      return { ...h, powers };
    });
  };

  const submit = () => {
    const missing: string[] = [];
    if (!hero.name.trim()) missing.push("a name");
    if (hero.powers.filter((p) => p.trim()).length < 3) missing.push("3 powers");
    if (!hero.mission.trim()) missing.push("a mission");
    if (!hero.weakness.trim()) missing.push("a weakness");
    if (!hero.backstory.trim()) missing.push("a backstory");
    if (!hero.prompt.trim()) missing.push("your prompt");

    if (missing.length > 0) {
      setError(`Almost there! Your hero still needs ${missing.join(", ")}.`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hero));
    } catch {
      /* storage unavailable — card still renders */
    }
    setSubmitted(true);
    fireConfetti();
    completeSection(sectionIndex, false);
  };

  const download = () => {
    const url = drawCard(hero);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(hero.name.trim() || "my-superhero").replace(/\s+/g, "-").toLowerCase()}-card.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {!submitted && (
        <div
          className={`space-y-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm ${shake ? "animate-shake" : ""}`}
        >
          <div>
            <Label>Superhero name</Label>
            <input
              className={inputCls}
              value={hero.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Captain Prompt"
              maxLength={40}
            />
          </div>

          <div>
            <Label>Three powers</Label>
            <div className="space-y-2">
              {hero.powers.map((p, i) => (
                <input
                  key={i}
                  className={inputCls}
                  value={p}
                  onChange={(e) => setPower(i, e.target.value)}
                  placeholder={
                    ["Power 1 — e.g. Turns vague words into clear ones", "Power 2", "Power 3"][i]
                  }
                  maxLength={80}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Mission</Label>
            <input
              className={inputCls}
              value={hero.mission}
              onChange={(e) => set({ mission: e.target.value })}
              placeholder="What does your hero fight for?"
              maxLength={120}
            />
          </div>

          <div>
            <Label>Weakness</Label>
            <input
              className={inputCls}
              value={hero.weakness}
              onChange={(e) => set({ weakness: e.target.value })}
              placeholder="Every great hero has one"
              maxLength={100}
            />
          </div>

          <div>
            <Label>Backstory (2-3 lines)</Label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={hero.backstory}
              onChange={(e) => set({ backstory: e.target.value })}
              placeholder="Where did your hero come from? What changed everything?"
              maxLength={400}
            />
          </div>

          <div>
            <Label>The prompt I used (R-C-T-F — edit it!)</Label>
            <textarea
              className={`${inputCls} resize-none font-mono text-base`}
              rows={4}
              value={hero.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
              maxLength={600}
            />
          </div>

          {error && (
            <p className="text-center text-lg font-bold text-red-500">{error}</p>
          )}

          <button
            onClick={submit}
            className="w-full rounded-full bg-[#8B4EC4] py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Create my superhero
          </button>
        </div>
      )}

      {submitted && (
        <div className="space-y-4">
          {/* Badge unlock */}
          <div className="flex flex-col items-center gap-1 py-2">
            <div
              className="rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 px-8 py-4 shadow-lg shadow-amber-100"
              style={{ animation: "shbBadge 0.7s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
            >
              <span className="text-2xl font-black tracking-widest text-amber-700">
                PROMPT MASTER
              </span>
            </div>
            <p
              className="mt-2 text-lg font-bold text-slate-500"
              style={{ animation: "shbIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
            >
              Badge unlocked · Day 1 project complete
            </p>
          </div>

          {/* Shareable card */}
          <div
            className="overflow-hidden rounded-3xl shadow-xl shadow-purple-200"
            style={{ animation: "shbIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
          >
            <div className="bg-gradient-to-br from-[#2e1065] via-[#6b21a8] to-[#8B4EC4] px-6 py-7 text-center">
              <p className="mb-1 text-sm font-black uppercase tracking-[0.3em] text-amber-200">
                AI Superhero
              </p>
              <h3 className="break-words text-4xl font-black uppercase tracking-tight text-white">
                {hero.name}
              </h3>
            </div>
            <div className="space-y-4 bg-[#3b1675] px-6 py-6">
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Powers
                </p>
                <ul className="space-y-1">
                  {hero.powers
                    .filter((p) => p.trim())
                    .map((p, i) => (
                      <li key={i} className="text-lg font-bold text-purple-50">
                        • {p}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Mission
                </p>
                <p className="text-lg font-bold text-purple-50">{hero.mission}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Weakness
                </p>
                <p className="text-lg font-bold text-purple-50">{hero.weakness}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Backstory
                </p>
                <p className="text-lg font-bold leading-relaxed text-purple-50">
                  {hero.backstory}
                </p>
              </div>
            </div>
            <div className="bg-[#2e1065] px-6 py-3 text-center">
              <p className="text-sm font-black tracking-widest text-purple-200">
                Created at Codju AI Creator Camp · Day 1
              </p>
            </div>
          </div>

          <button
            onClick={download}
            className="w-full rounded-full border-2 border-[#8B4EC4] bg-white py-4 text-lg font-black text-[#8B4EC4] transition active:scale-95 hover:bg-[#faf5ff]"
          >
            Download my card
          </button>
        </div>
      )}
      {submitted && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}

      <style>{`
        @keyframes shbIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shbBadge { 0% { opacity: 0; transform: scale(2.4) rotate(-18deg); } 60% { opacity: 1; transform: scale(0.9) rotate(4deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @media (prefers-reduced-motion: reduce) { [style*="shbIn"], [style*="shbBadge"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
