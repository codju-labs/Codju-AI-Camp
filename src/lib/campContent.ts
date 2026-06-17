export interface CampLevel {
  id: string;
  title: string;
  summary: string;
  dayId: string;
}

export interface CampDay {
  id: string;
  label: string;
  title: string;
  description: string;
  status: "open" | "locked";
  levels: CampLevel[];
}

export const campDays: CampDay[] = [
  {
    id: "aicc-day1-prompting",
    label: "Day 1",
    title: "Prompt Engineering",
    description:
      "Learn the foundations of AI, practise prompt engineering, and design your own AI superhero.",
    status: "open",
    levels: [
      { id: "aicc-meet-ai", title: "About AI", summary: "Discover what AI is and how it learns.", dayId: "aicc-day1-prompting" },
      { id: "aicc-magic-words", title: "The Magic Words", summary: "See how better prompts create better answers.", dayId: "aicc-day1-prompting" },
      { id: "aicc-meet-tools", title: "Meet the Tools", summary: "Pick the right AI teammate for each job.", dayId: "aicc-day1-prompting" },
      { id: "aicc-rctf", title: "The R-C-T-F Recipe", summary: "Build strong prompts with four ingredients.", dayId: "aicc-day1-prompting" },
      { id: "aicc-prompting-in-action", title: "Prompting in Action", summary: "Create, study, and research with AI.", dayId: "aicc-day1-prompting" },
      { id: "aicc-prompt-master", title: "Become the Prompt Master", summary: "Quiz, debate, and build your AI superhero.", dayId: "aicc-day1-prompting" },
    ],
  },
  {
    id: "aicc-day2-creativity",
    label: "Day 2",
    title: "Creativity with AI",
    description:
      "Make AI draw, design, and sing. Turn your AI Superhero into real artwork, a comic, and a theme song.",
    status: "open",
    levels: [
      { id: "aicc-creating-with-ai", title: "Creating with AI", summary: "Turn descriptions into images, designs, music, and video ideas.", dayId: "aicc-day2-creativity" },
      { id: "aicc-creative-toolkit", title: "The Creative Toolkit", summary: "Meet Gemini, Canva, and Suno as creative teammates.", dayId: "aicc-day2-creativity" },
      { id: "aicc-picture-recipe", title: "Picture Projects", summary: "Create hero artwork from clear picture prompts.", dayId: "aicc-day2-creativity" },
      { id: "aicc-creating-in-action", title: "Design Projects", summary: "Turn AI art into polished Canva designs.", dayId: "aicc-day2-creativity" },
      { id: "aicc-ai-artist", title: "Music & Showcase", summary: "Make a soundtrack and collect your hero project.", dayId: "aicc-day2-creativity" },
    ],
  },
  {
    id: "aicc-day3-research",
    label: "Day 3",
    title: "AI-Assisted Learning",
    description:
      "Study smarter with AI. Make summaries, quizzes, flashcards, and a presentation using NotebookLM, Gemini, and Gamma.",
    status: "open",
    levels: [
      { id: "aicc-learn-notes", title: "Notes & Summaries", summary: "Use AI to organize notes and explain ideas clearly.", dayId: "aicc-day3-research" },
      { id: "aicc-learn-quiz", title: "Quiz Yourself", summary: "Generate practice questions, flashcards, and study plans.", dayId: "aicc-day3-research" },
      { id: "aicc-learn-present", title: "Present & Showcase", summary: "Build a study kit and presentation from your learning.", dayId: "aicc-day3-research" },
    ],
  },
  {
    id: "aicc-day4-founder",
    label: "Day 4",
    title: "Computational Thinking + Build a Website",
    description: "Plan like a builder and turn ideas into clear website logic.",
    status: "locked",
    levels: [],
  },
  {
    id: "aicc-day5-website",
    label: "Day 5",
    title: "Build a Website",
    description: "Ship a polished web project from your AI-assisted plan.",
    status: "locked",
    levels: [],
  },
  {
    id: "aicc-day6-agents",
    label: "Day 6",
    title: "Create an AI Agent",
    description: "Design an AI helper that can follow a workflow.",
    status: "locked",
    levels: [],
  },
  {
    id: "aicc-day7-demo-day",
    label: "Day 7",
    title: "Demo Day",
    description: "Package your project and share what you built.",
    status: "locked",
    levels: [],
  },
];

export const openCampDays = campDays.filter((day) => day.status === "open");
export const allOpenLevels = openCampDays.flatMap((day) => day.levels);

export function getCourseIdForLevel(levelId: string) {
  return allOpenLevels.find((level) => level.id === levelId)?.dayId ?? null;
}
