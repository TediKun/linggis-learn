"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Loader2, ArrowRight, Sparkles } from "lucide-react";
import type { WordSearchHit } from "@/types/linggis";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";

interface ClickableEnglishSentenceProps {
  text: string;
  onSelectWord: (word: string) => void;
  className?: string;
}

export function ClickableEnglishSentence({
  text,
  onSelectWord,
  className = "",
}: ClickableEnglishSentenceProps) {
  const tokens = text.split(/(\s+)/);

  return (
    <span className={className}>
      {tokens.map((tok, idx) => {
        if (/^\s+$/.test(tok)) {
          return <span key={idx}>{tok}</span>;
        }
        const clean = tok.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
        if (clean.length < 2) {
          return <span key={idx}>{tok}</span>;
        }
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectWord(clean)}
            title={`Lihat arti kata "${clean}"`}
            className="inline rounded-[4px] px-0.5 -mx-0.5 hover:bg-[var(--accent-primary-tint)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer text-left"
          >
            {tok}
          </button>
        );
      })}
    </span>
  );
}

interface WordQuickLookupDrawerProps {
  word: string | null;
  onClose: () => void;
}

export function WordQuickLookupDrawer({
  word,
  onClose,
}: WordQuickLookupDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [hit, setHit] = useState<{
    slug: string;
    word: string;
    pos: string;
    cefr_level: string;
    meaning_id: string;
    reading_hint: string | null;
  } | null>(null);

  useEffect(() => {
    if (!word) {
      setHit(null);
      return;
    }

    const clean = word.trim().toLowerCase();
    const controller = new AbortController();
    setLoading(true);
    setHit(null);

    fetch(`/api/words/search?q=${encodeURIComponent(clean)}&limit=4`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        async (
          data: {
            hits?: WordSearchHit[];
            suggestions?: WordSearchHit[];
          } | null
        ) => {
          const exact =
            data?.hits?.find((h) => h.word.toLowerCase() === clean) ??
            data?.hits?.[0];

          if (exact) {
            setHit({
              slug: exact.slug,
              word: exact.word,
              pos: exact.pos,
              cefr_level: exact.cefr_level,
              meaning_id: exact.short_meaning_id,
              reading_hint: exact.reading_hint_id ?? exact.ipa,
            });
            return;
          }

          // Coba fallback kamus daring
          const extRes = await fetch(
            `/api/words/external?word=${encodeURIComponent(clean)}`,
            { signal: controller.signal }
          );
          if (extRes.ok) {
            const extData = (await extRes.json()) as {
              found?: boolean;
              word?: {
                slug: string;
                word: string;
                pos: string;
                cefr_level: string;
                translations_id: string[];
                definitions_en: Array<{ meaning: string }>;
                ipa: string | null;
              } | null;
            };
            if (extData.found && extData.word) {
              setHit({
                slug: extData.word.slug,
                word: extData.word.word,
                pos: extData.word.pos,
                cefr_level: extData.word.cefr_level,
                meaning_id:
                  extData.word.translations_id[0] ??
                  extData.word.definitions_en[0]?.meaning ??
                  "Lihat detail kamus",
                reading_hint: extData.word.ipa,
              });
              return;
            }
          }

          const fallback = data?.suggestions?.[0];
          if (fallback) {
            setHit({
              slug: fallback.slug,
              word: fallback.word,
              pos: fallback.pos,
              cefr_level: fallback.cefr_level,
              meaning_id: fallback.short_meaning_id,
              reading_hint: fallback.reading_hint_id ?? fallback.ipa,
            });
          }
        }
      )
      .catch(() => {
        // Ignore abort
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [word]);

  if (!word) return null;

  const targetSlug =
    hit?.slug ??
    word
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (
    <div
      role="dialog"
      aria-label={`Kamus cepat untuk ${word}`}
      className="fixed bottom-4 left-4 right-4 z-40 max-w-[680px] mx-auto rounded-[8px] border border-[var(--accent-primary)] bg-[var(--bg-surface)] p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
              Kamus Cepat (Click-to-Lookup)
            </span>
            {hit && (
              <span className="px-2 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] font-mono-ipa text-[var(--ink-secondary)]">
                {hit.cefr_level} · {hit.pos}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-2 flex items-center gap-2 text-sm text-[var(--ink-secondary)]">
              <Loader2
                className="w-4 h-4 animate-spin text-[var(--accent-primary)]"
                strokeWidth={1.75}
              />
              Mencari arti &ldquo;{word}&rdquo;...
            </div>
          ) : hit ? (
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
                  {hit.word}
                </span>
                {hit.reading_hint && (
                  <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                    ({hit.reading_hint})
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-[var(--ink-primary)] font-medium">
                {hit.meaning_id}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-display text-xl font-semibold text-[var(--ink-primary)]">
                {word}
              </div>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                Buka halaman kamus lengkap untuk mencari definisi daring kata ini.
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kamus cepat"
          className="p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <AudioPlayButton
            text={hit?.word ?? word}
            label="Dengar"
            compact
          />
          <BookmarkButton slug={targetSlug} compact />
        </div>
        <Link
          href={`/kamus/${encodeURIComponent(targetSlug)}`}
          className="text-xs font-medium text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
        >
          Buka Detail Kamus
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}

