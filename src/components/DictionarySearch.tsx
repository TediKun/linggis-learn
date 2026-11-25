"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2, Compass, BookOpen } from "lucide-react";
import type { WordSearchHit } from "@/types/linggis";
import type { ContentSearchHit } from "@/app/api/words/search/route";

interface DictionarySearchProps {
  initialQuery?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

const KIND_LABELS: Record<WordSearchHit["kind"], string> = {
  word: "kata",
  phrase: "frasa",
  idiom: "idiom",
  phrasal_verb: "phrasal verb",
  slang: "slang",
};

export function DictionarySearch({
  initialQuery = "",
  autoFocus = false,
  placeholder = "Cari kata atau frasa Inggris / Indonesia (mis. believe, belajar, break down)...",
}: DictionarySearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<WordSearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<WordSearchHit[]>([]);
  const [contentHits, setContentHits] = useState<ContentSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const hasInteractedRef = useRef(false);

  // Sync if navigating across routes with new initialQuery, without auto-opening dropdown
  useEffect(() => {
    hasInteractedRef.current = false;
    setQuery(initialQuery);
    setOpen(false);
    setHits([]);
    setSuggestions([]);
  }, [initialQuery]);

  // Global "/" shortcut to focus search bar and "Escape" to close dropdown
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 200ms debounced search (only when user actively types or edits input)
  useEffect(() => {
    if (!hasInteractedRef.current) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setSuggestions([]);
      setContentHits([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/words/search?q=${encodeURIComponent(trimmed)}&limit=8`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as {
          hits: WordSearchHit[];
          suggestions: WordSearchHit[];
          contentHits?: ContentSearchHit[];
        };
        setHits(data.hits ?? []);
        setSuggestions(data.suggestions ?? []);
        setContentHits(data.contentHits ?? []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setHits([]);
          setContentHits([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const displayedList = hits.length > 0 ? hits : suggestions;

  const navigateToItem = (slug: string) => {
    setOpen(false);
    router.push(`/kamus/${encodeURIComponent(slug)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && displayedList[activeIndex]) {
      navigateToItem(displayedList[activeIndex].slug);
      return;
    }
    if (hits.length > 0) {
      navigateToItem(hits[0].slug);
      return;
    }
    const slugGuess = query
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slugGuess) {
      navigateToItem(slugGuess);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || displayedList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < displayedList.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : displayedList.length - 1
      );
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search" aria-label="Pencarian Kamus Inggris-Indonesia">
        <div className="min-h-[52px] flex items-center gap-3 px-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] focus-within:border-[var(--accent-primary)] transition-colors">
          <Search
            className="w-5 h-5 text-[var(--ink-muted)] shrink-0"
            strokeWidth={1.75}
          />
          <input
            ref={inputRef}
            id="dictionary-search-input"
            name="q"
            type="search"
            value={query}
            autoFocus={autoFocus}
            onFocus={() => {
              if (hasInteractedRef.current && query.trim()) setOpen(true);
            }}
            onChange={(e) => {
              hasInteractedRef.current = true;
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Kata yang ingin dicari"
            aria-autocomplete="list"
            aria-expanded={open && query.trim().length > 0}
            className="w-full py-2.5 bg-transparent text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />

          {loading && (
            <Loader2
              className="w-4 h-4 text-[var(--accent-primary)] animate-spin shrink-0"
              strokeWidth={1.75}
            />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setHits([]);
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Hapus pencarian"
              className="p-1 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          <kbd
            aria-hidden="true"
            className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-xs font-mono-ipa rounded border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-muted)] shrink-0"
          >
            /
          </kbd>
        </div>
      </form>

      {open && query.trim().length > 0 && !loading && (
        <div
          className="absolute left-0 right-0 mt-1.5 z-30 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden"
          role="listbox"
        >
          {hits.length > 0 ? (
            <ul>
              {hits.slice(0, 8).map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <li key={`${item.kind}-${item.slug}`} role="option" aria-selected={isActive}>
                    <Link
                      href={`/kamus/${encodeURIComponent(item.slug)}`}
                      onClick={() => setOpen(false)}
                      className={`px-4 py-3 flex items-center justify-between gap-3 border-b last:border-b-0 border-[var(--border-hairline)] transition-colors ${
                        isActive
                          ? "bg-[var(--accent-primary-tint)]"
                          : "hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-display font-semibold text-base text-[var(--ink-primary)]">
                            {item.word}
                          </span>
                          <span className="text-xs text-[var(--ink-muted)]">
                            · {item.pos || KIND_LABELS[item.kind]}
                          </span>
                          <span className="text-sm text-[var(--ink-secondary)] truncate">
                            — {item.short_meaning_id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 text-[11px] font-mono-ipa rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)]">
                          {item.cefr_level}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[var(--ink-muted)]" strokeWidth={1.75} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm text-[var(--ink-secondary)]">
                Tidak ditemukan entri persis untuk{" "}
                <span className="font-semibold text-[var(--ink-primary)]">
                  &ldquo;{query.trim()}&rdquo;
                </span>
                .
              </p>
              {suggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide">
                    Mungkin maksud Anda:
                  </p>
                  <ul className="divide-y divide-[var(--border-hairline)] border border-[var(--border-hairline)] rounded-[6px]">
                    {suggestions.slice(0, 5).map((item) => (
                      <li key={`${item.kind}-${item.slug}`}>
                        <Link
                          href={`/kamus/${encodeURIComponent(item.slug)}`}
                          onClick={() => setOpen(false)}
                          className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-[var(--bg-subtle)] text-sm"
                        >
                          <span className="truncate">
                            <span className="font-display font-semibold text-[var(--ink-primary)]">
                              {item.word}
                            </span>{" "}
                            <span className="text-[var(--ink-secondary)]">
                              — {item.short_meaning_id}
                            </span>
                          </span>
                          <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                            {item.cefr_level}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {contentHits.length > 0 && (
            <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-paper)] p-3 space-y-1.5">
              <p className="px-1 text-[11px] font-mono-ipa font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
                Modul Roadmap &amp; Bacaan Terkait
              </p>
              <ul className="divide-y divide-[var(--border-hairline)] rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                {contentHits.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-subtle)] text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {c.kind === "roadmap" ? (
                          <Compass
                            className="w-4 h-4 text-[var(--accent-primary)] shrink-0"
                            strokeWidth={1.75}
                          />
                        ) : (
                          <BookOpen
                            className="w-4 h-4 text-[var(--accent-warm)] shrink-0"
                            strokeWidth={1.75}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--ink-primary)] truncate">
                            {c.title}
                          </div>
                          <div className="text-xs text-[var(--ink-muted)] truncate">
                            {c.subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 text-[11px] font-mono-ipa rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] shrink-0">
                        {c.kind === "roadmap" ? "Roadmap" : "Bacaan"} · {c.cefr}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

