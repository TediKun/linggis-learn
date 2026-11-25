import {
  LinggisProgressSchema,
  type FlashcardState,
  type LinggisProgress,
  type QuizHistoryEntry,
} from "@/types/linggis";

export const STORAGE_KEY = "linggis_progress_v1";

const DEFAULT_PROGRESS: LinggisProgress = {
  version: 1,
  bookmarks: [],
  completedModules: [],
  completedReadings: [],
  flashcards: {},
  quizHistory: [],
};

// Fallback memori jika browser memblokir localStorage (mode privat ketat)
let memoryFallback: LinggisProgress | null = null;

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysIso(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function loadProgress(): {
  progress: LinggisProgress;
  storageBlocked: boolean;
} {
  if (typeof window === "undefined") {
    return { progress: { ...DEFAULT_PROGRESS }, storageBlocked: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        progress: memoryFallback ? { ...memoryFallback } : { ...DEFAULT_PROGRESS },
        storageBlocked: false,
      };
    }
    const parsed = JSON.parse(raw) as unknown;
    const validated = LinggisProgressSchema.safeParse(parsed);
    if (validated.success) {
      memoryFallback = validated.data;
      return { progress: validated.data, storageBlocked: false };
    }
    return { progress: { ...DEFAULT_PROGRESS }, storageBlocked: false };
  } catch {
    return {
      progress: memoryFallback ? { ...memoryFallback } : { ...DEFAULT_PROGRESS },
      storageBlocked: true,
    };
  }
}

export function saveProgress(next: LinggisProgress): boolean {
  memoryFallback = next;
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("linggis-progress-updated"));
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent("linggis-progress-updated"));
    return false;
  }
}

/**
 * Menyimpan hasil penggabungan cloud ke localStorage tanpa memicu antrean upload berulang.
 */
export function saveSyncedProgressFromCloud(next: LinggisProgress): boolean {
  memoryFallback = next;
  if (typeof window === "undefined") return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("linggis-progress-synced"));
    return true;
  } catch {
    window.dispatchEvent(new CustomEvent("linggis-progress-synced"));
    return false;
  }
}

/**
 * Menggabungkan progres lokal browser dengan progres akun di Supabase tanpa saling menimpa.
 */
export function mergeProgress(
  local: LinggisProgress,
  remote: LinggisProgress
): LinggisProgress {
  const bookmarks = Array.from(
    new Set([...remote.bookmarks, ...local.bookmarks])
  );
  const completedModules = Array.from(
    new Set([...remote.completedModules, ...local.completedModules])
  );
  const completedReadings = Array.from(
    new Set([
      ...(remote.completedReadings ?? []),
      ...(local.completedReadings ?? []),
    ])
  );

  const flashcards: Record<string, FlashcardState> = { ...remote.flashcards };
  for (const [slug, localState] of Object.entries(local.flashcards)) {
    const existing = flashcards[slug];
    if (!existing) {
      flashcards[slug] = localState;
    } else if (
      localState.repetitions > existing.repetitions ||
      (localState.repetitions === existing.repetitions &&
        localState.nextReviewDate > existing.nextReviewDate)
    ) {
      flashcards[slug] = localState;
    }
  }

  const seenQuiz = new Set<string>();
  const mergedQuiz: QuizHistoryEntry[] = [];
  for (const item of [...local.quizHistory, ...remote.quizHistory]) {
    const key = `${item.moduleSlug}|${item.completedAt}`;
    if (!seenQuiz.has(key)) {
      seenQuiz.add(key);
      mergedQuiz.push(item);
    }
  }
  mergedQuiz.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return {
    version: 1,
    bookmarks,
    completedModules,
    completedReadings,
    flashcards,
    quizHistory: mergedQuiz.slice(0, 100),
  };
}

export function toggleBookmarkSlug(slug: string): {
  progress: LinggisProgress;
  saved: boolean;
  storageOk: boolean;
} {
  const { progress } = loadProgress();
  const exists = progress.bookmarks.includes(slug);
  const bookmarks = exists
    ? progress.bookmarks.filter((s) => s !== slug)
    : [...progress.bookmarks, slug];

  const flashcards = { ...progress.flashcards };
  if (!exists && !flashcards[slug]) {
    flashcards[slug] = {
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: getTodayIsoDate(),
    };
  }

  const next: LinggisProgress = {
    ...progress,
    bookmarks,
    flashcards,
  };
  const storageOk = saveProgress(next);
  return { progress: next, saved: !exists, storageOk };
}

export function toggleCompletedModule(moduleSlug: string): LinggisProgress {
  const { progress } = loadProgress();
  const exists = progress.completedModules.includes(moduleSlug);
  const completedModules = exists
    ? progress.completedModules.filter((s) => s !== moduleSlug)
    : [...progress.completedModules, moduleSlug];
  const next: LinggisProgress = { ...progress, completedModules };
  saveProgress(next);
  return next;
}

export function toggleCompletedReading(readingSlug: string): LinggisProgress {
  const { progress } = loadProgress();
  const list = progress.completedReadings ?? [];
  const exists = list.includes(readingSlug);
  const completedReadings = exists
    ? list.filter((s) => s !== readingSlug)
    : [...list, readingSlug];
  const next: LinggisProgress = { ...progress, completedReadings };
  saveProgress(next);
  return next;
}

export function recordQuizResult(entry: QuizHistoryEntry): LinggisProgress {
  const { progress } = loadProgress();
  const next: LinggisProgress = {
    ...progress,
    quizHistory: [entry, ...progress.quizHistory].slice(0, 100),
  };
  saveProgress(next);
  return next;
}

/**
 * Algoritma SM-2 ringan untuk Flashcard:
 * rating = "lupa" (quality 1), "ingat" (quality 4), "mudah" (quality 5)
 */
export function evaluateFlashcardSM2(
  slug: string,
  rating: "lupa" | "ingat" | "mudah"
): LinggisProgress {
  const { progress } = loadProgress();
  const prev: FlashcardState = progress.flashcards[slug] ?? {
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: getTodayIsoDate(),
  };

  const q = rating === "lupa" ? 1 : rating === "ingat" ? 4 : 5;
  let repetitions = prev.repetitions;
  let intervalDays = prev.intervalDays;
  let easeFactor =
    prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;
  if (easeFactor > 4) easeFactor = 4;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitions += 1;
    if (rating === "mudah" && intervalDays < 4) {
      intervalDays = 4;
    }
  }

  const today = getTodayIsoDate();
  const nextState: FlashcardState = {
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    nextReviewDate: addDaysIso(today, intervalDays),
  };

  const next: LinggisProgress = {
    ...progress,
    flashcards: {
      ...progress.flashcards,
      [slug]: nextState,
    },
  };
  saveProgress(next);
  return next;
}

export function importProgressJson(rawJson: string): {
  ok: boolean;
  error?: string;
  progress?: LinggisProgress;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const validated = LinggisProgressSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        ok: false,
        error:
          "Format file JSON tidak sesuai struktur progres Linggis v1.",
      };
    }
    saveProgress(validated.data);
    return { ok: true, progress: validated.data };
  } catch {
    return {
      ok: false,
      error: "File bukan JSON yang valid.",
    };
  }
}

export function resetAllProgress(): LinggisProgress {
  const empty: LinggisProgress = {
    version: 1,
    bookmarks: [],
    completedModules: [],
    completedReadings: [],
    flashcards: {},
    quizHistory: [],
  };
  saveProgress(empty);
  return empty;
}

