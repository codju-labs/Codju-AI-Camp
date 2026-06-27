import{j as e}from"./jsx-runtime.u17CrQMm.js";import{a as l}from"./index.CnSl4F02.js";import{u as b}from"./index.C8CKIXFJ.js";import{c as g,b as f}from"./lessonStore.BXpcjsP5.js";import{F as w}from"./FeedbackBar.DxJxeXvd.js";const y={title:"Space Snack Dash",player:"a tiny astronaut collecting snacks",goal:"collect 20 snacks before the timer ends",controls:"arrow keys or WASD to move",obstacles:"floating asteroids and a 60 second timer",style:"bright, playful, arcade style with simple animations",win:"show a win screen with score and a Play Again button"},N=({sectionIndex:a,explanation:c})=>{const d=b(g),[s,p]=l.useState(y),[m,n]=l.useState(!1),i=l.useMemo(()=>`Build a browser game called "${s.title}".

Game idea:
The player controls ${s.player}. The goal is to ${s.goal}.

Controls:
Use ${s.controls}.

Rules and challenge:
Add ${s.obstacles}. Make the game easy to understand in the first 5 seconds.

Visual style:
Use a ${s.style}. Keep the layout responsive so it works on laptop and tablet screens.

Game states:
Include a start screen, the main gameplay screen, a score display, ${s.win}, and a restart flow.

Implementation:
Create a plain HTML, CSS, and JavaScript project. Output exactly these files:
1. index.html
2. styles.css
3. script.js

Do not use React, Tailwind CSS, external frameworks, package managers, build tools, or image assets. The game should run by opening index.html in a browser. Add comments only where the logic is tricky. Use simple shapes or CSS sprites so the game works without downloading anything.`,[s]),u=d.has(a),h=(t,o)=>{p(r=>({...r,[t]:o}))},x=async()=>{await navigator.clipboard?.writeText(i).catch(()=>{}),n(!0),f(a,!1),setTimeout(()=>n(!1),1800)};return e.jsxs("div",{className:"space-y-5",children:[e.jsx("div",{className:"grid gap-4 md:grid-cols-2",children:Object.entries(s).map(([t,o])=>e.jsxs("label",{className:"block",children:[e.jsx("span",{className:"mb-1.5 block text-sm font-black capitalize text-slate-700",children:t}),e.jsx("textarea",{value:o,rows:t==="title"?1:2,onChange:r=>h(t,r.target.value),className:"w-full resize-y rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#8B4EC4] focus:ring-2 focus:ring-purple-200"})]},t))}),e.jsxs("div",{className:"rounded-3xl border-2 border-purple-100 bg-white p-5 shadow-sm",children:[e.jsxs("div",{className:"mb-3 flex flex-wrap items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-black uppercase tracking-widest text-purple-500",children:"AI game prompt"}),e.jsx("h3",{className:"text-xl font-black text-slate-800",children:"Ready for an HTML game build"})]}),!u&&e.jsx("button",{onClick:x,className:"rounded-full bg-[#8B4EC4] px-5 py-2 text-sm font-black text-white transition hover:bg-[#7a41b0] active:scale-95",children:m?"Copied":"Copy prompt"})]}),e.jsx("pre",{className:"max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm font-semibold leading-relaxed text-slate-100",children:i})]}),e.jsx(w,{sectionIndex:a,explanation:c})]})};export{N as GamePromptBuilder,N as default};
