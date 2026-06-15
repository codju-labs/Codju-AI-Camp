import { atom } from "nanostores";

interface ProgressData {
  completedLevels: string[];
}

const STORAGE_KEY = "codju-aicc-progress";

function getLocalProgress(): ProgressData {
  if (typeof window === "undefined") return { completedLevels: [] };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { completedLevels: [] };
  } catch {
    return { completedLevels: [] };
  }
}

export const progressStore = atom<ProgressData>(getLocalProgress());

function saveLocal(progress: ProgressData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

export async function loadProgress() {
  try {
    const response = await fetch("/api/progress");
    if (!response.ok) return;
    const data = await response.json() as { completedLevels?: string[] };
    const progress = { completedLevels: data.completedLevels ?? [] };
    progressStore.set(progress);
    saveLocal(progress);
  } catch {
    // Local progress remains available when the network is interrupted.
  }
}

export async function completeLevel(levelId: string) {
  const current = progressStore.get();
  if (!current.completedLevels.includes(levelId)) {
    const next = {
      completedLevels: [...current.completedLevels, levelId],
    };
    progressStore.set(next);
    saveLocal(next);
  }

  await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ levelId, courseId: "aicc-day1-prompting" }),
  }).catch(() => {});
}
