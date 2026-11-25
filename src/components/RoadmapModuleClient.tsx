"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Target,
  Lightbulb,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import type { RoadmapModule, WordEntry } from "@/types/linggis";
import { loadProgress, toggleCompletedModule } from "@/lib/progress";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface RoadmapModuleClientProps {
  mod: RoadmapModule;
  keyVocabEntries: WordEntry[];
  prevModule: { slug: string; title: string; cefr_level: string } | null;
  nextModule: { slug: string; title: string; cefr_level: string } | null;
}

function toPhraseSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TRACK_NAMES: Record<RoadmapModule["track"], string> = {
  fondasi: "Jalur Fondasi",
  hafalan: "Jalur Hafalan",
  grammar: "Jalur Grammar",
  praktik: "Jalur Praktik",
};

export function RoadmapModuleClient({
  mod,
  keyVocabEntries,
  prevModule,
  nextModule,
}: RoadmapModuleClientProps) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const { progress } = loadProgress();
    setCompleted(progress.completedModules.includes(mod.slug));
  }, [mod.slug]);

  const handleToggleDone = () => {
    const updated = toggleCompletedModule(mod.slug);
    setCompleted(updated.completedModules.includes(mod.slug));
  };

  return (
    <article className="space-y-8">
      {/* Header Modul */}
      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-mono-ipa font-medium">
              Tahap {mod.cefr_level}
            </span>
            <span className="px-2.5 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
              {TRACK_NAMES[mod.track]}
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--ink-muted)]">
              <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
              {mod.estimated_minutes} menit
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleDone}
            aria-pressed={completed}
            className={`min-h-[40px] px-4 py-2 rounded-[6px] border text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
              completed
                ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)] text-[var(--state-correct)]"
                : "border-[var(--accent-primary)] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                Modul Selesai
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" strokeWidth={1.75} />
                Tandai Selesai
              </>
            )}
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
            {mod.title}
          </h1>
          <p className="text-base text-[var(--ink-secondary)]">
            {mod.subtitle}
          </p>
        </div>

        {/* Tujuan & Cara Belajar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-1.5">
            <div className="text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1.5 uppercase tracking-wide">
              <Target className="w-3.5 h-3.5" strokeWidth={1.75} />
              Target Belajar
            </div>
            <p className="text-sm text-[var(--ink-primary)] leading-relaxed">
              {mod.learning_goal}
            </p>
          </div>
          <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-1.5">
            <div className="text-xs font-semibold text-[var(--accent-warm)] flex items-center gap-1.5 uppercase tracking-wide">
              <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} />
              Cara Mempelajari Modul Ini
            </div>
            <p className="text-sm text-[var(--ink-primary)] leading-relaxed">
              {mod.how_to_study}
            </p>
          </div>
        </div>
      </header>

      {/* Isi Materi Utama (Editorial Prose) */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <MarkdownRenderer content={mod.markdown} />
      </section>

      {/* Frasa / Kosakata Kunci Interaktif + Audio + Bookmark */}
      {mod.key_phrases.length > 0 && (
        <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
              Latihan Ucap &amp; Simpan Frasa Kunci
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Dengarkan pelafalan tiap ungkapan dan simpan yang masih sulit ke Flashcard Anda.
            </p>
          </div>

          <div className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[8px]">
            {mod.key_phrases.slice(0, 35).map((item, idx) => {
              const phraseSlug = toPhraseSlug(item.en);
              return (
                <div
                  key={`${phraseSlug}-${idx}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)]"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-display text-lg font-semibold text-[var(--ink-primary)] break-words">
                      {item.en}
                    </div>
                    {item.read_hint && (
                      <div className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                        baca: {item.read_hint}
                      </div>
                    )}
                    <div className="text-sm text-[var(--ink-secondary)]">
                      {item.id}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <AudioPlayButton text={item.en} label="Dengar" compact />
                    <BookmarkButton slug={phraseSlug} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Kosakata Kamus Terkait */}
      {keyVocabEntries.length > 0 && (
        <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Kosakata Kamus Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {keyVocabEntries.map((word) => (
              <div
                key={word.slug}
                className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <Link
                    href={`/kamus/${encodeURIComponent(word.slug)}`}
                    className="font-display font-semibold text-base text-[var(--ink-primary)] hover:text-[var(--accent-primary)] inline-flex items-center gap-1"
                  >
                    {word.word}
                    <ExternalLink className="w-3 h-3 text-[var(--ink-muted)]" strokeWidth={1.75} />
                  </Link>
                  <p className="text-xs text-[var(--ink-secondary)] truncate">
                    {word.translations_id.slice(0, 2).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <AudioPlayButton text={word.word} label="Putar" compact />
                  <BookmarkButton slug={word.slug} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Aksi Selesai + Latihan Modul */}
      <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-[var(--ink-primary)] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.75} />
            Uji Pemahaman Materi Ini
          </div>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
            Kerjakan kuis interaktif agar hafalan dan pola kalimat langsung menempel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleDone}
            className={`min-h-[42px] px-4 py-2 rounded-[6px] border text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer ${
              completed
                ? "border-[var(--state-correct)] bg-[var(--bg-surface)] text-[var(--state-correct)]"
                : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-primary)] hover:bg-[var(--bg-paper)]"
            }`}
          >
            {completed ? (
              <>
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                Sudah Selesai
              </>
            ) : (
              "Tandai Selesai"
            )}
          </button>

          {mod.quiz_module_slug && (
            <Link
              href={`/latihan/${encodeURIComponent(mod.quiz_module_slug)}`}
              className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5"
            >
              Kerjakan Latihan Modul Ini
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          )}
        </div>
      </section>

      {/* Navigasi Modul Sebelumnya / Berikutnya */}
      <nav
        aria-label="Navigasi urutan modul roadmap"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
      >
        {prevModule ? (
          <Link
            href={`/roadmap/${encodeURIComponent(prevModule.slug)}`}
            className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors space-y-1"
          >
            <div className="text-xs text-[var(--ink-muted)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Modul Sebelumnya ({prevModule.cefr_level})
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)] line-clamp-1">
              {prevModule.title}
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextModule && (
          <Link
            href={`/roadmap/${encodeURIComponent(nextModule.slug)}`}
            className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors space-y-1 sm:text-right"
          >
            <div className="text-xs text-[var(--accent-primary)] inline-flex items-center sm:justify-end gap-1 w-full">
              Modul Berikutnya ({nextModule.cefr_level})
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)] line-clamp-1">
              {nextModule.title}
            </div>
          </Link>
        )}
      </nav>
    </article>
  );
}

