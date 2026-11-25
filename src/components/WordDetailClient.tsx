"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, BookMarked, ArrowRight } from "lucide-react";
import type { ExampleSentence, WordEntry } from "@/types/linggis";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { PronunciationPractice } from "@/components/PronunciationPractice";

interface WordDetailClientProps {
  initialWord: WordEntry;
  examples: ExampleSentence[];
}

export function WordDetailClient({
  initialWord,
  examples,
}: WordDetailClientProps) {
  const [word, setWord] = useState<WordEntry>(initialWord);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    setWord(initialWord);
  }, [initialWord]);

  useEffect(() => {
    const needsEnrich =
      !initialWord.enriched_at &&
      initialWord.definitions_en.length === 0 &&
      initialWord.word.trim().split(/\s+/).length <= 3;

    if (!needsEnrich) return;

    const controller = new AbortController();
    setEnriching(true);

    fetch(`/api/words/${encodeURIComponent(initialWord.slug)}/enrich`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { word?: WordEntry } | null) => {
        if (data?.word) {
          setWord(data.word);
        }
      })
      .catch(() => {
        // Fallback offline tetap menggunakan initialWord tanpa gangguan
      })
      .finally(() => {
        setEnriching(false);
      });

    return () => controller.abort();
  }, [initialWord]);

  return (
    <article className="space-y-8">
      {/* Header Kata Utama */}
      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded-[6px] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-mono-ipa font-medium">
            CEFR {word.cefr_level}
          </span>
          <span className="px-2.5 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
            {word.pos}
          </span>
          {word.category && (
            <span className="px-2.5 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-muted)]">
              Topik: {word.category}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-[44px] font-semibold leading-[1.15] text-[var(--ink-primary)] break-words">
            {word.word}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {word.ipa && (
              <span className="font-mono-ipa text-[var(--ink-secondary)]">
                {word.ipa}
              </span>
            )}
            {word.reading_hint_id && (
              <span className="text-[var(--ink-muted)]">
                Cara baca: <span className="font-mono-ipa text-[var(--ink-secondary)]">{word.reading_hint_id}</span>
              </span>
            )}
            {enriching && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                Memuat IPA &amp; definisi tambahan...
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <AudioPlayButton
            text={word.word}
            audioUrl={word.audio_url}
            showAccentToggle
          />
          <BookmarkButton slug={word.slug} />
        </div>
      </header>

      {/* Arti Bahasa Indonesia */}
      <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
        <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
          Arti dalam Bahasa Indonesia
        </h2>
        <ol className="list-decimal pl-5 space-y-1.5 text-base text-[var(--ink-primary)]">
          {word.translations_id.map((meaning, idx) => (
            <li key={idx} className="leading-relaxed">
              {meaning}
            </li>
          ))}
        </ol>
        {word.usage_note_id && (
          <div className="mt-4 p-3.5 rounded-[6px] bg-[var(--bg-subtle)] border-l-2 border-[var(--accent-primary)] text-sm text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">Catatan penggunaan: </span>
            {word.usage_note_id}
          </div>
        )}
      </section>

      {/* Definisi Bahasa Inggris (hasil enrichment / data inti) */}
      {word.definitions_en.length > 0 && (
        <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Definisi Bahasa Inggris
          </h2>
          <ol className="list-decimal pl-5 space-y-3 text-sm sm:text-base text-[var(--ink-secondary)]">
            {word.definitions_en.map((def, idx) => (
              <li key={idx} className="space-y-1">
                <p className="text-[var(--ink-primary)]">{def.meaning}</p>
                {def.example && (
                  <p className="text-sm italic text-[var(--ink-muted)]">
                    &ldquo;{def.example}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Contoh Kalimat Kontekstual */}
      {examples.length > 0 && (
        <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Contoh Kalimat Kontekstual
          </h2>
          <div className="divide-y divide-[var(--border-hairline)]">
            {examples.map((ex) => (
              <div key={ex.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-medium text-[var(--ink-primary)]">
                    {ex.en_text}
                  </p>
                  <p className="text-sm text-[var(--ink-secondary)]">
                    {ex.id_text}
                  </p>
                </div>
                <div className="shrink-0">
                  <AudioPlayButton text={ex.en_text} label="Putar kalimat" compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sinonim & Antonim */}
      {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
        <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Kata Terkait
          </h2>

          {word.synonyms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Sinonim
              </h3>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.map((syn) => {
                  const synSlug = syn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  return (
                    <Link
                      key={syn}
                      href={`/kamus/${encodeURIComponent(synSlug)}`}
                      className="px-3 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] text-sm transition-colors"
                    >
                      {syn}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {word.antonyms.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Antonim
              </h3>
              <div className="flex flex-wrap gap-2">
                {word.antonyms.map((ant) => {
                  const antSlug = ant.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  return (
                    <Link
                      key={ant}
                      href={`/kamus/${encodeURIComponent(antSlug)}`}
                      className="px-3 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] text-sm transition-colors"
                    >
                      {ant}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Latihan Pelafalan (Speaking) */}
      <PronunciationPractice
        targetText={word.word}
        hintText={word.reading_hint_id ?? word.ipa}
      />

      {/* Tautan Lanjutan */}
      <section className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <BookMarked className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="text-sm">
            <p className="font-semibold text-[var(--ink-primary)]">
              Ingin menghafal kata ini lebih tahan lama?
            </p>
            <p className="text-[var(--ink-secondary)]">
              Klik tombol Simpan ke Flashcard di atas, lalu latih di dek SM-2 Anda.
            </p>
          </div>
        </div>
        <Link
          href="/flashcard"
          className="min-h-[40px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 shrink-0"
        >
          Buka Flashcard
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </Link>
      </section>
    </article>
  );
}
