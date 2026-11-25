"use client";

import { useState } from "react";
import { Volume2, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import type { CefrLevel } from "@/types/linggis";
import { speakEnglish } from "@/lib/speech";

interface DictationItem {
  id: string;
  en: string;
  id_text: string;
  cefr: CefrLevel;
  source: string;
}

interface DictationPracticeClientProps {
  items: DictationItem[];
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Longest Common Subsequence word alignment agar 1 kata yang terlewat
 * tidak menggeser seluruh perbandingan kata berikutnya.
 */
function computeMatchedTargetIndices(
  targetTokens: string[],
  typedTokens: string[]
): Set<number> {
  const m = targetTokens.length;
  const n = typedTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (targetTokens[i - 1] === typedTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const matched = new Set<number>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (targetTokens[i - 1] === typedTokens[j - 1]) {
      matched.add(i - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return matched;
}

export function DictationPracticeClient({ items }: DictationPracticeClientProps) {
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);

  const current = items[idx];
  if (!current) {
    return (
      <div className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-secondary)]">
        Belum ada kalimat dikte tersedia.
      </div>
    );
  }

  const targetTokens = current.en.split(/\s+/).filter(Boolean);
  const targetNormalized = targetTokens.map((t) =>
    t
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z0-9']/g, "")
  );
  const typedWords = normalizeWords(answer);
  const matchedIndices = computeMatchedTargetIndices(
    targetNormalized,
    typedWords
  );
  const matchedCount = matchedIndices.size;
  const pct =
    targetNormalized.length > 0
      ? Math.round((matchedCount / targetNormalized.length) * 100)
      : 0;

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    setChecked(true);
  };

  const handleNext = () => {
    setAnswer("");
    setChecked(false);
    setIdx((prev) => (prev + 1 < items.length ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--ink-muted)]">
        <span>
          Kalimat {idx + 1} dari {items.length} · CEFR {current.cefr}
        </span>
        <span>Sumber: {current.source}</span>
      </div>

      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-6">
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Dengarkan lalu ketik kalimat yang Anda dengar
          </h1>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => speakEnglish(current.en, { rate: 0.95 })}
              className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" strokeWidth={1.75} />
              Putar Normal
            </button>
            <button
              type="button"
              onClick={() => speakEnglish(current.en, { rate: 0.72 })}
              className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:bg-[var(--bg-subtle)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-2 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.75} />
              Putar Lambat (0.7x)
            </button>
          </div>
        </div>

        <form onSubmit={handleCheck} className="space-y-3">
          <label
            htmlFor="dictation-input"
            className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]"
          >
            Ketik Jawaban Anda (Bahasa Inggris)
          </label>
          <input
            id="dictation-input"
            name="dictationAnswer"
            type="text"
            disabled={checked}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Ketik kalimat yang terdengar di sini..."
            className="w-full min-h-[48px] px-4 py-2.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />

          {!checked && (
            <button
              type="submit"
              disabled={!answer.trim()}
              className="min-h-[42px] px-5 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 text-white text-sm font-medium cursor-pointer"
            >
              Periksa Ejaan
            </button>
          )}
        </form>

        {checked && (
          <div className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--ink-primary)] inline-flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    pct >= 80
                      ? "text-[var(--state-correct)]"
                      : "text-[var(--accent-warm)]"
                  }`}
                  strokeWidth={1.75}
                />
                Akurasi Ejaan: {pct}% ({matchedCount}/{targetNormalized.length} kata cocok)
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                Kalimat Asli:
              </div>
              <div className="flex flex-wrap gap-1.5 text-base font-medium">
                {targetTokens.map((rawToken, i) => {
                  const isOk = matchedIndices.has(i);
                  return (
                    <span
                      key={i}
                      className={`px-1.5 py-0.5 rounded ${
                        isOk
                          ? "bg-[var(--accent-primary-tint)] text-[var(--state-correct)]"
                          : "bg-red-50 text-[var(--state-wrong)] underline"
                      }`}
                    >
                      {rawToken}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm text-[var(--ink-secondary)] pt-1">
                Arti: {current.id_text}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[40px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                Kalimat Berikutnya
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnswer("");
                  setChecked(false);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-primary)] inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                Coba Lagi
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

