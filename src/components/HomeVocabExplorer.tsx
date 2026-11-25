"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CefrLevel, VocabCategory, WordEntry } from "@/types/linggis";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";

interface HomeVocabExplorerProps {
  wordsByLevel: Record<"A1" | "A2" | "B1", WordEntry[]>;
  categories: VocabCategory[];
}

export function HomeVocabExplorer({
  wordsByLevel,
  categories,
}: HomeVocabExplorerProps) {
  const [selectedLevel, setSelectedLevel] = useState<"A1" | "A2" | "B1">("A1");
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");

  const activeWords = wordsByLevel[selectedLevel] ?? [];
  const filteredWords =
    selectedCategory === "semua"
      ? activeWords
      : activeWords.filter((w) => w.category === selectedCategory);

  const levelCategories = categories.filter(
    (c, idx, arr) =>
      c.cefr === selectedLevel &&
      arr.findIndex((x) => x.title_id === c.title_id) === idx
  );

  return (
    <section aria-labelledby="indeks-kosakata-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
        <div>
          <h2
            id="indeks-kosakata-heading"
            className="font-display text-2xl font-semibold text-[var(--ink-primary)]"
          >
            Indeks Kosakata Pemula hingga Menengah
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">
            Jelajahi daftar kata pilihan berdasarkan level CEFR dan topik tematik dari kamus inti.
          </p>
        </div>

        <div
          className="inline-flex rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1 self-start sm:self-auto"
          role="tablist"
          aria-label="Filter level CEFR"
        >
          {(["A1", "A2", "B1"] as CefrLevel[]).map((lvl) => {
            const active = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedLevel(lvl as "A1" | "A2" | "B1");
                  setSelectedCategory("semua");
                }}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-[4px] transition-colors cursor-pointer ${
                  active
                    ? "bg-[var(--accent-primary)] text-white"
                    : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                }`}
              >
                Level {lvl}
              </button>
            );
          })}
        </div>
      </div>

      {levelCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("semua")}
            className={`px-3 py-1 text-xs rounded-[6px] border transition-colors cursor-pointer ${
              selectedCategory === "semua"
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
            }`}
          >
            Semua Topik
          </button>
          {levelCategories.slice(0, 12).map((cat) => {
            const active = selectedCategory === cat.title_id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.title_id)}
                className={`px-3 py-1 text-xs rounded-[6px] border transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                {cat.title_id}
              </button>
            );
          })}
        </div>
      )}

      {filteredWords.length === 0 ? (
        <div className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-secondary)]">
          Belum ada pratinjau kata di topik ini. Gunakan kotak pencarian di atas untuk mencari kata apa pun secara lengkap.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredWords.slice(0, 18).map((item) => (
            <article
              key={item.slug}
              className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/kamus/${encodeURIComponent(item.slug)}`}
                    className="font-display text-xl font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    {item.word}
                  </Link>
                  <span className="px-2 py-0.5 text-[11px] font-mono-ipa rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] shrink-0">
                    {item.cefr_level} · {item.pos}
                  </span>
                </div>

                {item.reading_hint_id && (
                  <p className="text-xs font-mono-ipa text-[var(--ink-muted)] mt-0.5">
                    baca: {item.reading_hint_id}
                  </p>
                )}

                <p className="text-sm text-[var(--ink-secondary)] mt-2 line-clamp-2">
                  {item.translations_id.join(" · ")}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
                <div className="flex items-center gap-1.5">
                  <AudioPlayButton text={item.word} audioUrl={item.audio_url} label="Putar" compact />
                  <BookmarkButton slug={item.slug} compact />
                </div>
                <Link
                  href={`/kamus/${encodeURIComponent(item.slug)}`}
                  className="text-xs font-medium text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
                >
                  Detail
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

