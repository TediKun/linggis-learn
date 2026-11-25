"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Globe, SearchX } from "lucide-react";
import type { WordEntry, WordSearchHit } from "@/types/linggis";
import { WordDetailClient } from "@/components/WordDetailClient";

interface ExternalWordLookupProps {
  decodedSlug: string;
  suggestions: WordSearchHit[];
}

export function ExternalWordLookup({
  decodedSlug,
  suggestions,
}: ExternalWordLookupProps) {
  const queryWord = decodedSlug.replace(/-/g, " ").trim();
  const [status, setStatus] = useState<"checking" | "found" | "not_found">(
    "checking"
  );
  const [entry, setEntry] = useState<WordEntry | null>(null);

  useEffect(() => {
    if (!/^[a-zA-Z][a-zA-Z\s-]{1,32}$/.test(queryWord)) {
      setStatus("not_found");
      return;
    }

    const controller = new AbortController();
    setStatus("checking");

    fetch(`/api/words/external?word=${encodeURIComponent(queryWord)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { found?: boolean; word?: WordEntry | null } | null) => {
        if (data?.found && data.word) {
          setEntry(data.word);
          setStatus("found");
        } else {
          setStatus("not_found");
        }
      })
      .catch(() => {
        setStatus("not_found");
      });

    return () => controller.abort();
  }, [queryWord]);

  if (status === "checking") {
    return (
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center gap-3 text-sm text-[var(--ink-secondary)]">
        <Loader2
          className="w-4 h-4 animate-spin text-[var(--accent-primary)] shrink-0"
          strokeWidth={1.75}
        />
        <span>
          &ldquo;{queryWord}&rdquo; belum ada di kamus inti—sedang memeriksa kamus daring...
        </span>
      </section>
    );
  }

  if (status === "found" && entry) {
    return (
      <div className="space-y-4">
        <div className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--accent-primary-tint)]/45 text-xs sm:text-sm text-[var(--ink-primary)] flex items-center gap-2">
          <Globe
            className="w-4 h-4 text-[var(--accent-primary)] shrink-0"
            strokeWidth={1.75}
          />
          <span>
            Entri ini diambil dari pencarian kamus daring (Free Dictionary API) karena belum ada di daftar kosakata inti lokal.
          </span>
        </div>
        <WordDetailClient initialWord={entry} examples={[]} />
      </div>
    );
  }

  return (
    <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
      <div className="flex items-start gap-3">
        <SearchX
          className="w-6 h-6 text-[var(--accent-warm)] shrink-0 mt-0.5"
          strokeWidth={1.75}
        />
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Entri &ldquo;{decodedSlug}&rdquo; belum ada di kamus lokal
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Periksa kembali ejaan kata atau pilih saran kata yang paling mendekati di bawah ini.
          </p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
            Saran Kata Terdekat
          </h2>
          <ul className="divide-y divide-[var(--border-hairline)] rounded-[8px] border border-[var(--border-hairline)]">
            {suggestions.map((item) => (
              <li key={`${item.kind}-${item.slug}`}>
                <Link
                  href={`/kamus/${encodeURIComponent(item.slug)}`}
                  className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <div>
                    <span className="font-display font-semibold text-base text-[var(--ink-primary)]">
                      {item.word}
                    </span>
                    <span className="text-sm text-[var(--ink-secondary)] ml-2">
                      — {item.short_meaning_id}
                    </span>
                  </div>
                  <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                    {item.cefr_level}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
