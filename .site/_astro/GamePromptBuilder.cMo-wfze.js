import{j as e}from"./jsx-runtime.u17CrQMm.js";import{a as l}from"./index.CnSl4F02.js";import{u as b}from"./index.C8CKIXFJ.js";import{c as f,b as g}from"./lessonStore.BXpcjsP5.js";import{F as w}from"./FeedbackBar.DxJxeXvd.js";const y={title:"Space Snack Dash",player:"a tiny astronaut collecting snacks",goal:"collect 20 snacks before the timer ends",controls:"arrow keys or WASD to move",obstacles:"floating asteroids and a 60 second timer",style:"bright, playful, arcade style with simple animations",win:"show a win screen with score and a Play Again button"},$=({sectionIndex:a,explanation:c})=>{const d=b(f),[t,p]=l.useState(y),[m,i]=l.useState(!1),n=l.useMemo(()=>`Build a browser game called "${t.title}".

Game idea:
The player controls ${t.player}. The goal is to ${t.goal}.

Controls:
Use ${t.controls}.

Rules and challenge:
Add ${t.obstacles}. Make the game easy to understand in the first 5 seconds.

Visual style:
Use a ${t.style}. Keep the layout responsive so it works on laptop and tablet screens.

Game states:
Include a start screen, the main gameplay screen, a score display, ${t.win}, and a restart flow.

Implementation:
Create the game in a format that I can preview and play directly in a browser using the preview feature of tools like ChatGPT, Gemini, Lovable, or v0. Keep it self-contained and easy to test. Add comments only where the logic is tricky. Use simple shapes or built-in browser-friendly visuals so the game works without needing extra assets.`,[t]),u=d.has(a),h=(s,o)=>{p(r=>({...r,[s]:o}))},x=async()=>{await navigator.clipboard?.writeText(n).catch(()=>{}),i(!0),g(a,!1),setTimeout(()=>i(!1),1800)};return e.jsxs("div",{className:"space-y-5",children:[e.jsx("div",{className:"grid gap-4 md:grid-cols-2",children:Object.entries(t).map(([s,o])=>e.jsxs("label",{className:"block",children:[e.jsx("span",{className:"mb-1.5 block text-sm font-black capitalize text-slate-700",children:s}),e.jsx("textarea",{value:o,rows:s==="title"?1:2,onChange:r=>h(s,r.target.value),className:"w-full resize-y rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:ring-2 focus:ring-purple-200"})]},s))}),e.jsxs("div",{className:"rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-sm",children:[e.jsxs("div",{className:"mb-3 flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-black uppercase tracking-widest text-purple-500",children:"AI game prompt"}),e.jsx("h3",{className:"text-xl font-black text-slate-800",children:"Ready for an HTML game build"})]}),!u&&e.jsx("button",{onClick:x,className:"rounded-full bg-[#8B4EC4] px-5 py-2 text-sm font-black text-white transition hover:bg-[#7a41b0] active:scale-95",children:m?"Copied":"Copy prompt"})]}),e.jsx("pre",{className:"max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm font-semibold leading-relaxed text-slate-100",children:n})]}),e.jsx(w,{sectionIndex:a,explanation:c})]})};export{$ as GamePromptBuilder,$ as default};
