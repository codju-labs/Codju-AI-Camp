import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ProductBuilder - a guided tool that walks students through the
 * DPAA framework (Discover · Plan · Apply · Assess) and auto-generates a
 * detailed prompt for AI website builders (Lovable / v0). Self-contained React
 * island, persisted to localStorage. Mounted by src/pages/learn/product-builder.astro.
 */

const STORAGE_KEY = "codju-product-builder-v1";

const PURPLE = "#8B4EC4";

// ---------- data model ----------

type Priority = "Must Have" | "Nice to Have";

interface Feature {
  name: string;
  desc: string;
  priority: Priority;
}

interface ScreenSpec {
  name: string;
  purpose: string;
  elements: string[];
}

interface ProductData {
  team: {
    teamName: string;
    students: string;
    grade: string;
    school: string;
    projectName: string;
  };
  discover: {
    problem: string;
    whoFaces: string[];
    importance: string;
    difficulties: string;
    currentSolutions: string;
    limitations: string;
  };
  plan: {
    appName: string;
    oneLiner: string;
    goals: string;
    targetUsers: string[];
    features: Feature[];
    inputs: string[];
    outputs: string[];
  };
  apply: {
    screens: ScreenSpec[];
    colorTheme: string;
    designStyle: string;
    mobileFriendly: boolean;
    usesAI: boolean;
    aiHelp: string;
  };
  assess: {
    whyUse: string;
    unique: string;
    challenges: string;
    futureImprovements: string;
    wouldPay: boolean;
    payHow: string[];
  };
}

const blank: ProductData = {
  team: { teamName: "", students: "", grade: "", school: "", projectName: "" },
  discover: { problem: "", whoFaces: [], importance: "", difficulties: "", currentSolutions: "", limitations: "" },
  plan: { appName: "", oneLiner: "", goals: "", targetUsers: [], features: [], inputs: [], outputs: [] },
  apply: { screens: [], colorTheme: "Blue", designStyle: "Modern", mobileFriendly: true, usesAI: true, aiHelp: "" },
  assess: { whyUse: "", unique: "", challenges: "", futureImprovements: "", wouldPay: false, payHow: [] },
};

const USER_GROUPS = ["Students", "Parents", "Families", "Tourists", "Teachers", "Senior Citizens", "Everyone", "Other"];
const COLOR_THEMES = ["Blue", "Green", "Purple", "Dark Mode", "Custom"];
const DESIGN_STYLES = ["Modern", "Minimal", "Playful", "Professional", "Futuristic", "Educational"];
const PAY_OPTIONS = ["Subscription", "Ads", "One-time Purchase", "Freemium"];
const ELEMENT_OPTIONS = ["Buttons", "Images", "Cards", "Maps", "Forms", "Tables", "Chatbot", "Charts", "Calendar", "Search Bar"];

// ---------- step config ----------

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "team", label: "Team" },
  { key: "discover", label: "Discover", phase: true, color: "#E2484E" },
  { key: "plan", label: "Plan", phase: true, color: "#3B82C4" },
  { key: "apply", label: "Apply", phase: true, color: "#8B4EC4" },
  { key: "assess", label: "Assess", phase: true, color: "#2FA84F" },
  { key: "spec", label: "Spec" },
  { key: "prompt", label: "Prompt" },
] as const;

// ---------- small reusable bits ----------

const headingFont = { fontFamily: "'M PLUS Rounded 1c', system-ui, sans-serif" };

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-extrabold text-slate-800">{label}</span>
      {hint && <span className="mb-2 block text-sm font-bold text-slate-400">{hint}</span>}
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:ring-2 focus:ring-[#8B4EC4]/20";

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={props.rows ?? 3} className={inputCls + " resize-y"} />;
}

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (o: string) => (value.includes(o) ? onChange(value.filter((x) => x !== o)) : onChange([...value, o]));
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold transition active:scale-95 ${
              on ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4]"
            }`}
          >
            {on ? "✓ " : ""}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function TagList({ items, onAdd, onRemove, placeholder }: { items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = draft.trim();
    if (v) {
      onAdd(v);
      setDraft("");
    }
  };
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <input
          className={inputCls}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <button type="button" onClick={commit} className="shrink-0 rounded-2xl bg-[#8B4EC4] px-5 py-3 text-base font-black text-white transition hover:bg-[#7a41b0] active:scale-95">
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-extrabold text-emerald-700">
            {it}
            <button type="button" onClick={() => onRemove(i)} className="text-emerald-400 hover:text-emerald-700">
              ✕
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-sm font-bold text-slate-300">Nothing added yet.</span>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-full border-2 border-slate-200 bg-slate-50 p-1">
      {[true, false].map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-6 py-1.5 text-sm font-black transition ${value === v ? "bg-[#8B4EC4] text-white shadow" : "text-slate-500"}`}
        >
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm sm:p-7">{children}</div>;
}

// ---------- prompt builder ----------

function buildPrompt(d: ProductData): string {
  const name = d.plan.appName || d.team.projectName || "My App";
  const style = [d.apply.designStyle, d.apply.mobileFriendly ? "mobile-first" : "desktop-first", `${d.apply.colorTheme} theme`]
    .filter(Boolean)
    .join(", ")
    .toLowerCase();
  const features = d.plan.features.length
    ? d.plan.features.map((f, i) => `${i + 1}. ${f.name}${f.desc ? ` — ${f.desc}` : ""} (${f.priority})`).join("\n")
    : "1. (add your features)";
  const screens = d.apply.screens.length
    ? d.apply.screens
        .map((s, i) => `${i + 1}. ${s.name}${s.purpose ? ` — ${s.purpose}` : ""}${s.elements.length ? ` [${s.elements.join(", ")}]` : ""}`)
        .join("\n")
    : "1. Home Page\n2. Main Form\n3. Results / Dashboard";
  const users = d.plan.targetUsers.length ? d.plan.targetUsers.join(", ") : d.discover.whoFaces.join(", ") || "general users";

  let p = `Build a ${style} web application called ${name}.\n\n`;
  p += `Purpose:\n${d.plan.oneLiner || d.discover.problem || "Solve a real problem for users."}\n\n`;
  if (d.discover.problem) p += `Problem it solves:\n${d.discover.problem}\n\n`;
  p += `Target Users:\n${users}.\n\n`;
  if (d.plan.goals) p += `Goals:\n${d.plan.goals}\n\n`;
  p += `Core Features:\n${features}\n\n`;
  p += `Required Pages:\n${screens}\n\n`;
  p += `Design Style:\n${d.apply.designStyle}, ${d.apply.colorTheme} color theme, ${d.apply.mobileFriendly ? "mobile-first responsive" : "desktop-first"}.\n\n`;
  if (d.plan.inputs.length) p += `Inputs (what users enter):\n${d.plan.inputs.join(", ")}.\n\n`;
  if (d.plan.outputs.length) p += `Outputs (what the app generates):\n${d.plan.outputs.join(", ")}.\n\n`;
  if (d.apply.usesAI && d.apply.aiHelp) p += `AI Features:\n${d.apply.aiHelp}\n\n`;
  if (d.assess.unique) p += `What makes it unique:\n${d.assess.unique}\n\n`;
  p += `Use React + Tailwind CSS with cards, charts, icons, and clean responsive layouts. Include realistic sample data and a beautiful, polished UI.`;
  return p;
}

// ---------- main component ----------

export const ProductBuilder: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<ProductData>(blank);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // load
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...blank, ...parsed, team: { ...blank.team, ...parsed.team }, discover: { ...blank.discover, ...parsed.discover }, plan: { ...blank.plan, ...parsed.plan }, apply: { ...blank.apply, ...parsed.apply }, assess: { ...blank.assess, ...parsed.assess } });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // save
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const step = STEPS[stepIdx];
  const phaseSteps = STEPS.filter((s) => "phase" in s && s.phase);
  const prompt = useMemo(() => buildPrompt(data), [data]);

  const go = (i: number) => {
    setStepIdx(Math.max(0, Math.min(STEPS.length - 1, i)));
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 10);
  };
  const next = () => go(stepIdx + 1);
  const back = () => go(stepIdx - 1);

  // typed updaters
  const upd = <K extends keyof ProductData>(section: K, patch: Partial<ProductData[K]>) =>
    setData((d) => ({ ...d, [section]: { ...d[section], ...patch } }));

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const resetAll = () => {
    if (!window.confirm("Start a brand new project? This clears your current answers.")) return;
    setData(blank);
    go(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf5ff] via-white to-[#f0fdf4] px-4 py-6 sm:px-6">
      <div ref={topRef} />
      <div className="mx-auto max-w-3xl">
        {/* header / stepper */}
        {stepIdx > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={() => go(0)} className="flex items-center gap-2 text-base font-black text-[#8B4EC4]">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#8B4EC4] text-white">🚀</span>
                AI Product Builder
              </button>
              <button onClick={resetAll} className="text-sm font-extrabold text-slate-400 hover:text-red-500">
                Start over
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              {phaseSteps.map((p) => {
                const idx = STEPS.findIndex((s) => s.key === p.key);
                const done = stepIdx > idx;
                const active = stepIdx === idx;
                const color = (p as { color: string }).color;
                return (
                  <button key={p.key} onClick={() => go(idx)} className="flex-1 text-left">
                    <div className="h-2 rounded-full transition-all" style={{ background: done || active ? color : "#e7e5ef" }} />
                    <span className="mt-1 block text-xs font-black" style={{ color: done || active ? color : "#b8b5c5" }}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- WELCOME ---- */}
        {step.key === "welcome" && (
          <div className="flex min-h-[88vh] flex-col items-center justify-center py-10 text-center" style={{ animation: "pbFade .4s ease both" }}>
            <div className="relative mb-7">
              <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#8B4EC4] to-indigo-500 opacity-20 blur-xl" />
              <div className="relative grid h-28 w-28 place-items-center rounded-[1.75rem] bg-gradient-to-br from-[#8B4EC4] to-indigo-600 text-6xl shadow-xl" style={{ animation: "pbBob 3s ease-in-out infinite" }}>
                🚀
              </div>
            </div>
            <h1 className="text-4xl font-black leading-tight text-slate-800 sm:text-6xl" style={headingFont}>
              Build Your Dream App<br className="hidden sm:block" /> with{" "}
              <span className="bg-gradient-to-r from-[#8B4EC4] to-indigo-600 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg font-bold text-slate-500 sm:text-xl">Turn your idea into a real app prompt — just answer a few questions and we'll do the rest.</p>

            <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: "Discover", e: "🔍", d: "Find the problem", c: "#E2484E" },
                { k: "Plan", e: "🗺️", d: "Design the fix", c: "#3B82C4" },
                { k: "Apply", e: "🎨", d: "Make it look great", c: "#8B4EC4" },
                { k: "Assess", e: "📈", d: "Check your idea", c: "#2FA84F" },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className="rounded-2xl border-2 border-slate-100 bg-white/80 p-4 text-left shadow-sm backdrop-blur"
                  style={{ animation: `pbRise .5s ease both`, animationDelay: `${0.1 + i * 0.08}s` }}
                >
                  <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: `${s.c}1a` }}>
                    {s.e}
                  </div>
                  <p className="text-base font-black" style={{ color: s.c }}>{s.k}</p>
                  <p className="text-sm font-bold text-slate-400">{s.d}</p>
                </div>
              ))}
            </div>

            <button
              onClick={next}
              className="mt-10 rounded-full bg-gradient-to-r from-[#8B4EC4] to-indigo-600 px-16 py-4 text-xl font-black text-white shadow-lg shadow-purple-300/50 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              Start Project →
            </button>
            <p className="mt-4 text-sm font-bold text-slate-400">Takes about 10 minutes · Your work saves automatically</p>
            <style>{`@keyframes pbBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes pbRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[style*="pbBob"],[style*="pbRise"]{animation:none!important}}`}</style>
          </div>
        )}

        {/* ---- TEAM ---- */}
        {step.key === "team" && (
          <Step title="Your Team" emoji="🧑‍🚀" blurb="Tell us who's building this app.">
            <SectionCard>
              <Field label="Team Name">
                <TextInput value={data.team.teamName} onChange={(e) => upd("team", { teamName: e.target.value })} placeholder="The Trailblazers" />
              </Field>
              <Field label="Student Names" hint="Separate names with commas">
                <TextInput value={data.team.students} onChange={(e) => upd("team", { students: e.target.value })} placeholder="Aanya, Vihaan, Sara" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Grade">
                  <TextInput value={data.team.grade} onChange={(e) => upd("team", { grade: e.target.value })} placeholder="Grade 7" />
                </Field>
                <Field label="School (optional)">
                  <TextInput value={data.team.school} onChange={(e) => upd("team", { school: e.target.value })} placeholder="Codju Public School" />
                </Field>
              </div>
              <Field label="Project Name">
                <TextInput value={data.team.projectName} onChange={(e) => upd("team", { projectName: e.target.value })} placeholder="TravelGenie" />
              </Field>
            </SectionCard>
            <NavRow onBack={back} onNext={next} nextLabel="Proceed to Discover" />
          </Step>
        )}

        {/* ---- DISCOVER ---- */}
        {step.key === "discover" && (
          <Step title="Discover" emoji="🔍" color="#E2484E" blurb="Discover means understanding the problem deeply.">
            <SectionCard>
              <Field label="What problem are you trying to solve?">
                <TextArea value={data.discover.problem} onChange={(e) => upd("discover", { problem: e.target.value })} placeholder="Families find it difficult to plan trips within a budget." />
              </Field>
              <Field label="Who faces this problem?">
                <Chips options={USER_GROUPS} value={data.discover.whoFaces} onChange={(v) => upd("discover", { whoFaces: v })} />
              </Field>
              <Field label="Why is this problem important?">
                <TextArea value={data.discover.importance} onChange={(e) => upd("discover", { importance: e.target.value })} />
              </Field>
              <Field label="What difficulties do users currently face?">
                <TextArea value={data.discover.difficulties} onChange={(e) => upd("discover", { difficulties: e.target.value })} />
              </Field>
              <Field label="How do people solve this problem today?">
                <TextArea value={data.discover.currentSolutions} onChange={(e) => upd("discover", { currentSolutions: e.target.value })} />
              </Field>
              <Field label="What limitations exist in current solutions?">
                <TextArea value={data.discover.limitations} onChange={(e) => upd("discover", { limitations: e.target.value })} />
              </Field>
            </SectionCard>
            <NavRow onBack={back} onNext={next} nextLabel="Proceed to Plan" />
          </Step>
        )}

        {/* ---- PLAN ---- */}
        {step.key === "plan" && (
          <Step title="Plan" emoji="🗺️" color="#3B82C4" blurb="Plan means designing your solution.">
            <SectionCard>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="What is the name of your app?">
                  <TextInput value={data.plan.appName} onChange={(e) => upd("plan", { appName: e.target.value })} placeholder="TravelGenie AI" />
                </Field>
                <Field label="Describe it in one sentence.">
                  <TextInput value={data.plan.oneLiner} onChange={(e) => upd("plan", { oneLiner: e.target.value })} placeholder="Helps families plan budget trips." />
                </Field>
              </div>
              <Field label="What are the main goals of your app?">
                <TextArea value={data.plan.goals} onChange={(e) => upd("plan", { goals: e.target.value })} />
              </Field>
              <Field label="Who are your target users?">
                <Chips options={USER_GROUPS} value={data.plan.targetUsers} onChange={(v) => upd("plan", { targetUsers: v })} />
              </Field>
            </SectionCard>

            <SectionCard>
              <div>
                <p className="text-lg font-black text-slate-800" style={headingFont}>Top features</p>
                <p className="text-sm font-bold text-slate-400">Add the things your app can do.</p>
              </div>
              <FeatureEditor features={data.plan.features} onChange={(features) => upd("plan", { features })} />
            </SectionCard>

            <SectionCard>
              <Field label="What information should users enter?" hint="e.g. Destination, Budget, Travel Dates">
                <TagList items={data.plan.inputs} placeholder="Add an input…" onAdd={(v) => upd("plan", { inputs: [...data.plan.inputs, v] })} onRemove={(i) => upd("plan", { inputs: data.plan.inputs.filter((_, x) => x !== i) })} />
              </Field>
              <Field label="What output should the app generate?" hint="e.g. Trip itinerary, Budget estimate">
                <TagList items={data.plan.outputs} placeholder="Add an output…" onAdd={(v) => upd("plan", { outputs: [...data.plan.outputs, v] })} onRemove={(i) => upd("plan", { outputs: data.plan.outputs.filter((_, x) => x !== i) })} />
              </Field>
            </SectionCard>
            <NavRow onBack={back} onNext={next} nextLabel="Proceed to Apply" />
          </Step>
        )}

        {/* ---- APPLY ---- */}
        {step.key === "apply" && (
          <Step title="Apply" emoji="🎨" color="#8B4EC4" blurb="Apply means designing how it looks and works.">
            <SectionCard>
              <div>
                <p className="text-lg font-black text-slate-800" style={headingFont}>Pages / screens</p>
                <p className="text-sm font-bold text-slate-400">What screens should your app have?</p>
              </div>
              <ScreenEditor screens={data.apply.screens} onChange={(screens) => upd("apply", { screens })} />
            </SectionCard>

            <SectionCard>
              <Field label="Colour theme">
                <div className="flex flex-wrap gap-2">
                  {COLOR_THEMES.map((c) => (
                    <button key={c} type="button" onClick={() => upd("apply", { colorTheme: c })} className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold transition active:scale-95 ${data.apply.colorTheme === c ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Design style">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DESIGN_STYLES.map((s) => (
                    <button key={s} type="button" onClick={() => upd("apply", { designStyle: s })} className={`rounded-2xl border-2 px-4 py-3 text-base font-black transition active:scale-95 ${data.apply.designStyle === s ? "border-[#8B4EC4] bg-[#faf5ff] text-[#6b21a8]" : "border-slate-200 bg-white text-slate-600 hover:border-[#8B4EC4]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Field label="Mobile-friendly?">
                  <Toggle value={data.apply.mobileFriendly} onChange={(v) => upd("apply", { mobileFriendly: v })} />
                </Field>
                <Field label="Should the app use AI?">
                  <Toggle value={data.apply.usesAI} onChange={(v) => upd("apply", { usesAI: v })} />
                </Field>
              </div>
              {data.apply.usesAI && (
                <Field label="How should AI help users?">
                  <TextArea value={data.apply.aiHelp} onChange={(e) => upd("apply", { aiHelp: e.target.value })} placeholder="AI suggests a day-wise itinerary based on budget and interests." />
                </Field>
              )}
            </SectionCard>
            <NavRow onBack={back} onNext={next} nextLabel="Proceed to Assess" />
          </Step>
        )}

        {/* ---- ASSESS ---- */}
        {step.key === "assess" && (
          <Step title="Assess" emoji="📈" color="#2FA84F" blurb="Assess means evaluating your idea.">
            <SectionCard>
              <Field label="Why will people use your app?">
                <TextArea value={data.assess.whyUse} onChange={(e) => upd("assess", { whyUse: e.target.value })} />
              </Field>
              <Field label="What makes your app unique?">
                <TextArea value={data.assess.unique} onChange={(e) => upd("assess", { unique: e.target.value })} />
              </Field>
              <Field label="What challenges might occur?">
                <TextArea value={data.assess.challenges} onChange={(e) => upd("assess", { challenges: e.target.value })} />
              </Field>
              <Field label="How can the app be improved in future?">
                <TextArea value={data.assess.futureImprovements} onChange={(e) => upd("assess", { futureImprovements: e.target.value })} />
              </Field>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Field label="Would people pay for this app?">
                  <Toggle value={data.assess.wouldPay} onChange={(v) => upd("assess", { wouldPay: v })} />
                </Field>
              </div>
              {data.assess.wouldPay && (
                <Field label="How?">
                  <Chips options={PAY_OPTIONS} value={data.assess.payHow} onChange={(v) => upd("assess", { payHow: v })} />
                </Field>
              )}
            </SectionCard>
            <NavRow onBack={back} onNext={next} nextLabel="See my Product Spec ✨" />
          </Step>
        )}

        {/* ---- SPEC ---- */}
        {step.key === "spec" && <SpecSheet data={data} onBack={back} onNext={next} onEdit={(i) => go(i)} />}

        {/* ---- PROMPT ---- */}
        {step.key === "prompt" && (
          <Step title="Your AI Prompt" emoji="✨" blurb="Copy this into Lovable or v0 to build your app.">
            <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-5 shadow-lg">
              <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed text-emerald-100">{prompt}</pre>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button onClick={copyPrompt} className="rounded-2xl bg-[#8B4EC4] px-4 py-3 text-base font-black text-white transition hover:bg-[#7a41b0] active:scale-95">
                {copied ? "Copied! ✓" : "Copy Prompt"}
              </button>
              <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-base font-black text-slate-700 transition hover:border-[#8B4EC4]">
                Open Lovable ↗
              </a>
              <a href="https://v0.dev" target="_blank" rel="noreferrer" className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-center text-base font-black text-slate-700 transition hover:border-[#8B4EC4]">
                Open v0 ↗
              </a>
              <button onClick={() => downloadText(`${(data.plan.appName || "app").replace(/\s+/g, "-").toLowerCase()}-prompt.txt`, prompt)} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-700 transition hover:border-[#8B4EC4]">
                Download
              </button>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={back} className="text-base font-black text-slate-400 hover:text-slate-700">← Back to Spec</button>
              <button onClick={() => window.print()} className="text-base font-black text-[#8B4EC4]">Print / Save PDF</button>
            </div>
          </Step>
        )}
      </div>
    </div>
  );
};

// ---------- step shell ----------

function Step({ title, emoji, blurb, color, children }: { title: string; emoji: string; blurb: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5" style={{ animation: "pbFade .35s ease both" }}>
      <div>
        <h2 className="flex items-center gap-3 text-3xl font-black text-slate-800" style={headingFont}>
          <span>{emoji}</span>
          <span style={color ? { color } : undefined}>{title}</span>
        </h2>
        <p className="mt-1 text-lg font-bold text-slate-500">{blurb}</p>
      </div>
      {children}
      <style>{`@keyframes pbFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){[style*="pbFade"]{animation:none!important}}`}</style>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel }: { onBack: () => void; onNext: () => void; nextLabel: string }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <button onClick={onBack} className="rounded-full px-5 py-3 text-base font-black text-slate-400 transition hover:text-slate-700">
        ← Back
      </button>
      <button onClick={onNext} className="rounded-full bg-[#8B4EC4] px-8 py-3.5 text-base font-black text-white shadow-md transition hover:bg-[#7a41b0] active:scale-95">
        {nextLabel}
      </button>
    </div>
  );
}

// ---------- feature editor ----------

function FeatureEditor({ features, onChange }: { features: Feature[]; onChange: (f: Feature[]) => void }) {
  const add = () => onChange([...features, { name: "", desc: "", priority: "Must Have" }]);
  const set = (i: number, patch: Partial<Feature>) => onChange(features.map((f, x) => (x === i ? { ...f, ...patch } : f)));
  const del = (i: number) => onChange(features.filter((_, x) => x !== i));
  return (
    <div className="space-y-3">
      {features.map((f, i) => (
        <div key={i} className="rounded-2xl border-2 border-slate-100 bg-slate-50/60 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8B4EC4] text-sm font-black text-white">{i + 1}</span>
            <input className={inputCls + " flex-1"} value={f.name} placeholder="Feature name" onChange={(e) => set(i, { name: e.target.value })} />
            <button onClick={() => del(i)} className="px-2 text-lg text-slate-300 hover:text-red-500">✕</button>
          </div>
          <input className={inputCls + " mb-2"} value={f.desc} placeholder="Short description (optional)" onChange={(e) => set(i, { desc: e.target.value })} />
          <div className="flex gap-2">
            {(["Must Have", "Nice to Have"] as Priority[]).map((p) => (
              <button key={p} onClick={() => set(i, { priority: p })} className={`rounded-full border-2 px-3 py-1.5 text-xs font-black transition ${f.priority === p ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={add} className="w-full rounded-2xl border-2 border-dashed border-[#8B4EC4]/40 bg-[#faf5ff] py-3 text-base font-black text-[#8B4EC4] transition hover:bg-[#f3e8ff]">
        + Add Feature
      </button>
    </div>
  );
}

// ---------- screen editor ----------

function ScreenEditor({ screens, onChange }: { screens: ScreenSpec[]; onChange: (s: ScreenSpec[]) => void }) {
  const add = () => onChange([...screens, { name: "", purpose: "", elements: [] }]);
  const set = (i: number, patch: Partial<ScreenSpec>) => onChange(screens.map((s, x) => (x === i ? { ...s, ...patch } : s)));
  const del = (i: number) => onChange(screens.filter((_, x) => x !== i));
  return (
    <div className="space-y-3">
      {screens.map((s, i) => (
        <div key={i} className="rounded-2xl border-2 border-slate-100 bg-slate-50/60 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#8B4EC4] text-sm font-black text-white">{i + 1}</span>
            <input className={inputCls + " flex-1"} value={s.name} placeholder="Screen name (e.g. Home Page)" onChange={(e) => set(i, { name: e.target.value })} />
            <button onClick={() => del(i)} className="px-2 text-lg text-slate-300 hover:text-red-500">✕</button>
          </div>
          <input className={inputCls + " mb-2"} value={s.purpose} placeholder="Purpose (optional)" onChange={(e) => set(i, { purpose: e.target.value })} />
          <Chips options={ELEMENT_OPTIONS} value={s.elements} onChange={(elements) => set(i, { elements })} />
        </div>
      ))}
      <button onClick={add} className="w-full rounded-2xl border-2 border-dashed border-[#8B4EC4]/40 bg-[#faf5ff] py-3 text-base font-black text-[#8B4EC4] transition hover:bg-[#f3e8ff]">
        + Add Screen
      </button>
    </div>
  );
}

// ---------- spec sheet ----------

function SpecSheet({ data, onBack, onNext, onEdit }: { data: ProductData; onBack: () => void; onNext: () => void; onEdit: (i: number) => void }) {
  const idxOf = (key: string) => STEPS.findIndex((s) => s.key === key);
  const rows: { title: string; editStep: string; body: React.ReactNode }[] = [
    { title: "Problem", editStep: "discover", body: data.discover.problem || "—" },
    { title: "Users", editStep: "plan", body: (data.plan.targetUsers.length ? data.plan.targetUsers : data.discover.whoFaces).join(", ") || "—" },
    { title: "Solution", editStep: "plan", body: data.plan.oneLiner || "—" },
    {
      title: "Features",
      editStep: "plan",
      body: data.plan.features.length ? (
        <ul className="space-y-1">
          {data.plan.features.map((f, i) => (
            <li key={i}>
              <b>{f.name}</b> {f.desc && <span className="text-slate-500">— {f.desc}</span>} <span className="text-xs font-black text-emerald-600">({f.priority})</span>
            </li>
          ))}
        </ul>
      ) : (
        "—"
      ),
    },
    { title: "Inputs", editStep: "plan", body: data.plan.inputs.join(", ") || "—" },
    { title: "Outputs", editStep: "plan", body: data.plan.outputs.join(", ") || "—" },
    {
      title: "Screens",
      editStep: "apply",
      body: data.apply.screens.length ? (
        <ul className="space-y-1">
          {data.apply.screens.map((s, i) => (
            <li key={i}>
              <b>{s.name}</b> {s.purpose && <span className="text-slate-500">— {s.purpose}</span>} {s.elements.length > 0 && <span className="text-xs font-bold text-slate-400">[{s.elements.join(", ")}]</span>}
            </li>
          ))}
        </ul>
      ) : (
        "—"
      ),
    },
    { title: "Design Style", editStep: "apply", body: `${data.apply.designStyle} · ${data.apply.colorTheme} · ${data.apply.mobileFriendly ? "Mobile-friendly" : "Desktop"}` },
    { title: "AI Features", editStep: "apply", body: data.apply.usesAI ? data.apply.aiHelp || "Uses AI" : "No AI" },
    { title: "Future Improvements", editStep: "assess", body: data.assess.futureImprovements || "—" },
  ];

  return (
    <Step title="Product Specification" emoji="📋" blurb="Review your plan. Tap any section to edit it.">
      <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#8B4EC4] to-indigo-600 px-6 py-6 text-white">
          <p className="text-sm font-black uppercase tracking-widest text-indigo-100">{data.team.teamName || "Your Team"}</p>
          <p className="text-3xl font-black" style={headingFont}>{data.plan.appName || data.team.projectName || "My App"}</p>
          {data.team.students && <p className="mt-1 text-sm font-bold text-indigo-100">{data.team.students}{data.team.grade ? ` · ${data.team.grade}` : ""}</p>}
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <button key={r.title} onClick={() => onEdit(idxOf(r.editStep))} className="group block w-full px-6 py-4 text-left transition hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{r.title}</p>
                <span className="text-xs font-black text-[#8B4EC4] opacity-0 transition group-hover:opacity-100">Edit ✎</span>
              </div>
              <div className="mt-1 text-base font-bold text-slate-700">{r.body}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <button onClick={onBack} className="rounded-full px-5 py-3 text-base font-black text-slate-400 transition hover:text-slate-700">← Back</button>
        <button onClick={onNext} className="rounded-full bg-gradient-to-r from-[#8B4EC4] to-indigo-600 px-8 py-3.5 text-base font-black text-white shadow-md transition active:scale-95">
          Generate AI Prompt ✨
        </button>
      </div>
    </Step>
  );
}

// ---------- util ----------

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default ProductBuilder;
