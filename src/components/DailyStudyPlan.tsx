"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Layers, CheckSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import type { LinggisProgress } from "@/types/linggis";
import { getTodayIsoDate, loadProgress } from "@/lib/progress";

export interface MiniRoadmapStep {
  slug: string;
  title: string;
  cefr_level: string;
  estimated_minutes: number;
}

interface DailyStudyPlanProps {
  roadmapSteps: MiniRoadmapStep[];
}

export function DailyStudyPlan({ roadmapSteps }: DailyStudyPlanProps) {
  const [progress, setProgress] = useState<LinggisProgress | null>(null);

  useEffect(() => {
    const refresh = () => {
      const { progress: current } = loadProgress();
      setProgress(current);
    };
    refresh();
    window.addEventListener("linggis-progress-updated", refresh);
    window.addEventListener("linggis-progress-synced", refresh);
    return () => {
      window.removeEventListener("linggis-progress-updated", refresh);
      window.removeEventListener("linggis-progress-synced", refresh);
    };
  }, []);

  const today = getTodayIsoDate();

  const stats = useMemo(() => {
    const completedSet = new Set(progress?.completedModules ?? []);
    const nextModule =
      roadmapSteps.find((m) => !completedSet.has(m.slug)) ?? roadmapSteps[0];

    const bookmarks = progress?.bookmarks ?? [];
    const flashcards = progress?.flashcards ?? {};
    const dueCardsCount = bookmarks.filter((slug) => {
      const st = flashcards[slug];
      return !st || st.nextReviewDate <= today;
    }).length;

    const strongCardsCount = Object.values(flashcards).filter(
      (st) => st.intervalDays >= 7 || st.repetitions >= 2
    ).length;

    const completedModulesCount = completedSet.size;
    const totalModulesCount = roadmapSteps.length;
    const completedReadingsCount = (progress?.completedReadings ?? []).length;
    const quizSessionsCount = (progress?.quizHistory ?? []).length;

    return {
      nextModule,
      bookmarksCount: bookmarks.length,
      dueCardsCount,
      strongCardsCount,
      completedModulesCount,
      totalModulesCount,
      completedReadingsCount,
      quizSessionsCount,
    };
  }, [progress, roadmapSteps, today]);

  return (
    <section
      aria-labelledby="daily-plan-heading"
      className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div className="space-y-1">
          <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
            Rencana Belajar 15 Menit Hari Ini &amp; Log Penguasaan
          </p>
          <h2
            id="daily-plan-heading"
            className="font-display text-2xl font-semibold text-[var(--ink-primary)]"
          >
            3 Langkah Fokus Harian Anda
          </h2>
        </div>

        {/* Stat Ringkas */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-ipa">
          <span className="px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
            Modul: {stats.completedModulesCount}/{stats.totalModulesCount}
          </span>
          <span className="px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
            Hafal Kuat: {stats.strongCardsCount} kata
          </span>
          <span className="px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
            Bacaan: {stats.completedReadingsCount} selesai
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Langkah 1: Roadmap */}
        {stats.nextModule && (
          <Link
            href={`/roadmap/${encodeURIComponent(stats.nextModule.slug)}`}
            className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--accent-primary)]">
                <span>01 · MATERI (7 MNT)</span>
                <span>{stats.nextModule.cefr_level}</span>
              </div>
              <div className="font-display font-semibold text-base text-[var(--ink-primary)] line-clamp-2">
                {stats.nextModule.title}
              </div>
            </div>
            <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
              Pelajari Modul
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </span>
          </Link>
        )}

        {/* Langkah 2: Flashcard SM-2 */}
        <Link
          href="/flashcard"
          className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--accent-warm)]">
              <span>02 · HAFALAN (4 MNT)</span>
              <span>SM-2</span>
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)]">
              {stats.bookmarksCount === 0
                ? "Mulai Ulang Dek Kosakata Inti A1"
                : stats.dueCardsCount > 0
                  ? `Ulang ${stats.dueCardsCount} Kartu Jatuh Tempo Hari Ini`
                  : `Semua ${stats.bookmarksCount} Kartu Tersimpan Sudah Diulang`}
            </div>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            {stats.bookmarksCount > 0 && stats.dueCardsCount === 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--state-correct)]" strokeWidth={1.75} />
            ) : (
              <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
            )}
            Buka Flashcard
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>

        {/* Langkah 3: Latihan / Pola Kalimat */}
        <Link
          href="/latihan/pola-kalimat"
          className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-3"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--ink-secondary)]">
              <span>03 · PRAKTIK (4 MNT)</span>
              <span>{stats.quizSessionsCount} sesi selesai</span>
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)]">
              Rangkai Pola Kalimat &amp; Uji Kuis Singkat
            </div>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            Mulai Praktik
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>
      </div>
    </section>
  );
}

