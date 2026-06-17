import React, { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import confetti from "canvas-confetti";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * ArtistProject — AI Creator Camp Day 2 finale. THE Day 2 project.
 * Student brings their superhero to life: hero name, a Subject/Style/
 * Scene/Details picture prompt, an art style, a one-line comic story, and
 * a theme song idea. Submit → confetti + AI ARTIST badge + a shareable
 * Creator's Card, downloadable as a PNG drawn on an offscreen canvas. The
 * entry is persisted to localStorage and restored on revisit.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

interface Artist {
  name: string;
  prompt: string;
  style: string;
  story: string;
  song: string;
}

const STORAGE_KEY = "aicc-artist";

const PROMPT_TEMPLATE =
  "Subject: my superhero standing tall. " +
  "Style: bright comic-book art. " +
  "Scene: a city rooftop at sunset. " +
  "Details: glowing cape, bold colours, dramatic lighting.";

const EMPTY: Artist = {
  name: "",
  prompt: PROMPT_TEMPLATE,
  style: "",
  story: "",
  song: "",
};

const loadArtist = (): Artist | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    if (a && typeof a.name === "string") {
      return { ...EMPTY, ...a };
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

const drawCard = (artist: Artist): string => {
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
  const heroName = artist.name.toUpperCase();
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

  section("PICTURE PROMPT", [artist.prompt.trim()]);
  section("ART STYLE", [artist.style.trim()]);
  section("COMIC STORY", [artist.story.trim()]);
  section("THEME SONG", [artist.song.trim()]);

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, H - 90, W, 90);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e9d5ff";
  ctx.font = "800 22px Nunito, sans-serif";
  ctx.fillText("Made at Codju AI Creator Camp - Day 2", W / 2, H - 38);

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

export const ArtistProject: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [artist, setArtist] = useState<Artist>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  // Restore a saved entry on mount (client only).
  useEffect(() => {
    const saved = loadArtist();
    if (saved) {
      setArtist(saved);
      if (isCompleted) setSubmitted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<Artist>) => {
    setError("");
    setArtist((a) => ({ ...a, ...patch }));
  };

  const submit = () => {
    const missing: string[] = [];
    if (!artist.name.trim()) missing.push("a hero name");
    if (!artist.prompt.trim()) missing.push("a picture prompt");
    if (!artist.style.trim()) missing.push("an art style");
    if (!artist.story.trim()) missing.push("a comic story");
    if (!artist.song.trim()) missing.push("a theme song idea");

    if (missing.length > 0) {
      setError(`Almost there! Your hero still needs ${missing.join(", ")}.`);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(artist));
    } catch {
      /* storage unavailable — card still renders */
    }
    setSubmitted(true);
    fireConfetti();
    completeSection(sectionIndex, false);
  };

  const download = () => {
    const url = drawCard(artist);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(artist.name.trim() || "my-hero").replace(/\s+/g, "-").toLowerCase()}-card.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {!submitted && (
        <div
          className={`space-y-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm ${shake ? "animate-shake" : ""}`}
        >
          <div>
            <Label>Hero name</Label>
            <input
              className={inputCls}
              value={artist.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Captain Pixel"
              maxLength={40}
            />
          </div>

          <div>
            <Label>Picture prompt (Subject, Style, Scene, Details — edit it!)</Label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={5}
              value={artist.prompt}
              onChange={(e) => set({ prompt: e.target.value })}
              maxLength={600}
            />
          </div>

          <div>
            <Label>Art style</Label>
            <input
              className={inputCls}
              value={artist.style}
              onChange={(e) => set({ style: e.target.value })}
              placeholder="e.g. bright comic-book, watercolour, pixel art"
              maxLength={100}
            />
          </div>

          <div>
            <Label>Comic story in one line</Label>
            <input
              className={inputCls}
              value={artist.story}
              onChange={(e) => set({ story: e.target.value })}
              placeholder="What happens to your hero today?"
              maxLength={140}
            />
          </div>

          <div>
            <Label>Theme song idea (genre + mood)</Label>
            <input
              className={inputCls}
              value={artist.song}
              onChange={(e) => set({ song: e.target.value })}
              placeholder="e.g. epic rock, brave and hopeful"
              maxLength={100}
            />
          </div>

          {error && (
            <p className="text-center text-lg font-bold text-red-500">{error}</p>
          )}

          <button
            onClick={submit}
            className="w-full rounded-full bg-[#8B4EC4] py-4 text-lg font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]"
          >
            Bring my hero to life
          </button>
        </div>
      )}

      {submitted && (
        <div className="space-y-4">
          {/* Badge unlock */}
          <div className="flex flex-col items-center gap-1 py-2">
            <div
              className="rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 px-8 py-4 shadow-lg shadow-amber-100"
              style={{ animation: "apBadge 0.7s cubic-bezier(0.175,0.885,0.32,1.275) both" }}
            >
              <span className="text-2xl font-black tracking-widest text-amber-700">
                AI ARTIST
              </span>
            </div>
            <p
              className="mt-2 text-lg font-bold text-slate-500"
              style={{ animation: "apIn 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both" }}
            >
              Badge unlocked · Day 2 project complete
            </p>
          </div>

          {/* Shareable card */}
          <div
            className="overflow-hidden rounded-3xl shadow-xl shadow-purple-200"
            style={{ animation: "apIn 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both" }}
          >
            <div className="bg-gradient-to-br from-[#2e1065] via-[#6b21a8] to-[#8B4EC4] px-6 py-7 text-center">
              <p className="mb-1 text-sm font-black uppercase tracking-[0.3em] text-amber-200">
                AI Superhero
              </p>
              <h3 className="break-words text-4xl font-black uppercase tracking-tight text-white">
                {artist.name}
              </h3>
            </div>
            <div className="space-y-4 bg-[#3b1675] px-6 py-6">
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Picture prompt
                </p>
                <p className="text-lg font-bold leading-relaxed text-purple-50">
                  {artist.prompt}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Art style
                </p>
                <p className="text-lg font-bold text-purple-50">{artist.style}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Comic story
                </p>
                <p className="text-lg font-bold text-purple-50">{artist.story}</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-widest text-amber-200">
                  Theme song
                </p>
                <p className="text-lg font-bold text-purple-50">{artist.song}</p>
              </div>
            </div>
            <div className="bg-[#2e1065] px-6 py-3 text-center">
              <p className="text-sm font-black tracking-widest text-purple-200">
                Made at Codju AI Creator Camp · Day 2
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
        @keyframes apIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes apBadge { 0% { opacity: 0; transform: scale(2.4) rotate(-18deg); } 60% { opacity: 1; transform: scale(0.9) rotate(4deg); } 100% { opacity: 1; transform: scale(1) rotate(0deg); } }
        @media (prefers-reduced-motion: reduce) { [style*="apIn"], [style*="apBadge"] { animation: none !important; } }
      `}</style>
    </div>
  );
};
