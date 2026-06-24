export interface CampLevel {
  id: string;
  title: string;
  summary: string;
  dayId: string;
}

export interface CampResource {
  title: string;
  url: string;
}

export interface CampDay {
  id: string;
  label: string;
  title: string;
  description: string;
  status: "open" | "locked";
  unlockOffsetDays: number | null;
  recordingUrl?: string;
  recordingEmbedUrl?: string;
  resources?: CampResource[];
  levels: CampLevel[];
}

interface CampAccessOptions {
  unlockAllAvailableDays?: boolean;
}

const COHORT_START_IST = Date.UTC(2026, 5, 21, 18, 30);
const DAY_MS = 24 * 60 * 60 * 1000;
const FULL_CAMP_ACCESS_EMAILS = new Set(["rkbish@gmail.com", "devashishpuri@gmail.com"]);

const campDayContent: CampDay[] = [
  {
    id: "aicc-day1-prompting",
    label: "Day 1",
    title: "Prompt Engineering",
    description:
      "Learn the foundations of AI, practise prompt engineering, and design your own AI superhero.",
    status: "open",
    unlockOffsetDays: 0,
    recordingUrl: "https://youtube.com/live/37PT13wn0fo?feature=share",
    recordingEmbedUrl: "https://www.youtube-nocookie.com/embed/37PT13wn0fo",
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
    unlockOffsetDays: 1,
    recordingUrl: "https://youtube.com/live/aLNbeWUpdHw?feature=share",
    recordingEmbedUrl: "https://www.youtube-nocookie.com/embed/aLNbeWUpdHw",
    resources: [
      { title: "Canva Masterclass", url: "https://www.youtube.com/live/cQ2EW8YreHI" },
    ],
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
    status: "locked",
    unlockOffsetDays: 2,
    recordingUrl: "https://youtube.com/live/MzYu4geBVoE?feature=share",
    recordingEmbedUrl: "https://www.youtube-nocookie.com/embed/MzYu4geBVoE",
    resources: [
      { title: "Gamma", url: "https://youtu.be/O0xEo-dS9RM?si=ktEzKAZP0dWAQ_XD" },
      { title: "Notebook LM", url: "https://youtu.be/6vzB41UQjLo?si=FsCbqwdAd4yIiIUA" },
    ],
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
    description:
      "Think like a builder with DPAA, then turn your plan into a real website with Canva and Lovable.",
    status: "locked",
    unlockOffsetDays: 3,
    levels: [
      { id: "aicc-meet-dpaa", title: "Meet DPAA", summary: "Learn four thinking moves that crack any problem.", dayId: "aicc-day4-founder" },
      { id: "aicc-dpaa-usecase", title: "DPAA on Your Idea", summary: "Turn your own idea into a clear build plan.", dayId: "aicc-day4-founder" },
      { id: "aicc-build-website", title: "Build a Website", summary: "Use your plan to build and publish a real website.", dayId: "aicc-day4-founder" },
    ],
  },
  {
    id: "aicc-day5-website",
    label: "Day 5",
    title: "Entrepreneurial Thinking + Build an App",
    description:
      "Think like a founder: turn an idea into a startup, pitch it with Gamma, and build a real app with Lovable.",
    status: "locked",
    unlockOffsetDays: 4,
    levels: [
      { id: "aicc-founder-plan", title: "Think Like a Founder", summary: "Choose a problem, audience, product, and name for your startup.", dayId: "aicc-day5-website" },
      { id: "aicc-pitch-it", title: "Pitch It", summary: "Create a 30-second pitch and a Gamma deck prompt.", dayId: "aicc-day5-website" },
      { id: "aicc-build-app", title: "Build Your App", summary: "Use Lovable and Canva to build the app and logo from your plan.", dayId: "aicc-day5-website" },
    ],
  },
  {
    id: "aicc-day6-agents",
    label: "Day 6",
    title: "Create an AI Agent",
    description: "Design an AI helper that can follow a workflow.",
    status: "locked",
    unlockOffsetDays: null,
    levels: [],
  },
  {
    id: "aicc-day7-demo-day",
    label: "Day 7",
    title: "Demo Day",
    description: "Package your project and share what you built.",
    status: "locked",
    unlockOffsetDays: null,
    levels: [],
  },
];

export function hasFullCampAccess(email: string | null | undefined) {
  return FULL_CAMP_ACCESS_EMAILS.has(String(email || "").trim().toLowerCase());
}

function getDayStatus(
  day: CampDay,
  now = new Date(),
  options: CampAccessOptions = {},
): CampDay["status"] {
  if (!day.levels.length || day.unlockOffsetDays === null) return "locked";
  if (options.unlockAllAvailableDays) return "open";

  const elapsedDays = Math.floor((now.getTime() - COHORT_START_IST) / DAY_MS);
  return elapsedDays >= day.unlockOffsetDays ? "open" : "locked";
}

export function getCampDays(now = new Date(), options: CampAccessOptions = {}): CampDay[] {
  return campDayContent.map((day) => ({
    ...day,
    status: getDayStatus(day, now, options),
  }));
}

export function getOpenCampDays(now = new Date(), options: CampAccessOptions = {}) {
  return getCampDays(now, options).filter((day) => day.status === "open");
}

export function getLockedCampDays(now = new Date(), options: CampAccessOptions = {}) {
  return getCampDays(now, options).filter((day) => day.status === "locked");
}

export function getOpenLevels(now = new Date(), options: CampAccessOptions = {}) {
  return getOpenCampDays(now, options).flatMap((day) => day.levels);
}

export const campDays = getCampDays();
export const openCampDays = getOpenCampDays();
export const allOpenLevels = getOpenLevels();
export const allCampLevels = campDayContent.flatMap((day) => day.levels);

export function getCourseIdForLevel(levelId: string) {
  return allCampLevels.find((level) => level.id === levelId)?.dayId ?? null;
}
