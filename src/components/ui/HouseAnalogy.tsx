import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * HouseAnalogy — AI Creator Camp Day 5, Level 7. Teaches the parts needed to
 * put a website on the internet by mapping each one to a part of building a
 * house. One pair at a time: read the house part, pick its website match.
 */

interface Props {
  sectionIndex: number;
  explanation?: string;
}

const WEB_TERMS = ["Domain Name", "Hosting", "Database", "Server", "Internet", "Frontend"];

interface Pair {
  house: string;
  role: string;
  answer: string;
  why: string;
}

const PAIRS: Pair[] = [
  { house: "The address on the gate", role: "so people can find your house", answer: "Domain Name", why: "The domain (like codju.com) is your website's address." },
  { house: "The land you build on", role: "the space your house sits on", answer: "Hosting", why: "Hosting is the rented space online where your website lives." },
  { house: "The big apartment building", role: "a strong structure that's always standing", answer: "Server", why: "A server is the always-on computer that holds and serves your site." },
  { house: "The storage room", role: "where you keep all your stuff safely", answer: "Database", why: "A database safely stores all the data your site needs to remember." },
  { house: "The roads to your house", role: "how visitors travel to you", answer: "Internet", why: "The internet is the network of roads that carries visitors to your site." },
  { house: "The paint, rooms and furniture", role: "what guests actually see and use", answer: "Frontend", why: "The frontend is everything visitors see and click on the page." },
];

export const HouseAnalogy: React.FC<Props> = ({ sectionIndex, explanation }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);

  const [idx, setIdx] = useState(isCompleted ? PAIRS.length : 0);
  const [pick, setPick] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const done = idx >= PAIRS.length;

  const p = done ? null : PAIRS[idx];
  const correct = pick !== null && p !== null && pick === p.answer;

  const choose = (t: string) => {
    if (!p || correct) return;
    setPick(t);
    if (t !== p.answer) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  const next = () => { setIdx((i) => i + 1); setPick(null); };

  return (
    <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Putting a website online is like building a house. Match each house part to its website part.
      </div>

      {!done && p && (
        <>
          <div className="flex items-center justify-center gap-2">
            {PAIRS.map((_, i) => (
              <span key={i} className={`h-2.5 rounded-full transition-all ${i < idx ? "w-2.5 bg-[#2EB85C]" : i === idx ? "w-7 bg-[#8B4EC4]" : "w-2.5 bg-slate-200"}`} />
            ))}
          </div>
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">For a house, this is...</p>
            <p className="mt-2 text-xl md:text-2xl font-black leading-snug text-slate-800">{p.house}</p>
            <p className="mt-1 text-lg font-bold text-slate-500">{p.role}.</p>
            <p className="mt-4 text-base font-black text-[#8B4EC4]">For a website, that's:</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {WEB_TERMS.map((t) => {
                const wrong = pick === t && t !== p.answer;
                const right = correct && t === p.answer;
                return (
                  <button key={t} onClick={() => choose(t)} disabled={correct} className={`rounded-2xl border-2 px-3 py-3 text-base font-black transition active:scale-95 ${wrong ? "border-red-200 bg-red-50 text-red-500" : right ? "border-emerald-400 bg-emerald-100 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-[#8B4EC4] hover:bg-[#faf5ff]"}`}>{t}</button>
                );
              })}
            </div>
            {pick !== null && !correct && <p className="mt-3 text-center text-base font-bold text-red-500">Close — picture what that part does for the house.</p>}
            {correct && (
              <div className="mt-4 rounded-2xl bg-[#E4F9E4] px-4 py-3 text-center">
                <p className="text-lg font-black text-[#15803d]">{p.why}</p>
                <button onClick={next} className="mt-3 rounded-full bg-[#8B4EC4] px-10 py-3 text-base font-black text-white shadow-md transition active:scale-95 hover:bg-[#7a41b0]">{idx + 1 >= PAIRS.length ? "Finish" : "Next"}</button>
              </div>
            )}
          </div>
        </>
      )}

      {done && (
        <div style={{ animation: "haPop 0.4s ease both" }} className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 px-5 py-5 text-center">
          <p className="text-xl font-black text-slate-800">Domain, hosting, server, database, internet, frontend.</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">Those six parts turn your code into a real, visitable website.</p>
        </div>
      )}
      {done && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
      <style>{`@keyframes haPop { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} } @media (prefers-reduced-motion: reduce){[style*="haPop"]{animation:none!important;}}`}</style>
    </div>
  );
};
