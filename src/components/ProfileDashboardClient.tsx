"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArchiveRestore,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Circle,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Map as MapIcon,
  RefreshCw,
  RotateCw,
  Target,
  Trash2,
} from "lucide-react";
import type { LinggisProgress } from "@/types/linggis";
import type { FlashcardItem } from "@/app/api/flashcards/route";
import { getTodayIsoDate, loadProgress, toggleBookmarkSlug } from "@/lib/progress";
import { useAuth } from "@/components/AuthProvider";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BackupProgressModal } from "@/components/BackupProgressModal";

interface ModuleLite {
  slug: string;
  title: string;
  stage: string;
  order: number;
}

interface Props {
  modules: ModuleLite[];
  quizTitles: Record<string, string>;
  readingTitles: Record<string, string>;
}

type Tab = "kosakata" | "roadmap" | "riwayat";
type MemoryStatus = "baru" | "ulang" | "kuat" | "proses";

const STAGES = ["A0", "A1", "A2", "B1", "B2", "C1"];

const STATUS_LABEL: Record<MemoryStatus, string> = {
  baru: "Baru",
  ulang: "Perlu diulang",
  proses: "Sedang diulang",
  kuat: "Hafal kuat",
};

export function ProfileDashboardClient({ modules, quizTitles, readingTitles }: Props) {
  const { user, syncStatus, openAuthModal, signOut } = useAuth();
  const [progress, setProgress] = useState<LinggisProgress | null>(null);
  const [tab, setTab] = useState<Tab>("kosakata");
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MemoryStatus | "semua">("semua");
  const [backupOpen, setBackupOpen] = useState(false);

  const refresh = useCallback(() => setProgress(loadProgress().progress), []);

  useEffect(() => {
    refresh();
    window.addEventListener("linggis-progress-updated", refresh);
    window.addEventListener("linggis-progress-synced", refresh);
    return () => {
      window.removeEventListener("linggis-progress-updated", refresh);
      window.removeEventListener("linggis-progress-synced", refresh);
    };
  }, [refresh]);

  const bookmarkKey = progress?.bookmarks.join(",") ?? "";
  useEffect(() => {
    if (!bookmarkKey) {
      setCards([]);
      return;
    }
    let cancelled = false;
    setLoadingCards(true);
    fetch(`/api/flashcards?slugs=${encodeURIComponent(bookmarkKey)}`)
      .then((r) => (r.ok ? r.json() : { cards: [] }))
      .then((d: { cards?: FlashcardItem[] }) => {
        if (!cancelled) setCards(d.cards ?? []);
      })
      .catch(() => !cancelled && setCards([]))
      .finally(() => !cancelled && setLoadingCards(false));
    return () => {
      cancelled = true;
    };
  }, [bookmarkKey]);

  const today = getTodayIsoDate();
  const statusOf = useCallback(
    (slug: string): MemoryStatus => {
      const fc = progress?.flashcards[slug];
      if (!fc || fc.repetitions === 0) return "baru";
      if (fc.intervalDays >= 7) return "kuat";
      if (fc.nextReviewDate <= today) return "ulang";
      return "proses";
    },
    [progress, today]
  );

  const stats = useMemo(() => {
    if (!progress) return null;
    const strong = progress.bookmarks.filter((s) => statusOf(s) === "kuat").length;
    const due = progress.bookmarks.filter((s) => statusOf(s) === "ulang").length;
    const moduleSet = new Set(modules.map((m) => m.slug));
    const doneModules = progress.completedModules.filter((s) => moduleSet.has(s)).length;
    const quizzes = progress.quizHistory.filter((q) => q.total > 0);
    const accuracy = quizzes.length
      ? Math.round(
          (quizzes.reduce((a, q) => a + q.score / q.total, 0) / quizzes.length) * 100
        )
      : null;
    return {
      strong,
      due,
      doneModules,
      readings: progress.completedReadings.length,
      accuracy,
      quizCount: quizzes.length,
    };
  }, [progress, modules, statusOf]);

  if (!progress || !stats) {
    return <p className="text-sm text-[var(--ink-secondary)]">Memuat profil…</p>;
  }

  const completed = new Set(progress.completedModules);
  const visibleCards = cards.filter(
    (c) => statusFilter === "semua" || statusOf(c.slug) === statusFilter
  );

  const removeWord = (slug: string) => {
    toggleBookmarkSlug(slug);
    refresh();
  };

  const syncLabel =
    syncStatus === "syncing"
      ? "Menyinkronkan…"
      : syncStatus === "error"
        ? "Gagal sinkron, akan dicoba lagi"
        : "Tersinkronisasi dengan cloud";

  const btn =
    "min-h-[38px] px-3 py-1.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-1.5 transition-colors cursor-pointer";

  return (
    <div className="space-y-8">
      {/* Header akun */}
      <section className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-[var(--ink-tertiary)] font-medium">
            Profil belajar
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink-primary)] truncate">
            {user?.email ?? "Tamu"}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)] inline-flex items-center gap-1.5">
            {user ? (
              <>
                {syncStatus === "syncing" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Cloud className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.75} />
                )}
                {syncLabel}
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4" strokeWidth={1.75} />
                Tersimpan di browser ini saja. Masuk agar progres aman di cloud.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" onClick={() => setBackupOpen(true)} className={btn}>
            <ArchiveRestore className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.75} />
            Cadangan data
          </button>
          {user ? (
            <button type="button" onClick={() => void signOut()} className={btn}>
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
              Keluar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="min-h-[38px] px-3.5 py-1.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" strokeWidth={1.75} />
              Masuk ke akun
            </button>
          )}
        </div>
      </section>

      {/* Metrik */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Bookmark className="w-4 h-4" strokeWidth={1.75} />}
          label="Kosakata tersimpan"
          value={String(progress.bookmarks.length)}
          note={`${stats.strong} hafal kuat · ${stats.due} perlu diulang`}
        />
        <StatCard
          icon={<MapIcon className="w-4 h-4" strokeWidth={1.75} />}
          label="Modul roadmap"
          value={`${stats.doneModules}/${modules.length}`}
          note={`${modules.length ? Math.round((stats.doneModules / modules.length) * 100) : 0}% selesai`}
        />
        <StatCard
          icon={<BookOpen className="w-4 h-4" strokeWidth={1.75} />}
          label="Bacaan selesai"
          value={String(stats.readings)}
          note="dialog, cerita, daily talk"
        />
        <StatCard
          icon={<Target className="w-4 h-4" strokeWidth={1.75} />}
          label="Akurasi latihan"
          value={stats.accuracy === null ? "–" : `${stats.accuracy}%`}
          note={`${stats.quizCount} sesi kuis`}
        />
      </section>

      {/* Tabs */}
      <section>
        <div role="tablist" className="flex gap-1 border-b border-[var(--border-hairline)] mb-5">
          {(
            [
              ["kosakata", "Kosakata saya"],
              ["roadmap", "Silabus roadmap"],
              ["riwayat", "Riwayat latihan"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-2.5 text-sm -mb-px border-b-2 transition-colors cursor-pointer ${
                tab === key
                  ? "border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold"
                  : "border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "kosakata" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["semua", "baru", "ulang", "proses", "kuat"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs border cursor-pointer ${
                    statusFilter === s
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                      : "border-[var(--border-hairline)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {s === "semua" ? "Semua" : STATUS_LABEL[s]}
                </button>
              ))}
              {stats.due > 0 && (
                <Link
                  href="/flashcard"
                  className="ml-auto px-3 py-1.5 rounded-[6px] text-xs bg-[var(--accent-primary)] text-white font-medium"
                >
                  Ulang {stats.due} kata sekarang
                </Link>
              )}
            </div>

            {progress.bookmarks.length === 0 ? (
              <Empty text="Belum ada kata tersimpan. Simpan kata dari kamus untuk mulai menghafal." href="/" cta="Buka kamus" />
            ) : loadingCards ? (
              <p className="text-sm text-[var(--ink-secondary)]">Memuat kosakata…</p>
            ) : visibleCards.length === 0 ? (
              <p className="text-sm text-[var(--ink-secondary)]">Tidak ada kata dengan status ini.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[8px] bg-[var(--bg-surface)]">
                {visibleCards.map((c) => {
                  const st = statusOf(c.slug);
                  return (
                    <li key={c.slug} className="px-4 py-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/kamus/${c.slug}`}
                          className="font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-primary)]"
                        >
                          {c.word}
                        </Link>
                        <span className="ml-2 text-xs font-mono-ipa text-[var(--ink-tertiary)]">
                          {c.cefr_level}
                        </span>
                        <p className="text-sm text-[var(--ink-secondary)] truncate">
                          {c.translations_id.slice(0, 3).join(", ")}
                        </p>
                      </div>
                      <span
                        className={`hidden sm:inline text-xs px-2 py-0.5 rounded-[4px] border border-[var(--border-hairline)] ${
                          st === "kuat"
                            ? "text-[var(--state-correct)]"
                            : st === "ulang"
                              ? "text-[var(--state-wrong)]"
                              : "text-[var(--ink-secondary)]"
                        }`}
                      >
                        {STATUS_LABEL[st]}
                      </span>
                      <AudioPlayButton text={c.word} audioUrl={c.audio_url} compact />
                      <button
                        type="button"
                        onClick={() => removeWord(c.slug)}
                        aria-label={`Hapus ${c.word}`}
                        className="p-2 rounded-[6px] text-[var(--ink-tertiary)] hover:text-[var(--state-wrong)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {tab === "roadmap" && (
          <div className="space-y-6">
            {STAGES.map((stage) => {
              const list = modules
                .filter((m) => m.stage === stage)
                .sort((a, b) => a.order - b.order);
              if (!list.length) return null;
              const done = list.filter((m) => completed.has(m.slug)).length;
              return (
                <div key={stage}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
                      Tahap {stage}
                    </h2>
                    <span className="text-xs font-mono-ipa text-[var(--ink-secondary)]">
                      {done}/{list.length}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--bg-subtle)] mb-3">
                    <div
                      className="h-1 rounded-full bg-[var(--accent-primary)]"
                      style={{ width: `${(done / list.length) * 100}%` }}
                    />
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    {list.map((m) => {
                      const isDone = completed.has(m.slug);
                      return (
                        <li key={m.slug}>
                          <Link
                            href={`/roadmap/${m.slug}`}
                            className="flex items-center gap-2 py-1.5 text-sm hover:text-[var(--accent-primary)]"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--state-correct)] shrink-0" strokeWidth={1.75} />
                            ) : (
                              <Circle className="w-4 h-4 text-[var(--ink-tertiary)] shrink-0" strokeWidth={1.75} />
                            )}
                            <span className={isDone ? "text-[var(--ink-primary)]" : "text-[var(--ink-secondary)]"}>
                              {m.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {progress.completedReadings.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)] mb-2">
                  Bacaan yang selesai
                </h2>
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
                  {progress.completedReadings.map((slug) => (
                    <li key={slug}>
                      <Link
                        href={`/bacaan/${slug}`}
                        className="flex items-center gap-2 py-1.5 text-sm text-[var(--ink-primary)] hover:text-[var(--accent-primary)]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[var(--state-correct)] shrink-0" strokeWidth={1.75} />
                        {readingTitles[slug] ?? slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "riwayat" &&
          (progress.quizHistory.length === 0 ? (
            <Empty text="Belum ada riwayat latihan." href="/latihan" cta="Mulai latihan" />
          ) : (
            <ul className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[8px] bg-[var(--bg-surface)]">
              {progress.quizHistory.map((q) => {
                const pct = q.total ? Math.round((q.score / q.total) * 100) : 0;
                const known = q.moduleSlug in quizTitles;
                return (
                  <li key={`${q.moduleSlug}-${q.completedAt}`} className="px-4 py-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--ink-primary)] truncate">
                        {quizTitles[q.moduleSlug] ?? q.moduleSlug}
                      </p>
                      <p className="text-xs text-[var(--ink-tertiary)]">
                        {new Date(q.completedAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`font-mono-ipa text-sm ${
                        pct >= 70 ? "text-[var(--state-correct)]" : "text-[var(--ink-secondary)]"
                      }`}
                    >
                      {q.score}/{q.total} · {pct}%
                    </span>
                    {known && (
                      <Link
                        href={`/latihan/${q.moduleSlug}`}
                        aria-label="Ulangi latihan"
                        className="p-2 rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-subtle)]"
                      >
                        <RotateCw className="w-4 h-4" strokeWidth={1.75} />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          ))}
      </section>

      <BackupProgressModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
      <p className="text-xs text-[var(--ink-secondary)] inline-flex items-center gap-1.5">
        <span className="text-[var(--accent-primary)]">{icon}</span>
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-[var(--ink-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--ink-tertiary)]">{note}</p>
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--border-hairline)] p-6 text-center">
      <p className="text-sm text-[var(--ink-secondary)]">{text}</p>
      <Link href={href} className="mt-3 inline-block text-sm font-medium text-[var(--accent-primary)]">
        {cta}
      </Link>
    </div>
  );
}
