import React, { useState } from "react";
import { useStore } from "@nanostores/react";
import { completedIndices, completeSection } from "../learning/lessonStore";
import { FeedbackBar } from "./FeedbackBar";

/**
 * ProjectDeck — AI Creator Camp Day 2. A deck of small, real projects kids
 * make on the actual web tools (Gemini, Canva, Suno). Each card: what you'll
 * make, an Open-tool button, a copy-paste prompt, quick steps, and a
 * Mark-done toggle. The section completes once every project is marked done.
 */

type DeckId = "pictures" | "design" | "music" | "notes" | "quiz" | "present" | "plan" | "scratch" | "website";

interface Props {
  sectionIndex: number;
  explanation?: string;
  deck: DeckId;
}

interface ToolMeta {
  name: string;
  url: string;
  tileBg: string;
  accent: string;
  frontBg: string;
  border: string;
  btn: string;
  initial: string;
}

const TOOLS: Record<string, ToolMeta> = {
  gemini: {
    name: "Gemini",
    url: "https://gemini.google.com",
    tileBg: "bg-blue-500",
    accent: "text-blue-700",
    frontBg: "bg-blue-50",
    border: "border-blue-200",
    btn: "bg-blue-600 hover:bg-blue-700",
    initial: "G",
  },
  canva: {
    name: "Canva",
    url: "https://www.canva.com",
    tileBg: "bg-cyan-500",
    accent: "text-cyan-700",
    frontBg: "bg-cyan-50",
    border: "border-cyan-200",
    btn: "bg-cyan-600 hover:bg-cyan-700",
    initial: "Cv",
  },
  suno: {
    name: "Suno",
    url: "https://suno.com",
    tileBg: "bg-amber-500",
    accent: "text-amber-700",
    frontBg: "bg-amber-50",
    border: "border-amber-200",
    btn: "bg-amber-600 hover:bg-amber-700",
    initial: "Su",
  },
  notebooklm: {
    name: "NotebookLM",
    url: "https://notebooklm.google.com",
    tileBg: "bg-indigo-500",
    accent: "text-indigo-700",
    frontBg: "bg-indigo-50",
    border: "border-indigo-200",
    btn: "bg-indigo-600 hover:bg-indigo-700",
    initial: "Nb",
  },
  gamma: {
    name: "Gamma",
    url: "https://gamma.app",
    tileBg: "bg-fuchsia-500",
    accent: "text-fuchsia-700",
    frontBg: "bg-fuchsia-50",
    border: "border-fuchsia-200",
    btn: "bg-fuchsia-600 hover:bg-fuchsia-700",
    initial: "Ga",
  },
  scratch: {
    name: "Scratch",
    url: "https://scratch.mit.edu",
    tileBg: "bg-orange-500",
    accent: "text-orange-700",
    frontBg: "bg-orange-50",
    border: "border-orange-200",
    btn: "bg-orange-600 hover:bg-orange-700",
    initial: "Sc",
  },
  lovable: {
    name: "Lovable",
    url: "https://lovable.dev",
    tileBg: "bg-rose-500",
    accent: "text-rose-700",
    frontBg: "bg-rose-50",
    border: "border-rose-200",
    btn: "bg-rose-600 hover:bg-rose-700",
    initial: "Lv",
  },
};

interface Project {
  id: string;
  tool: keyof typeof TOOLS;
  title: string;
  make: string;
  prompt?: string;
  promptLabel?: string;
  steps: string[];
}

const DECKS: Record<DeckId, Project[]> = {
  pictures: [
    {
      id: "portrait",
      tool: "gemini",
      title: "Hero Portrait",
      make: "A portrait of your own superhero.",
      prompt:
        "Draw a teenage superhero with blue lightning powers, comic-book style, on a city rooftop at night, neon colours, action pose.",
      promptLabel: "Copy image prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Swap in YOUR hero's powers and colours.",
        "Ask 'make it brighter' or 'wider shot' to improve it.",
        "Save your favourite picture.",
      ],
    },
    {
      id: "stickers",
      tool: "gemini",
      title: "Sticker Set",
      make: "Four fun face stickers of your hero.",
      prompt:
        "Make a set of 4 cute sticker-style images of a lightning superhero showing happy, angry, surprised and laughing faces, white background, bold outlines.",
      promptLabel: "Copy image prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Ask for 4 different expressions.",
        "Say 'make the outlines bolder' if you want.",
        "Save the sticker sheet.",
      ],
    },
    {
      id: "scene",
      tool: "gemini",
      title: "Action Scene",
      make: "Your hero in the middle of a rescue.",
      prompt:
        "Draw a lightning superhero saving a school bus from a giant robot in a neon city, comic-book style, dramatic camera angle.",
      promptLabel: "Copy image prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Describe the danger your hero is stopping.",
        "Ask for a 'dramatic angle' for more action.",
        "Save the scene.",
      ],
    },
  ],
  design: [
    {
      id: "comic",
      tool: "canva",
      title: "Comic Strip",
      make: "A 3-panel comic of your hero's adventure.",
      prompt:
        "Create a 3-panel comic strip for kids in bold comic-book style. Panel 1: a teenage superhero with blue lightning powers spots a giant robot attacking a neon city at night. Panel 2: a glowing purple hacker villain called The Glitch laughs from a rooftop. Panel 3: the hero charges up with crackling blue lightning, ready to fight. Bright colours, dynamic angles, and empty speech bubbles I can fill in.",
      promptLabel: "Copy Canva AI prompt",
      steps: [
        "Open Canva AI from the left sidebar.",
        "Paste the prompt and let it build the comic.",
        "Click each speech bubble and type what they say.",
        "Click Share, then Download.",
      ],
    },
    {
      id: "poster",
      tool: "canva",
      title: "Movie Poster",
      make: "A blockbuster poster for your hero's movie.",
      prompt:
        "Design a dramatic blockbuster movie poster for a superhero film called 'Voltage'. Show a teenage hero glowing with blue lightning, standing on a rooftop above a neon city skyline at night. Put a big bold glowing title 'VOLTAGE' at the top and a tagline at the bottom that reads 'One spark can save them all'. Cinematic lighting, portrait poster size.",
      promptLabel: "Copy Canva AI prompt",
      steps: [
        "Open Canva AI from the left sidebar.",
        "Paste the prompt and let it design the poster.",
        "Change the title to YOUR hero's name.",
        "Click Share, then Download.",
      ],
    },
    {
      id: "card",
      tool: "canva",
      title: "Trading Card",
      make: "A collectible card with your hero's stats.",
      prompt:
        "Design a collectible superhero trading card, portrait orientation, comic-book style with blue and gold colours and a shiny holographic look. At the top put the hero name 'Voltage'. In the middle, leave a frame for a hero portrait. Below, list 3 powers — Lightning Control, Super Speed, Energy Shield — each with a small power bar, and a rarity badge that says 'LEGENDARY'.",
      promptLabel: "Copy Canva AI prompt",
      steps: [
        "Open Canva AI from the left sidebar and paste the prompt.",
        "Use Upload (top bar) to add the hero portrait you made in Gemini.",
        "Edit the name, powers, and power bars.",
        "Click Share, then Download.",
      ],
    },
  ],
  music: [
    {
      id: "theme",
      tool: "suno",
      title: "Hero Theme Song",
      make: "An anthem that plays when your hero arrives.",
      prompt:
        "An upbeat, energetic hero anthem about courage and never giving up, with a catchy chorus.",
      promptLabel: "Copy song prompt",
      steps: [
        "Open Suno and paste the description.",
        "Pick a style you like (rock, hip-hop...).",
        "Create it and play your song.",
        "Save or share your favourite version.",
      ],
    },
    {
      id: "villain",
      tool: "suno",
      title: "Villain Theme",
      make: "A dark, dramatic theme for your villain.",
      prompt:
        "A dark, dramatic villain theme with a heavy beat, about a sneaky hacker called The Glitch.",
      promptLabel: "Copy song prompt",
      steps: [
        "Open Suno and paste the description.",
        "Make it sound spooky or powerful.",
        "Create and listen.",
        "Keep the one that fits your villain.",
      ],
    },
    {
      id: "jingle",
      tool: "suno",
      title: "Victory Jingle",
      make: "A short 15-second 'you win!' jingle.",
      prompt:
        "A short, happy 15-second victory jingle to celebrate winning, cheerful and catchy.",
      promptLabel: "Copy song prompt",
      steps: [
        "Open Suno and paste the description.",
        "Ask for something short and cheerful.",
        "Create your jingle.",
        "Save it for your hero's wins.",
      ],
    },
  ],
  notes: [
    {
      id: "summary",
      tool: "notebooklm",
      title: "Summarize a Chapter",
      make: "A clean summary of your chapter to revise from.",
      prompt:
        "Summarize my uploaded chapter in 8 simple bullet points a student can revise from. Then list the 5 most important terms with a one-line meaning for each.",
      promptLabel: "Copy study prompt",
      steps: [
        "Open NotebookLM and click New notebook.",
        "Upload your chapter or notes (PDF, doc, or paste text).",
        "Paste the prompt into the chat.",
        "Save the summary it makes.",
      ],
    },
    {
      id: "ask",
      tool: "notebooklm",
      title: "Ask Your Notes",
      make: "Answers from YOUR notes, with citations.",
      prompt:
        "Using only my uploaded notes, answer this question: (type your question here). Show me which part of my notes the answer came from.",
      promptLabel: "Copy study prompt",
      steps: [
        "Open the notebook with your notes loaded.",
        "Type a question you have about the topic.",
        "Read the answer and tap the citation it shows.",
        "Ask follow-up questions to go deeper.",
      ],
    },
    {
      id: "audio",
      tool: "notebooklm",
      title: "Audio Overview",
      make: "A podcast of your notes to revise on the go.",
      steps: [
        "Open your NotebookLM notebook.",
        "Click Audio Overview, then Generate.",
        "Wait for the two-host audio to be ready.",
        "Listen while you travel or relax.",
      ],
    },
  ],
  quiz: [
    {
      id: "quiz",
      tool: "gemini",
      title: "Make a Quiz",
      make: "A 10-question quiz to test yourself.",
      prompt:
        "You are a friendly teacher. Make a 10-question multiple-choice quiz on (your topic) for my grade. Give 4 options each, mark the correct answer, and add a one-line reason. Make 3 easy, 4 medium, and 3 hard.",
      promptLabel: "Copy quiz prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Type in YOUR topic and grade.",
        "Answer the quiz yourself first.",
        "Then check your answers.",
      ],
    },
    {
      id: "flashcards",
      tool: "gemini",
      title: "Make Flashcards",
      make: "A set of Q&A flashcards to memorise.",
      prompt:
        "Make 12 flashcards to help me memorise (your topic). Format each as 'Q: ... / A: ...' and keep every answer short and clear.",
      promptLabel: "Copy flashcard prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Add your topic.",
        "Cover the answers and test yourself.",
        "Ask for 'harder cards' to level up.",
      ],
    },
    {
      id: "plan",
      tool: "gemini",
      title: "Make a Study Plan",
      make: "A day-by-day plan before your test.",
      prompt:
        "My test on (subject) is in (number) days. The topics are: (list them). Make a simple day-by-day study plan that says what to revise each day, plus one short practice task per day.",
      promptLabel: "Copy plan prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Fill in your subject, days, and topics.",
        "Follow one day at a time.",
        "Tick off each day as you finish.",
      ],
    },
  ],
  present: [
    {
      id: "deck",
      tool: "gamma",
      title: "Make a Presentation",
      make: "A full slide deck on your topic in minutes.",
      prompt:
        "Create a clear, colourful presentation for students about (your topic). Include a title slide, 5 content slides with short bullet points, one fun-fact slide, and a summary slide.",
      promptLabel: "Copy Gamma prompt",
      steps: [
        "Open Gamma, click Create new, then Generate.",
        "Paste the prompt with your topic.",
        "Pick a theme you like and generate.",
        "Edit any slide, then present or share.",
      ],
    },
  ],
  plan: [
    {
      id: "problem",
      tool: "gemini",
      title: "Find the Problem",
      make: "A clear thing to build, and who it's for.",
      prompt:
        "You are a project coach for a student. I want to build something (a website, a game, or an app). Ask me 3 quick questions to help me pick ONE clear thing to build and who it is for. Then write my goal in one sentence.",
      promptLabel: "Copy planning prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Answer its 3 questions.",
        "Write your goal in one clear sentence.",
        "Save your goal.",
      ],
    },
    {
      id: "steps",
      tool: "gemini",
      title: "Break It Into Steps",
      make: "Your big goal split into small steps.",
      prompt:
        "My goal is: (paste your goal here). You are a project coach. Break this into a clear, ordered list of small steps a student can follow from start to finish. Keep each step short.",
      promptLabel: "Copy planning prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Add your goal.",
        "Read the steps in order.",
        "Save the step list.",
      ],
    },
    {
      id: "plan",
      tool: "gemini",
      title: "Make a Project Plan",
      make: "A simple plan: what to do, with which tool.",
      prompt:
        "Turn these steps into a simple project plan: (paste your steps). For each step add what to do, which tool to use, and how long it might take. Put it in a neat table.",
      promptLabel: "Copy planning prompt",
      steps: [
        "Open Gemini and paste the prompt.",
        "Add your steps.",
        "Check the plan and the tools.",
        "Save your plan.",
      ],
    },
  ],
  scratch: [
    {
      id: "move",
      tool: "scratch",
      title: "Make It Move",
      make: "A character you control with the arrow keys.",
      steps: [
        "Open Scratch and click Create.",
        "Pick a sprite (your character).",
        "Use 'when key pressed' and 'move' blocks for each arrow.",
        "Click the green flag and play.",
      ],
    },
    {
      id: "rule",
      tool: "scratch",
      title: "Add a Rule",
      make: "Something happens when two sprites touch.",
      steps: [
        "Stay in your Scratch project.",
        "Add a second sprite (a goal or an enemy).",
        "Use 'if touching ... then' to make something happen.",
        "Test it with the green flag.",
      ],
    },
    {
      id: "game",
      tool: "scratch",
      title: "Make a Mini-Game",
      make: "A simple catch game that keeps score.",
      steps: [
        "Add a 'score' variable from the Variables blocks.",
        "Use a 'forever' loop to keep checking.",
        "Add 1 to score each time you catch the goal.",
        "Play it, then share your game.",
      ],
    },
  ],
  website: [
    {
      id: "lovable",
      tool: "lovable",
      title: "Build a Real Website",
      make: "A working website AI builds from your words.",
      prompt:
        "Build a simple, colourful website for (your topic or business). Include a hero section with a big headline, an about section, 3 features, and a contact button. Make it fun and easy to read.",
      promptLabel: "Copy Lovable prompt",
      steps: [
        "Open Lovable and sign in.",
        "Paste the prompt describing your site.",
        "Watch it build the website live.",
        "Edit anything, then publish and copy the link.",
      ],
    },
    {
      id: "canva",
      tool: "canva",
      title: "Design a Web Page",
      make: "A one-page site you publish on Canva.",
      prompt:
        "Create a one-page website about (your topic). Include a big hero headline, 3 short sections, and a 'Get in touch' button. Bright, modern, easy to read.",
      promptLabel: "Copy Canva AI prompt",
      steps: [
        "Open Canva and choose the Website type (or Canva AI).",
        "Paste the prompt or pick a template.",
        "Edit the words and pictures.",
        "Click Publish and copy your link.",
      ],
    },
  ],
};

const ProjectCardView: React.FC<{
  p: Project;
  done: boolean;
  onDone: () => void;
}> = ({ p, done, onDone }) => {
  const t = TOOLS[p.tool];
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!p.prompt) return;
    navigator.clipboard?.writeText(p.prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={`rounded-3xl border-2 p-5 shadow-sm transition ${
        done ? "border-emerald-300 bg-emerald-50" : `${t.border} bg-white`
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.tileBg} text-lg font-black text-white shadow`}
        >
          {t.initial}
        </span>
        <div>
          <p className="text-xl font-black text-slate-800">{p.title}</p>
          <p className={`text-base font-black ${t.accent}`}>on {t.name}</p>
        </div>
        {done && (
          <span className="ml-auto rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-white">
            Done
          </span>
        )}
      </div>

      <p className="mt-4 text-lg font-bold text-slate-700">
        <span className="text-slate-400">You'll make: </span>{p.make}
      </p>

      {p.prompt && (
        <div className={`mt-3 rounded-2xl ${t.frontBg} px-4 py-3`}>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Prompt</p>
          <p className="mt-1 font-mono text-base font-bold leading-relaxed text-slate-700">{p.prompt}</p>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Steps</p>
        <ol className="mt-2 space-y-1.5">
          {p.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5 text-lg font-bold text-slate-700">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${t.tileBg} text-sm font-black text-white`}>
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <a
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 rounded-full ${t.btn} px-5 py-3 text-center text-base font-black text-white shadow-sm transition active:scale-95`}
        >
          Open {t.name}
        </a>
        {p.prompt && (
          <button
            onClick={copy}
            className="flex-1 rounded-full border-2 border-slate-300 bg-white px-5 py-3 text-base font-black text-slate-700 transition active:scale-95 hover:border-[#8B4EC4] hover:text-[#8B4EC4]"
          >
            {copied ? "Copied!" : p.promptLabel}
          </button>
        )}
        <button
          onClick={onDone}
          className={`flex-1 rounded-full px-5 py-3 text-base font-black shadow-sm transition active:scale-95 ${
            done
              ? "bg-emerald-100 text-emerald-700"
              : "bg-[#2EB85C] text-white hover:bg-[#28a745]"
          }`}
        >
          {done ? "Undo" : "Mark done"}
        </button>
      </div>
    </div>
  );
};

export const ProjectDeck: React.FC<Props> = ({ sectionIndex, explanation, deck }) => {
  const $completed = useStore(completedIndices);
  const isCompleted = $completed.has(sectionIndex);
  const projects = DECKS[deck];

  const [done, setDone] = useState<Set<string>>(
    isCompleted ? new Set(projects.map((p) => p.id)) : new Set()
  );
  const allDone = done.size === projects.length;

  const toggle = (id: string) => {
    setDone((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === projects.length) completeSection(sectionIndex, false);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#fdf4ff] px-5 py-3 text-center text-lg font-bold text-[#86198f]">
        Pick a project, open the tool, and make it. Tap Mark done when you have it.
      </div>

      <div className="space-y-4">
        {projects.map((p) => (
          <ProjectCardView key={p.id} p={p} done={done.has(p.id)} onDone={() => toggle(p.id)} />
        ))}
      </div>

      <p className="text-center text-lg font-bold text-slate-400">
        {done.size} of {projects.length} projects done
      </p>

      {allDone && (
        <p className="text-center text-xl font-black text-[#15803d]">
          You made all three. You are creating like a pro.
        </p>
      )}
      {allDone && <FeedbackBar sectionIndex={sectionIndex} explanation={explanation} />}
    </div>
  );
};
