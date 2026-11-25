"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Compass,
  BookOpen,
} from "lucide-react";
import type { RoadmapStage, RoadmapTrack } from "@/types/linggis";
import { loadProgress } from "@/lib/progress";
import { AccountSyncBanner } from "@/components/AccountSyncBanner";

export interface RoadmapSummaryItem {
  slug: string;
  cefr_level: RoadmapStage;
  track: RoadmapTrack;
  order_index: number;
  title: string;
  subtitle: string;
  summary: string;
  estimated_minutes: number;
  quiz_module_slug?: string;
}

interface RoadmapClientProps {
  modules: RoadmapSummaryItem[];
}

const STAGE_ORDER: RoadmapStage[] = ["A0", "A1", "A2", "B1", "B2", "C1"];

const STAGE_INFO: Record<
  RoadmapStage,
  { heading: string; description: string }
> = {
  A0: {
    heading: "Tahap 0 (A0) — Fondasi & Cara Mulai dari Nol",
    description:
      "Pahami cara kerja belajar bahasa Inggris, bunyi dasar yang sering tertukar, dan urutan hafalan agar tidak salah langkah sejak hari pertama.",
  },
  A1: {
    heading: "Level A1 — Pemula Dasar (Survival English)",
    description:
      "Hafalan kata inti frekuensi tinggi, ungkapan perkenalan, angka/waktu, serta tata bahasa paling mendasar (kata ganti, to be, present simple).",
  },
  A2: {
    heading: "Level A2 — Pemula Lanjutan (Komunikasi Harian)",
    description:
      "Ekspresi harian (I-Statements, aktivitas rutin), preposisi waktu/tempat, serta menceritakan pengalaman masa lalu dan rencana sederhana.",
  },
  B1: {
    heading: "Level B1 — Menengah (Percakapan Mandiri)",
    description:
      "Menguasai tenses lanjutan (perfect), kalimat pasif, phrasal verbs, serta mulai membaca cerita pendek dan perbandingan bahasa kasual.",
  },
  B2: {
    heading: "Level B2 — Menengah Atas (Akurasi & Berita)",
    description:
      "Kalimat bersyarat, klausa relatif, idiom kerja/percakapan, dan latihan skimming artikel berita berbahasa Inggris.",
  },
  C1: {
    heading: "Level C1 — Mahir (Nuansa & Retorika)",
    description:
      "Struktur lanjutan, nuansa ungkapan alami penutur asli, serta latihan artikulasi melalui naskah pidato dan presentasi.",
  },
};

const TRACK_LABELS: Record<RoadmapTrack, string> = {
  fondasi: "Fondasi",
  hafalan: "Hafalan",
  grammar: "Grammar",
  praktik: "Praktik",
};

export function RoadmapClient({ modules }: RoadmapClientProps) {
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<"SEMUA" | RoadmapStage>("SEMUA");
  const [trackFilter, setTrackFilter] = useState<"SEMUA" | RoadmapTrack>("SEMUA");
  const [statusFilter, setStatusFilter] = useState<"SEMUA" | "BELUM" | "SELESAI">("SEMUA");

  useEffect(() => {
    const refresh = () => {
      const { progress } = loadProgress();
      setCompletedSlugs(progress.completedModules);
    };
    refresh();
    window.addEventListener("linggis-progress-updated", refresh);
    window.addEventListener("linggis-progress-synced", refresh);
    return () => {
      window.removeEventListener("linggis-progress-updated", refresh);
      window.removeEventListener("linggis-progress-synced", refresh);
    };
  }, []);

  const completedSet = useMemo(() => new Set(completedSlugs), [completedSlugs]);

  const totalCount = modules.length;
  const completedCount = modules.filter((m) => completedSet.has(m.slug)).length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextRecommended = useMemo(
    () => modules.find((m) => !completedSet.has(m.slug)) ?? modules[0],
    [modules, completedSet]
  );

  const visibleStages = stageFilter === "SEMUA" ? STAGE_ORDER : [stageFilter];

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (stageFilter !== "SEMUA" && m.cefr_level !== stageFilter) return false;
      if (trackFilter !== "SEMUA" && m.track !== trackFilter) return false;
      const isDone = completedSet.has(m.slug);
      if (statusFilter === "BELUM" && isDone) return false;
      if (statusFilter === "SELESAI" && !isDone) return false;
      return true;
    });
  }, [modules, stageFilter, trackFilter, statusFilter, completedSet]);

  return (
    <div className="space-y-6">
      <AccountSyncBanner />

      {/* Header & Ringkasan Progres */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
              Peta Belajar Bahasa Inggris Terstruktur (A0–C1)
            </p>
            <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
              Roadmap Belajar: Mulai dari Nol hingga Mahir
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              Materi dibagi menjadi 4 jalur berurutan—Fondasi Cara Belajar, Hafalan Prioritas, Grammar Fungsional, dan Praktik Dialog/Bacaan—agar Anda selalu tahu langkah berikutnya.
            </p>
          </div>

          {nextRecommended && (
            <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] lg:w-80 shrink-0 space-y-2.5">
              <div className="text-xs font-medium text-[var(--ink-muted)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={1.75} />
                {completedCount === 0 ? "Mulai dari sini:" : "Lanjutkan langkah berikutnya:"}
              </div>
              <div className="font-display text-base font-semibold text-[var(--ink-primary)] line-clamp-2">
                {nextRecommended.title}
              </div>
              <Link
                href={`/roadmap/${encodeURIComponent(nextRecommended.slug)}`}
                className="w-full min-h-[40px] px-3.5 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                Buka Modul ({nextRecommended.cefr_level})
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </Link>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-[var(--ink-primary)]">
              Progres Roadmap Anda
            </span>
            <span className="font-mono-ipa text-[var(--ink-secondary)]">
              {completedCount} / {totalCount} modul selesai ({percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
            <span>Referensi cepat tata bahasa:</span>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/cheatsheet"
                className="font-medium text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
              >
                Cheatsheet Tenses
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/cheatsheet/irregular-verbs"
                className="font-medium text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
              >
                Irregular Verbs (V1-V2-V3)
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Panduan Singkat 4 Jalur */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-1">
          <div className="text-xs font-mono-ipa font-semibold text-[var(--accent-primary)]">
            01 · FONDASI
          </div>
          <p className="text-sm font-medium text-[var(--ink-primary)]">Cara Pikir &amp; Bunyi</p>
          <p className="text-xs text-[var(--ink-secondary)]">
            Peta urutan belajar, cara baca IPA, dan menghentikan terjemahan kata per kata.
          </p>
        </div>
        <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-1">
          <div className="text-xs font-mono-ipa font-semibold text-[var(--accent-primary)]">
            02 · HAFALAN
          </div>
          <p className="text-sm font-medium text-[var(--ink-primary)]">Kosakata &amp; Frasa Inti</p>
          <p className="text-xs text-[var(--ink-secondary)]">
            Mulai dari ungkapan bertahan hidup A1 hingga phrasal verb, idiom, &amp; ekspresi natural.
          </p>
        </div>
        <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-1">
          <div className="text-xs font-mono-ipa font-semibold text-[var(--accent-primary)]">
            03 · GRAMMAR
          </div>
          <p className="text-sm font-medium text-[var(--ink-primary)]">Tata Bahasa Bertahap</p>
          <p className="text-xs text-[var(--ink-secondary)]">
            70 topik grammar terurut dari Noun &amp; To Be (A1) sampai struktur kompleks (C1).
          </p>
        </div>
        <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-1">
          <div className="text-xs font-mono-ipa font-semibold text-[var(--accent-primary)]">
            04 · PRAKTIK
          </div>
          <p className="text-sm font-medium text-[var(--ink-primary)]">Dialog, Cerita &amp; Kuis</p>
          <p className="text-xs text-[var(--ink-secondary)]">
            Terapkan hafalan di percakapan harian, cerita pendek, berita, pidato, &amp; kuis rumpang.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section aria-label="Filter modul roadmap" className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--ink-muted)] mr-1">Tahap:</span>
          {(["SEMUA", ...STAGE_ORDER] as const).map((st) => {
            const active = stageFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1 text-xs font-mono-ipa rounded-[6px] border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                    : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {st === "SEMUA" ? "Semua" : st}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[var(--ink-muted)]">Jalur:</span>
            {(["SEMUA", "fondasi", "hafalan", "grammar", "praktik"] as const).map((tr) => {
              const active = trackFilter === tr;
              return (
                <button
                  key={tr}
                  type="button"
                  onClick={() => setTrackFilter(tr)}
                  className={`px-2.5 py-1 text-xs rounded-[6px] border transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                      : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {tr === "SEMUA" ? "Semua Jalur" : TRACK_LABELS[tr]}
                </button>
              );
            })}
          </div>

          <select
            id="roadmap-status-filter"
            name="statusFilter"
            aria-label="Filter status penyelesaian"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "SEMUA" | "BELUM" | "SELESAI")}
            className="px-2.5 py-1 text-xs rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)]"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="BELUM">Belum Selesai</option>
            <option value="SELESAI">Sudah Selesai</option>
          </select>
        </div>
      </section>

      {/* Daftar Tahapan CEFR */}
      <div className="space-y-10">
        {visibleStages.map((stage) => {
          const stageAll = modules.filter((m) => m.cefr_level === stage);
          const stageFiltered = filteredModules.filter((m) => m.cefr_level === stage);
          if (stageFiltered.length === 0) return null;

          const stageDoneCount = stageAll.filter((m) => completedSet.has(m.slug)).length;
          const meta = STAGE_INFO[stage];

          return (
            <section key={stage} aria-labelledby={`stage-${stage}`} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
                <div className="space-y-1">
                  <h2
                    id={`stage-${stage}`}
                    className="font-display text-2xl font-semibold text-[var(--ink-primary)]"
                  >
                    {meta.heading}
                  </h2>
                  <p className="text-sm text-[var(--ink-secondary)]">
                    {meta.description}
                  </p>
                </div>
                <span className="text-xs font-mono-ipa px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] shrink-0 self-start sm:self-auto">
                  {stageDoneCount}/{stageAll.length} selesai
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {stageFiltered.map((mod) => {
                  const isDone = completedSet.has(mod.slug);
                  return (
                    <Link
                      key={mod.slug}
                      href={`/roadmap/${encodeURIComponent(mod.slug)}`}
                      className={`p-5 rounded-[8px] border transition-colors flex flex-col justify-between gap-3 ${
                        isDone
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)]/35"
                          : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono-ipa text-[var(--ink-muted)]">
                              #{String(mod.order_index).padStart(2, "0")}
                            </span>
                            <span className="px-2 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] font-medium">
                              {TRACK_LABELS[mod.track]}
                            </span>
                          </div>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--state-correct)]">
                              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                              Selesai
                            </span>
                          ) : (
                            <Circle className="w-4 h-4 text-[var(--ink-muted)]" strokeWidth={1.75} />
                          )}
                        </div>

                        <h3 className="font-display text-lg font-semibold text-[var(--ink-primary)] leading-snug">
                          {mod.title}
                        </h3>
                        <p className="text-sm text-[var(--ink-secondary)] line-clamp-2">
                          {mod.summary}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)] text-xs text-[var(--ink-muted)]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                          {mod.estimated_minutes} menit
                        </span>
                        <span className="font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
                          Pelajari Modul
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

