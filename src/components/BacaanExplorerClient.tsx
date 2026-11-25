"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Search, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import type { CefrLevel } from "@/types/linggis";
import { loadProgress } from "@/lib/progress";

export type BacaanCategoryKey =
  | "guides"
  | "conversations"
  | "daily_talk"
  | "stories"
  | "movie_scenes"
  | "fun_facts"
  | "daily_news"
  | "speeches"
  | "relatable"
  | "phrases";

export interface BacaanListItem {
  slug: string;
  category: BacaanCategoryKey;
  title: string;
  subtitle: string;
  cefr: CefrLevel;
  metaLabel: string;
}

interface BacaanExplorerClientProps {
  items: BacaanListItem[];
}

const CATEGORY_TABS: Array<{ key: "SEMUA" | BacaanCategoryKey; label: string }> = [
  { key: "SEMUA", label: "Semua" },
  { key: "conversations", label: "Percakapan Dialog" },
  { key: "daily_talk", label: "Daily Talk" },
  { key: "stories", label: "Cerita Pendek" },
  { key: "movie_scenes", label: "Movie Scene" },
  { key: "fun_facts", label: "Fun Facts" },
  { key: "daily_news", label: "Daily News" },
  { key: "speeches", label: "Akademi Pidato" },
  { key: "relatable", label: "Ungkapan Natural" },
  { key: "phrases", label: "Lembar Frasa" },
  { key: "guides", label: "Panduan Belajar" },
];

const CATEGORY_LABELS: Record<BacaanCategoryKey, string> = {
  guides: "Panduan",
  conversations: "Dialog Audio",
  daily_talk: "Daily Talk",
  stories: "Cerita",
  movie_scenes: "Movie Scene",
  fun_facts: "Fun Facts",
  daily_news: "Daily News",
  speeches: "Pidato",
  relatable: "Bahasa Natural",
  phrases: "Lembar Frasa",
};

export function BacaanExplorerClient({ items }: BacaanExplorerClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<"SEMUA" | BacaanCategoryKey>("SEMUA");
  const [cefrFilter, setCefrFilter] = useState<"SEMUA" | CefrLevel>("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [completedReadings, setCompletedReadings] = useState<string[]>([]);

  useEffect(() => {
    const { progress } = loadProgress();
    setCompletedReadings(progress.completedReadings ?? []);
  }, []);

  const doneSet = useMemo(() => new Set(completedReadings), [completedReadings]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategory !== "SEMUA" && item.category !== selectedCategory) return false;
      if (cefrFilter !== "SEMUA" && item.cefr !== cefrFilter) return false;
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSub = item.subtitle.toLowerCase().includes(q);
        if (!matchTitle && !matchSub) return false;
      }
      return true;
    });
  }, [items, selectedCategory, cefrFilter, searchTerm]);

  const doneCount = items.filter((i) => doneSet.has(i.slug)).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
              Pustaka Bacaan &amp; Dialog Kontekstual
            </p>
            <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
              Bacaan, Percakapan &amp; Lembar Ungkapan
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              Latih pemahaman membaca dan menyimak lewat dialog percakapan, cerita pendek, adegan film, berita, pidato, serta kumpulan phrasal verbs, idiom, dan slang.
            </p>
          </div>
          <div className="px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-xs font-mono-ipa text-[var(--ink-secondary)] shrink-0 self-start md:self-auto">
            Dibaca: {doneCount} / {items.length} materi
          </div>
        </div>
      </section>

      {/* Filter Kategori, Level & Pencarian */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.key;
            const count =
              tab.key === "SEMUA"
                ? items.length
                : items.filter((i) => i.category === tab.key).length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
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

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              id="bacaan-search-input"
              name="bacaanSearch"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Saring judul bacaan atau topik percakapan..."
              aria-label="Saring daftar bacaan"
              className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(["SEMUA", "A1", "A2", "B1", "B2", "C1"] as const).map((lvl) => {
              const active = cefrFilter === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCefrFilter(lvl)}
                  className={`px-2.5 py-2 text-xs font-mono-ipa rounded-[6px] border transition-colors cursor-pointer ${
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
        </div>
      </section>

      {/* Daftar Item */}
      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-center text-sm text-[var(--ink-secondary)]">
          Tidak ada materi bacaan yang sesuai dengan filter Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const isDone = doneSet.has(item.slug);
            return (
              <Link
                key={item.slug}
                href={`/bacaan/${encodeURIComponent(item.slug)}`}
                className={`p-5 rounded-[8px] border transition-colors flex flex-col justify-between gap-3 ${
                  isDone
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)]/30"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] font-medium">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-ipa text-[var(--ink-muted)]">
                        {item.cefr}
                      </span>
                      {isDone && (
                        <CheckCircle2
                          className="w-4 h-4 text-[var(--state-correct)]"
                          strokeWidth={1.75}
                        />
                      )}
                    </div>
                  </div>

                  <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)] leading-snug line-clamp-2">
                    {item.title}
                  </h2>

                  {item.subtitle && (
                    <p className="text-xs sm:text-sm text-[var(--ink-secondary)] line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--accent-primary)] font-medium">
                  <span className="text-[var(--ink-muted)] font-normal">
                    {item.metaLabel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {item.category === "conversations" ? (
                      <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                    ) : item.category === "relatable" ? (
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
                    )}
                    Baca Materi
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

