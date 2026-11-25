"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Volume2, ListChecks, Shuffle, MessageCircle, FileText, Layers, History } from "lucide-react";
import type { CefrLevel, QuizHistoryEntry, QuizPack } from "@/types/linggis";
import { loadProgress } from "@/lib/progress";
import { AccountSyncBanner } from "@/components/AccountSyncBanner";

export interface QuizPackSummary {
  slug: string;
  title: string;
  category: QuizPack["category"];
  description: string;
  difficulty: CefrLevel;
  question_count: number;
}

interface LatihanHubClientProps {
  packs: QuizPackSummary[];
}

const CATEGORY_TABS: Array<{ key: "SEMUA" | QuizPack["category"]; label: string }> = [
  { key: "SEMUA", label: "Semua Paket" },
  { key: "kalimat_rumpang", label: "Kalimat Rumpang" },
  { key: "ujian", label: "Ujian Grammar & Topik" },
  { key: "kosa_kata", label: "Kosakata CEFR" },
  { key: "listening", label: "Tebak Audio (Listening)" },
  { key: "susun_kata", label: "Susun Kalimat" },
  { key: "percakapan", label: "Respon Percakapan" },
];

const CATEGORY_META: Record<
  QuizPack["category"],
  { label: string; icon: "list" | "audio" | "shuffle" | "chat" | "file" | "layers" }
> = {
  roadmap: { label: "Modul Roadmap", icon: "layers" },
  ujian: { label: "Ujian Topik", icon: "file" },
  kosa_kata: { label: "Kosakata", icon: "layers" },
  kalimat_rumpang: { label: "Kalimat Rumpang", icon: "list" },
  percakapan: { label: "Percakapan", icon: "chat" },
  listening: { label: "Listening Audio", icon: "audio" },
  susun_kata: { label: "Susun Kalimat", icon: "shuffle" },
};

function CategoryIcon({ kind }: { kind: "list" | "audio" | "shuffle" | "chat" | "file" | "layers" }) {
  const cls = "w-4 h-4 text-[var(--accent-primary)]";
  if (kind === "audio") return <Volume2 className={cls} strokeWidth={1.75} />;
  if (kind === "shuffle") return <Shuffle className={cls} strokeWidth={1.75} />;
  if (kind === "chat") return <MessageCircle className={cls} strokeWidth={1.75} />;
  if (kind === "file") return <FileText className={cls} strokeWidth={1.75} />;
  if (kind === "layers") return <Layers className={cls} strokeWidth={1.75} />;
  return <ListChecks className={cls} strokeWidth={1.75} />;
}

export function LatihanHubClient({ packs }: LatihanHubClientProps) {
  const [selectedCat, setSelectedCat] = useState<"SEMUA" | QuizPack["category"]>("SEMUA");
  const [cefrFilter, setCefrFilter] = useState<"SEMUA" | CefrLevel>("SEMUA");
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    const refresh = () => {
      const { progress } = loadProgress();
      setHistory(progress.quizHistory ?? []);
    };
    refresh();
    window.addEventListener("linggis-progress-updated", refresh);
    window.addEventListener("linggis-progress-synced", refresh);
    return () => {
      window.removeEventListener("linggis-progress-updated", refresh);
      window.removeEventListener("linggis-progress-synced", refresh);
    };
  }, []);

  const latestScoreBySlug = useMemo(() => {
    const map = new Map<string, QuizHistoryEntry>();
    for (const h of history) {
      map.set(h.moduleSlug, h);
    }
    return map;
  }, [history]);

  const filteredPacks = useMemo(() => {
    return packs.filter((p) => {
      if (selectedCat !== "SEMUA" && p.category !== selectedCat) return false;
      if (cefrFilter !== "SEMUA" && p.difficulty !== cefrFilter) return false;
      return true;
    });
  }, [packs, selectedCat, cefrFilter]);

  return (
    <div className="space-y-6">
      <AccountSyncBanner />

      {/* Header */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
              Latihan Aktif &amp; Evaluasi Mandiri
            </p>
            <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
              Pusat Latihan &amp; Kuis Bahasa Inggris
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              Pilih paket soal sesuai fokus belajar Anda: melengkapi kalimat bertahap, ujian grammar per topik, kosakata, tebak audio listening, hingga menyusun kata.
            </p>
          </div>
          <div className="px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono-ipa text-[var(--ink-secondary)] shrink-0 self-start md:self-auto">
            {latestScoreBySlug.size} paket pernah dikerjakan
          </div>
        </div>
      </section>

      {/* Mode Latihan Khusus: Tes Level, Dikte, Pola Kalimat & Irregular Verbs */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          href="/latihan/tes-level"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-2"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
              Tes Penempatan
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Cek Level Awal (A0–B2)
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              12 soal cepat untuk mengetahui modul Roadmap yang paling pas untuk Anda.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] pt-1">
            Mulai Tes Level →
          </span>
        </Link>

        <Link
          href="/latihan/dikte"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-2"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-warm)] font-semibold">
              Listening &amp; Spelling
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Latihan Dikte Audio
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              Dengarkan kalimat percakapan lalu ketik ulang untuk melatih ejaan.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] pt-1">
            Mulai Dikte →
          </span>
        </Link>

        <Link
          href="/latihan/pola-kalimat"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-2"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
              Sentence Builder
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Rangkai Pola Kalimat
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              Latih merangkai variasi pola kalimat siap pakai untuk bicara sehari-hari.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] pt-1">
            Buka Studio Pola →
          </span>
        </Link>

        <Link
          href="/cheatsheet/irregular-verbs"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-2"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-warm)] font-semibold">
              V1 – V2 – V3
            </span>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Kuis Irregular Verbs
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              Hafalkan 52 kata kerja tak beraturan lewat kemiripan pola bunyi.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] pt-1">
            Buka Irregular Verbs →
          </span>
        </Link>
      </section>

      {/* Filter Bar */}
      {history.length > 0 && (
        <section className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-primary)]">
            <History className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.75} />
            Riwayat Latihan Terakhir
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {history
              .slice(-6)
              .reverse()
              .map((entry, idx) => {
                const packInfo = packs.find((p) => p.slug === entry.moduleSlug);
                const pct =
                  entry.total > 0
                    ? Math.round((entry.score / entry.total) * 100)
                    : 0;
                return (
                  <Link
                    key={`${entry.moduleSlug}-${idx}`}
                    href={`/latihan/${encodeURIComponent(entry.moduleSlug)}`}
                    className="p-3 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[var(--ink-primary)] truncate">
                        {packInfo?.title ?? entry.moduleSlug}
                      </div>
                      <div className="text-[var(--ink-muted)] font-mono-ipa mt-0.5">
                        {entry.completedAt.slice(0, 10)}
                      </div>
                    </div>
                    <span className="font-mono-ipa font-semibold text-[var(--accent-primary)] shrink-0">
                      {entry.score}/{entry.total} ({pct}%)
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {/* Filter Bar */}
      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCat === tab.key;
            const count =
              tab.key === "SEMUA"
                ? packs.length
                : packs.filter((p) => p.category === tab.key).length;
            if (count === 0 && tab.key !== "SEMUA") return null;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCat(tab.key)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-[6px] border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white font-medium"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {tab.label}{" "}
                <span className={active ? "text-white/80" : "text-[var(--ink-muted)]"}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[var(--ink-muted)] mr-1">Level:</span>
          {(["SEMUA", "A1", "A2", "B1", "B2"] as const).map((lvl) => {
            const active = cefrFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setCefrFilter(lvl)}
                className={`px-2.5 py-1 text-xs font-mono-ipa rounded-[6px] border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {lvl === "SEMUA" ? "Semua Level" : lvl}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid Paket Latihan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPacks.map((pack) => {
          const meta = CATEGORY_META[pack.category];
          const prevResult = latestScoreBySlug.get(pack.slug);
          return (
            <Link
              key={pack.slug}
              href={`/latihan/${encodeURIComponent(pack.slug)}`}
              className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] font-medium">
                    <CategoryIcon kind={meta.icon} />
                    {meta.label}
                  </span>
                  <span className="font-mono-ipa text-[var(--ink-muted)]">
                    CEFR {pack.difficulty}
                  </span>
                </div>

                <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)] leading-snug">
                  {pack.title}
                </h2>
                <p className="text-sm text-[var(--ink-secondary)] line-clamp-2">
                  {pack.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-ipa text-[var(--ink-muted)]">
                  {pack.question_count} soal
                </span>

                {prevResult ? (
                  <span className="inline-flex items-center gap-1 font-mono-ipa text-[var(--state-correct)] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Terakhir: {prevResult.score}/{prevResult.total}
                  </span>
                ) : (
                  <span className="font-medium text-[var(--accent-primary)]">
                    Mulai Kuis
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

