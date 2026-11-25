"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Search, ArrowLeft, ArrowRight, Play, Square } from "lucide-react";
import type {
  CefrLevel,
  ConversationPassage,
  PhraseGroup,
  ReadingPassage,
  RelatableScenario,
} from "@/types/linggis";
import { loadProgress, toggleCompletedReading } from "@/lib/progress";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { PronunciationPractice } from "@/components/PronunciationPractice";
import {
  ClickableEnglishSentence,
  WordQuickLookupDrawer,
} from "@/components/WordQuickLookupDrawer";
import { speakEnglish } from "@/lib/speech";

export type BacaanPayload =
  | { kind: "passage"; data: ReadingPassage; slug: string }
  | { kind: "conversation"; data: ConversationPassage; slug: string }
  | { kind: "relatable"; data: RelatableScenario; slug: string }
  | { kind: "phrases"; data: PhraseGroup; slug: string };

interface BacaanDetailClientProps {
  payload: BacaanPayload;
  prevItem: { slug: string; title: string } | null;
  nextItem: { slug: string; title: string } | null;
}

function toPhraseSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractEnglishLines(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.replace(/[*_`>#|]/g, "").trim())
    .filter((line) => {
      if (line.length < 15) return false;
      // Prioritaskan baris dengan karakter huruf Latin umum & tanda kalimat Inggris
      const hasIndonesianHints =
        /\b(yang|adalah|artinya|dalam|bahasa|dengan|untuk|pada|dan|atau|tidak|saya|kamu|mereka|kita)\b/i.test(
          line
        );
      return !hasIndonesianHints && /[a-zA-Z]/.test(line);
    })
    .slice(0, 6);
}

export function BacaanDetailClient({
  payload,
  prevItem,
  nextItem,
}: BacaanDetailClientProps) {
  const [done, setDone] = useState(false);
  const [phraseQuery, setPhraseQuery] = useState("");
  const [lookupWord, setLookupWord] = useState<string | null>(null);
  const [quickWordInput, setQuickWordInput] = useState("");
  const [shadowIndex, setShadowIndex] = useState<number | null>(null);
  const [shadowPhase, setShadowPhase] = useState<"idle" | "speaking" | "pausing">("idle");
  const shadowActiveRef = useRef(false);
  const shadowTimerRef = useRef<number | null>(null);

  const stopShadowing = () => {
    shadowActiveRef.current = false;
    if (shadowTimerRef.current) {
      window.clearTimeout(shadowTimerRef.current);
      shadowTimerRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    setShadowIndex(null);
    setShadowPhase("idle");
  };

  useEffect(() => {
    return () => {
      const wasActive = shadowActiveRef.current;
      shadowActiveRef.current = false;
      if (shadowTimerRef.current) window.clearTimeout(shadowTimerRef.current);
      if (wasActive && typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const runShadowingStep = (turns: ConversationPassage["turns"], idx: number) => {
    if (!shadowActiveRef.current || idx >= turns.length) {
      stopShadowing();
      return;
    }
    setShadowIndex(idx);
    setShadowPhase("speaking");
    speakEnglish(turns[idx].en, {
      onEnd: () => {
        if (!shadowActiveRef.current) return;
        setShadowPhase("pausing");
        shadowTimerRef.current = window.setTimeout(() => {
          runShadowingStep(turns, idx + 1);
        }, 3000);
      },
    });
  };

  const startShadowing = (turns: ConversationPassage["turns"]) => {
    stopShadowing();
    shadowActiveRef.current = true;
    runShadowingStep(turns, 0);
  };

  useEffect(() => {
    const { progress } = loadProgress();
    setDone((progress.completedReadings ?? []).includes(payload.slug));
  }, [payload.slug]);

  const handleToggleDone = () => {
    const updated = toggleCompletedReading(payload.slug);
    setDone(updated.completedReadings.includes(payload.slug));
  };

  let title = "";
  let subtitle = "";
  let cefr: CefrLevel = "A1";
  let badge = "";

  if (payload.kind === "passage") {
    title = payload.data.title;
    subtitle = payload.data.subtitle ?? "";
    cefr = payload.data.cefr;
    badge = payload.data.category.replace("_", " ").toUpperCase();
  } else if (payload.kind === "conversation") {
    title = payload.data.title;
    subtitle = payload.data.subtitle;
    cefr = payload.data.cefr;
    badge = "DIALOG AUDIO";
  } else if (payload.kind === "relatable") {
    title = payload.data.title;
    subtitle = payload.data.situation;
    cefr = payload.data.cefr;
    badge = "BAHASA NATURAL";
  } else {
    title = payload.data.title;
    subtitle = payload.data.subtitle ?? `${payload.data.items.length} ungkapan`;
    cefr = payload.data.cefr;
    badge = payload.data.kind.replace("_", " ").toUpperCase();
  }

  const filteredPhrases = useMemo(() => {
    if (payload.kind !== "phrases") return [];
    const q = phraseQuery.trim().toLowerCase();
    if (!q) return payload.data.items;
    return payload.data.items.filter(
      (it) =>
        it.en.toLowerCase().includes(q) || it.id.toLowerCase().includes(q)
    );
  }, [payload, phraseQuery]);

  const passageAudioExcerpt = useMemo(() => {
    if (payload.kind !== "passage") return "";
    return extractEnglishLines(payload.data.markdown).join(". ");
  }, [payload]);

  return (
    <article className="space-y-8">
      {/* Header */}
      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-[6px] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-mono-ipa font-medium">
              CEFR {cefr}
            </span>
            <span className="px-2.5 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] font-mono-ipa">
              {badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleDone}
            aria-pressed={done}
            className={`min-h-[40px] px-4 py-2 rounded-[6px] border text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
              done
                ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)] text-[var(--state-correct)]"
                : "border-[var(--accent-primary)] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
            }`}
          >
            {done ? (
              <>
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                Sudah Dibaca
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" strokeWidth={1.75} />
                Tandai Sudah Dibaca
              </>
            )}
          </button>
        </div>

        <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-[var(--ink-secondary)]">{subtitle}</p>
        )}

        {payload.kind === "passage" && passageAudioExcerpt && (
          <div className="pt-2">
            <AudioPlayButton
              text={passageAudioExcerpt}
              label="Dengarkan cuplikan kalimat Inggris"
              showAccentToggle
            />
          </div>
        )}
      </header>

      {/* Isi berdasarkan tipe */}
      {payload.kind === "passage" && (
        <section className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickWordInput.trim()) {
                setLookupWord(quickWordInput.trim());
              }
            }}
            className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <span className="text-xs sm:text-sm text-[var(--ink-secondary)]">
              Menemukan kata asing di bacaan ini? Cek artinya tanpa keluar halaman:
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <input
                id="passage-quick-lookup"
                name="quickLookup"
                type="search"
                value={quickWordInput}
                onChange={(e) => setQuickWordInput(e.target.value)}
                placeholder="Ketik kata Inggris..."
                className="min-h-[36px] px-3 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="submit"
                className="min-h-[36px] px-3 py-1 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-medium cursor-pointer"
              >
                Cek Arti
              </button>
            </div>
          </form>

          <div className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            <MarkdownRenderer content={payload.data.markdown} />
          </div>
        </section>
      )}

      {payload.kind === "conversation" && (
        <section className="space-y-4">
          <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm text-[var(--ink-secondary)]">
                Klik <strong>Dengar</strong> per baris, atau gunakan <strong>Mode Shadowing</strong> (jeda 3 detik tiap kalimat untuk menirukan).
              </p>
              {shadowPhase !== "idle" && shadowIndex !== null && (
                <p className="text-xs font-mono-ipa text-[var(--accent-primary)] font-medium">
                  {shadowPhase === "speaking"
                    ? `Memutar baris ${shadowIndex + 1} dari ${payload.data.turns.length}...`
                    : `Giliran Anda menirukan baris ${shadowIndex + 1} (jeda 3 detik)...`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {shadowPhase === "idle" ? (
                <button
                  type="button"
                  onClick={() => startShadowing(payload.data.turns)}
                  className="min-h-[40px] px-3.5 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4" strokeWidth={1.75} />
                  Mode Shadowing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopShadowing}
                  className="min-h-[40px] px-3.5 py-2 rounded-[6px] bg-[var(--state-wrong)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-4 h-4" strokeWidth={1.75} />
                  Hentikan Shadowing
                </button>
              )}
              <AudioPlayButton
                text={payload.data.turns.map((t) => t.en).join(". ")}
                label="Putar Semua"
                showAccentToggle
              />
            </div>
          </div>

          <div className="space-y-3">
            {payload.data.turns.map((turn, idx) => {
              const isShadowActive = shadowIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-[8px] border flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors ${
                    isShadowActive
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)]/35"
                      : "border-[var(--border-hairline)] bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="text-xs font-mono-ipa font-semibold text-[var(--accent-primary)] uppercase tracking-wider">
                      {turn.speaker}
                    </div>
                    <p className="font-display text-lg font-medium text-[var(--ink-primary)] leading-snug">
                      <ClickableEnglishSentence
                        text={turn.en}
                        onSelectWord={setLookupWord}
                      />
                    </p>
                    <p className="text-sm text-[var(--ink-secondary)]">
                      {turn.id}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <AudioPlayButton text={turn.en} label="Dengar" compact />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {payload.kind === "relatable" && (
        <section className="space-y-5">
          <div className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
              Situasi &amp; Pertanyaan
            </h2>
            <p className="text-base text-[var(--ink-secondary)]">
              {payload.data.question}
            </p>
            {payload.data.prompt_en && (
              <div className="p-4 rounded-[8px] bg-[var(--bg-paper)] border border-[var(--border-hairline)] space-y-1">
                <p className="font-medium text-[var(--ink-primary)]">
                  &ldquo;{payload.data.prompt_en}&rdquo;
                </p>
                <p className="text-sm text-[var(--ink-secondary)]">
                  {payload.data.prompt_id}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-[8px] border border-[var(--state-correct)] bg-[var(--accent-primary-tint)]/40 space-y-3">
            <div className="text-xs font-mono-ipa font-semibold uppercase tracking-wider text-[var(--state-correct)]">
              Ungkapan Natural Penutur Asli
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
                  <ClickableEnglishSentence
                    text={payload.data.correct_en}
                    onSelectWord={setLookupWord}
                  />
                </p>
                <p className="text-sm text-[var(--ink-secondary)] mt-1">
                  {payload.data.correct_id}
                </p>
              </div>
              <AudioPlayButton text={payload.data.correct_en} label="Dengar" />
            </div>
            <p className="text-sm text-[var(--ink-primary)] pt-2 border-t border-[var(--border-hairline)]">
              {payload.data.correct_reason}
            </p>
          </div>

          {payload.data.distractors.length > 0 && (
            <div className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
              <h3 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                Ungkapan yang Kurang Tepat / Terlalu Kaku
              </h3>
              <ul className="space-y-3">
                {payload.data.distractors.map((dist, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-1"
                  >
                    <div className="font-medium text-sm text-[var(--state-wrong)]">
                      {dist}
                    </div>
                    {payload.data.wrong_reasons[idx] && (
                      <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                        {payload.data.wrong_reasons[idx]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {payload.data.tip && (
                <p className="text-sm text-[var(--ink-secondary)] pt-2">
                  <strong className="text-[var(--ink-primary)]">Tips cepat: </strong>
                  {payload.data.tip}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {payload.kind === "phrases" && (
        <section className="space-y-4">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              id="phrase-filter-input"
              name="phraseQuery"
              type="search"
              value={phraseQuery}
              onChange={(e) => setPhraseQuery(e.target.value)}
              placeholder={`Cari di dalam ${payload.data.items.length} ungkapan...`}
              aria-label="Saring ungkapan dalam lembar ini"
              className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="divide-y divide-[var(--border-hairline)] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {filteredPhrases.map((item, idx) => {
              const phraseSlug = toPhraseSlug(item.en);
              return (
                <div
                  key={`${phraseSlug}-${idx}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-display text-lg font-semibold text-[var(--ink-primary)] break-words">
                      <ClickableEnglishSentence
                        text={item.en}
                        onSelectWord={setLookupWord}
                      />
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

      {/* Navigasi Prev/Next */}
      {(payload.kind === "conversation" && payload.data.turns[0]) && (
        <PronunciationPractice
          title="Latihan Ucap Dialog (Speaking)"
          targetText={payload.data.turns[0].en}
        />
      )}
      {payload.kind === "relatable" && (
        <PronunciationPractice
          title="Latih Ungkapan Natural Ini"
          targetText={payload.data.correct_en}
        />
      )}

      <WordQuickLookupDrawer
        word={lookupWord}
        onClose={() => setLookupWord(null)}
      />

      <nav
        aria-label="Navigasi antar materi bacaan"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
      >
        {prevItem ? (
          <Link
            href={`/bacaan/${encodeURIComponent(prevItem.slug)}`}
            className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] space-y-1"
          >
            <div className="text-xs text-[var(--ink-muted)] inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Materi Sebelumnya
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)] line-clamp-1">
              {prevItem.title}
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextItem && (
          <Link
            href={`/bacaan/${encodeURIComponent(nextItem.slug)}`}
            className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] space-y-1 sm:text-right"
          >
            <div className="text-xs text-[var(--accent-primary)] inline-flex items-center sm:justify-end gap-1 w-full">
              Materi Berikutnya
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </div>
            <div className="font-display font-semibold text-base text-[var(--ink-primary)] line-clamp-1">
              {nextItem.title}
            </div>
          </Link>
        )}
      </nav>
    </article>
  );
}
