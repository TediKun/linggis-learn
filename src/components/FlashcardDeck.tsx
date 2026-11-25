"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  RotateCw,
  Bookmark,
  Layers,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Trash2,
  List,
} from "lucide-react";
import type { CefrLevel, LinggisProgress } from "@/types/linggis";
import type { FlashcardItem } from "@/app/api/flashcards/route";
import {
  evaluateFlashcardSM2,
  getTodayIsoDate,
  loadProgress,
  toggleBookmarkSlug,
} from "@/lib/progress";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { AccountSyncBanner } from "@/components/AccountSyncBanner";
import { useAuth } from "@/components/AuthProvider";

type DeckMode = "bookmarks" | "cefr" | "manage";

export function FlashcardDeck() {
  const { user, openAuthModal } = useAuth();
  const [mode, setMode] = useState<DeckMode>("bookmarks");
  const [cefrLevel, setCefrLevel] = useState<CefrLevel>("A1");
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [progress, setProgress] = useState<LinggisProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [reviewAllEvenIfDone, setReviewAllEvenIfDone] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [lastIntervalNote, setLastIntervalNote] = useState<string | null>(null);

  const loadDeck = useCallback(async (targetMode: DeckMode, targetCefr: CefrLevel) => {
    setLoading(true);
    setFlipped(false);
    setSessionIndex(0);
    setReviewedCount(0);
    setLastIntervalNote(null);

    const { progress: current } = loadProgress();
    setProgress(current);

    // Jika bookmark masih kosong saat awal buka halaman, beri fallback info kosong
    if (
      (targetMode === "bookmarks" || targetMode === "manage") &&
      current.bookmarks.length === 0
    ) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      const url =
        targetMode === "bookmarks" || targetMode === "manage"
          ? `/api/flashcards?slugs=${encodeURIComponent(current.bookmarks.join(","))}`
          : `/api/flashcards?level=${encodeURIComponent(targetCefr)}&limit=30`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { cards: FlashcardItem[] };
      setCards(data.cards ?? []);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { progress: initial } = loadProgress();
    setProgress(initial);
    // Jika belum punya bookmark sama sekali, langsung tampilkan dek A1 agar bisa langsung mencoba
    if (initial.bookmarks.length === 0) {
      setMode("cefr");
      void loadDeck("cefr", "A1");
    } else {
      setMode("bookmarks");
      void loadDeck("bookmarks", "A1");
    }
  }, [loadDeck]);

  useEffect(() => {
    const handleCloudSync = () => {
      const { progress: synced } = loadProgress();
      setProgress(synced);
      if (synced.bookmarks.length > 0 && mode !== "cefr") {
        void loadDeck(mode, cefrLevel);
      } else if (synced.bookmarks.length > 0) {
        setMode("bookmarks");
        void loadDeck("bookmarks", cefrLevel);
      }
    };
    window.addEventListener("linggis-progress-synced", handleCloudSync);
    return () => {
      window.removeEventListener("linggis-progress-synced", handleCloudSync);
    };
  }, [cefrLevel, loadDeck, mode]);

  const today = getTodayIsoDate();

  const dueQueue = useMemo(() => {
    if (!progress) return cards;
    if (reviewAllEvenIfDone) return cards;
    return cards.filter((c) => {
      const state = progress.flashcards[c.slug];
      if (!state) return true;
      return state.nextReviewDate <= today;
    });
  }, [cards, progress, reviewAllEvenIfDone, today]);

  const activeCard = dueQueue[sessionIndex] ?? null;

  const handleRate = useCallback(
    (rating: "lupa" | "ingat" | "mudah") => {
      if (!activeCard) return;
      const updated = evaluateFlashcardSM2(activeCard.slug, rating);
      setProgress(updated);
      const nextState = updated.flashcards[activeCard.slug];
      if (nextState) {
        setLastIntervalNote(
          rating === "lupa"
            ? `"${activeCard.word}" dijadwalkan ulang segera.`
            : `"${activeCard.word}" dijadwalkan ulang dalam ${nextState.intervalDays} hari (${nextState.nextReviewDate}).`
        );
      }
      setFlipped(false);
      setReviewedCount((prev) => prev + 1);
      // Karena dueQueue mengevaluasi ulang saat state berubah (kecuali "lupa" jika hari ini <= today), amankan indeks:
      if (reviewAllEvenIfDone || rating === "lupa") {
        setSessionIndex((prev) => prev + 1);
      } else {
        // Card otomatis keluar dari dueQueue setelah di-update, jadi index saat ini otomatis menunjuk kartu berikutnya
        setSessionIndex((prev) => Math.min(prev, Math.max(0, dueQueue.length - 2)));
      }
    },
    [activeCard, dueQueue.length, reviewAllEvenIfDone]
  );

  // Keyboard shortcuts: Space untuk flip, 1/2/3 untuk rating SM-2
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (!activeCard) return;

      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((prev) => !prev);
      } else if (flipped) {
        if (e.key === "1") handleRate("lupa");
        if (e.key === "2") handleRate("ingat");
        if (e.key === "3") handleRate("mudah");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeCard, flipped, handleRate]);

  return (
    <div className="space-y-6">
      <AccountSyncBanner />

      {/* Header */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
            Pengulangan Berjarak (Spaced Repetition SM-2)
          </p>
          <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
            Flashcard Kosakata &amp; Frasa
          </h1>
          <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
            Latih ingatan aktif kata tersimpan Anda. Tandai <strong>Lupa</strong>, <strong>Ingat</strong>, atau <strong>Mudah</strong> agar sistem mengatur jadwal pengulangan terbaik.
          </p>
        </div>

        {/* Switch Sumber Dek */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border-hairline)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("bookmarks");
                setReviewAllEvenIfDone(false);
                void loadDeck("bookmarks", cefrLevel);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-[6px] border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                mode === "bookmarks"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <Bookmark className="w-4 h-4" strokeWidth={1.75} />
              Kata Tersimpan ({progress?.bookmarks.length ?? 0})
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("cefr");
                setReviewAllEvenIfDone(false);
                void loadDeck("cefr", cefrLevel);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-[6px] border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                mode === "cefr"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <Layers className="w-4 h-4" strokeWidth={1.75} />
              Paket Level CEFR
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("manage");
                void loadDeck("manage", cefrLevel);
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-[6px] border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                mode === "manage"
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                  : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <List className="w-4 h-4" strokeWidth={1.75} />
              Kelola Daftar
            </button>
          </div>

          {mode === "cefr" && (
            <div className="flex items-center gap-1.5">
              {(["A1", "A2", "B1", "B2"] as CefrLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setCefrLevel(lvl);
                    setReviewAllEvenIfDone(false);
                    void loadDeck("cefr", lvl);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono-ipa rounded-[6px] border cursor-pointer ${
                    cefrLevel === lvl
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] font-semibold"
                      : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)]"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Isi Dek */}
      {loading ? (
        <div className="p-12 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-center gap-2 text-sm text-[var(--ink-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-primary)]" strokeWidth={1.75} />
          Menyiapkan kartu flashcard...
        </div>
      ) : cards.length === 0 ? (
        <section className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-center space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Belum ada kata yang Anda simpan
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
            Klik tombol <strong>Simpan ke Flashcard</strong> di halaman Kamus atau Roadmap, atau langsung coba Paket Level CEFR A1 sekarang.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {!user && (
              <button
                type="button"
                onClick={() =>
                  openAuthModal({
                    reason:
                      "Masuk ke akun Anda untuk memulihkan daftar hafalan Flashcard yang tersimpan.",
                  })
                }
                className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium cursor-pointer"
              >
                Masuk ke Akun
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setMode("cefr");
                void loadDeck("cefr", "A1");
              }}
              className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--accent-primary)] text-sm font-medium cursor-pointer"
            >
              Latih Paket Level A1
            </button>
            <Link
              href="/"
              className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-1"
            >
              Cari Kata di Kamus
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </section>
      ) : mode === "manage" ? (
        <section className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
                Daftar Kata &amp; Frasa Tersimpan ({cards.length})
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                Kelola kosakata yang Anda tandai dari Kamus, Roadmap, atau Bacaan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode("bookmarks");
                void loadDeck("bookmarks", cefrLevel);
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs sm:text-sm font-medium self-start sm:self-auto cursor-pointer"
            >
              Mulai Latihan Kartu
            </button>
          </div>
          <div className="divide-y divide-[var(--border-hairline)]">
            {cards.map((item) => {
              const cardState = progress?.flashcards[item.slug];
              return (
                <div
                  key={item.slug}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/kamus/${encodeURIComponent(item.slug)}`}
                        className="font-display text-lg font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-primary)]"
                      >
                        {item.word}
                      </Link>
                      <span className="px-2 py-0.5 text-[11px] font-mono-ipa rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-muted)]">
                        {item.cefr_level} · {item.pos}
                      </span>
                      {cardState && (
                        <span className="text-[11px] font-mono-ipa text-[var(--ink-muted)]">
                          jadwal ulang: {cardState.nextReviewDate}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--ink-secondary)]">
                      {item.translations_id.join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AudioPlayButton
                      text={item.word}
                      audioUrl={item.audio_url}
                      label="Putar"
                      compact
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const res = toggleBookmarkSlug(item.slug);
                        setProgress(res.progress);
                        setCards((prev) =>
                          prev.filter((c) => c.slug !== item.slug)
                        );
                      }}
                      aria-label={`Hapus ${item.word} dari tersimpan`}
                      className="min-h-[34px] px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] hover:border-[var(--state-wrong)] hover:text-[var(--state-wrong)] text-xs text-[var(--ink-secondary)] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : !activeCard ? (
        <section className="p-8 rounded-[8px] border border-[var(--state-correct)] bg-[var(--accent-primary-tint)]/35 text-center space-y-4">
          <CheckCircle2 className="w-8 h-8 text-[var(--state-correct)] mx-auto" strokeWidth={1.75} />
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Semua kartu hari ini sudah selesai diulang!
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
            {reviewedCount > 0
              ? `Anda baru saja meninjau ${reviewedCount} kartu dalam sesi ini. `
              : ""}
            Total {cards.length} kartu dalam dek ini telah dijadwalkan untuk pengulangan berikutnya.
          </p>
          <button
            type="button"
            onClick={() => {
              setReviewAllEvenIfDone(true);
              setSessionIndex(0);
              setFlipped(false);
            }}
            className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--accent-primary)] bg-[var(--bg-surface)] text-[var(--accent-primary)] text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" strokeWidth={1.75} />
            Ulangi Semua {cards.length} Kartu Sekarang
          </button>
        </section>
      ) : (
        <div className="space-y-5">
          {/* Status bar dek */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-ipa text-[var(--ink-muted)]">
            <span>
              Sisa antrean: {Math.max(1, dueQueue.length - sessionIndex)} dari{" "}
              {dueQueue.length} kartu {reviewAllEvenIfDone ? "(mode ulang semua)" : "jatuh tempo"}
            </span>
            <span>Selesai sesi ini: {reviewedCount}</span>
          </div>

          {/* 3D Flip Card */}
          <div className="perspective-1000 w-full">
            <div
              onClick={() => setFlipped((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setFlipped((prev) => !prev);
              }}
              aria-label="Klik untuk membalik kartu flashcard"
              className={`relative w-full min-h-[300px] sm:min-h-[330px] cursor-pointer transition-transform duration-500 transform-style-3d ${
                flipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Depan (EN) */}
              <div className="absolute inset-0 backface-hidden rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-mono-ipa rounded-[6px] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)]">
                    CEFR {activeCard.cefr_level} · {activeCard.pos}
                  </span>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <AudioPlayButton
                      text={activeCard.word}
                      audioUrl={activeCard.audio_url}
                      label="Dengar"
                      compact
                    />
                  </div>
                </div>

                <div className="text-center space-y-2 my-auto py-4">
                  <h2 className="font-display text-3xl sm:text-5xl font-semibold text-[var(--ink-primary)] break-words">
                    {activeCard.word}
                  </h2>
                  {activeCard.ipa && (
                    <p className="font-mono-ipa text-sm text-[var(--ink-secondary)]">
                      {activeCard.ipa}
                    </p>
                  )}
                  {activeCard.reading_hint_id && (
                    <p className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                      cara baca: {activeCard.reading_hint_id}
                    </p>
                  )}
                </div>

                <div className="text-center text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--border-hairline)]">
                  Klik kartu atau tekan <kbd className="font-mono-ipa px-1.5 py-0.5 rounded border border-[var(--border-hairline)] bg-[var(--bg-paper)]">Spasi</kbd> untuk melihat arti
                </div>
              </div>

              {/* Belakang (ID) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[8px] border border-[var(--accent-primary)] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-ipa text-[var(--accent-primary)] font-semibold uppercase tracking-wider">
                    Arti Bahasa Indonesia
                  </span>
                  <Link
                    href={`/kamus/${encodeURIComponent(activeCard.slug)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[var(--accent-primary)] hover:underline"
                  >
                    Buka Kamus
                  </Link>
                </div>

                <div className="text-center space-y-3 my-auto py-4">
                  <div className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)]">
                    {activeCard.translations_id.join(" · ")}
                  </div>
                  {activeCard.usage_note_id && (
                    <p className="text-xs sm:text-sm text-[var(--ink-secondary)] max-w-md mx-auto">
                      {activeCard.usage_note_id}
                    </p>
                  )}
                </div>

                <div className="text-center text-xs text-[var(--ink-muted)] pt-2 border-t border-[var(--border-hairline)]">
                  Nilai seberapa lancar Anda mengingat arti kata ini di bawah
                </div>
              </div>
            </div>
          </div>

          {/* Kontrol Rating SM-2 */}
          {!flipped ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="min-h-[44px] px-6 py-2.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" strokeWidth={1.75} />
                Lihat Jawaban
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleRate("lupa")}
                className="min-h-[52px] px-3 py-2.5 rounded-[8px] border border-[var(--state-wrong)] bg-red-50 hover:bg-red-100 text-[var(--state-wrong)] text-sm font-semibold flex flex-col items-center justify-center cursor-pointer"
              >
                <span>Lupa</span>
                <span className="text-[11px] font-mono-ipa font-normal opacity-80">
                  [1] Ulang segera
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRate("ingat")}
                className="min-h-[52px] px-3 py-2.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-primary)] text-sm font-semibold flex flex-col items-center justify-center cursor-pointer"
              >
                <span>Ingat</span>
                <span className="text-[11px] font-mono-ipa font-normal text-[var(--ink-muted)]">
                  [2] Jadwal standar
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRate("mudah")}
                className="min-h-[52px] px-3 py-2.5 rounded-[8px] border border-[var(--state-correct)] bg-[var(--accent-primary-tint)] hover:opacity-90 text-[var(--state-correct)] text-sm font-semibold flex flex-col items-center justify-center cursor-pointer"
              >
                <span>Mudah</span>
                <span className="text-[11px] font-mono-ipa font-normal opacity-85">
                  [3] Interval lebih lama
                </span>
              </button>
            </div>
          )}

          {lastIntervalNote && (
            <p className="text-center text-xs text-[var(--ink-muted)]">
              {lastIntervalNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

