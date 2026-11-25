import Link from "next/link";
import { BookOpen, Compass, Layers, CheckSquare, ArrowRight } from "lucide-react";
import { DictionarySearch } from "@/components/DictionarySearch";
import { HomeVocabExplorer } from "@/components/HomeVocabExplorer";
import { DailyStudyPlan } from "@/components/DailyStudyPlan";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import {
  getApkCategories,
  getPopularStarterWords,
  getWordOfTheDay,
  getWordsByCefr,
} from "@/lib/data-store";
import { getFullRoadmap } from "@/lib/roadmap-builder";

const QUICK_SEARCH_WORDS = ["believe", "break down", "grateful", "piece of cake", "understand", "learn"];

export const revalidate = 3600;

export default function HomePage() {
  const starterWords = getPopularStarterWords();
  const wordOfTheDay = getWordOfTheDay();
  const a1Words = getWordsByCefr("A1", 120);
  const a2Words = getWordsByCefr("A2", 120);
  const b1Words = getWordsByCefr("B1", 120);
  const categories = getApkCategories();
  const roadmapSteps = getFullRoadmap().map((m) => ({
    slug: m.slug,
    title: m.title,
    cefr_level: m.cefr_level,
    estimated_minutes: m.estimated_minutes,
  }));

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      {/* Editorial Dictionary Search Center — tanpa marketing hero */}
      <section className="max-w-[760px] mx-auto space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
            Kamus Inggris–Indonesia &amp; Panduan Belajar
          </p>
          <h1 className="font-display text-3xl sm:text-[40px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
            Cari arti kata, pelafalan, dan mulai belajar secara runtut.
          </h1>
          <p className="text-base text-[var(--ink-secondary)]">
            Lebih dari 3.100 kosakata esensial, ribuan frasa percakapan, serta peta belajar dari nol hingga mahir.
          </p>
        </div>

        <DictionarySearch />

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)]">
          <span className="text-[var(--ink-muted)]">Coba cari:</span>
          {QUICK_SEARCH_WORDS.map((word) => {
            const slug = word.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return (
              <Link
                key={word}
                href={`/kamus/${slug}`}
                className="px-2.5 py-1 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {word}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Jalur Mulai Belajar (Fokus Tugas, Hairline Border) */}
      <section aria-label="Menu jalur belajar utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          href="/roadmap/fondasi-peta-belajar-dan-urutan-hafalan"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] flex items-center justify-center">
              <Compass className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Mulai dari Nol (A0)
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              Bingung harus mulai dari mana? Ikuti jalur Fondasi &amp; hafalan inti bertahap.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            Buka Roadmap <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>

        <Link
          href="/bacaan"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-subtle)] text-[var(--ink-primary)] flex items-center justify-center">
              <BookOpen className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Bacaan &amp; Dialog
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              45 Daily Talk, dialog percakapan, cerita pendek, fun facts, hingga frasa idiom &amp; slang.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            Jelajahi Bacaan <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>

        <Link
          href="/latihan"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--bg-subtle)] text-[var(--ink-primary)] flex items-center justify-center">
              <CheckSquare className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Latihan &amp; Kuis
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              Uji pemahaman lewat pilihan ganda, kalimat rumpang, listening, dan susun kata.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            Mulai Latihan <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>

        <Link
          href="/flashcard"
          className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors flex flex-col justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--accent-warm-tint)] text-[var(--accent-warm)] flex items-center justify-center">
              <Layers className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-lg font-semibold text-[var(--ink-primary)]">
              Flashcard SM-2
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              Ulang kata tersimpan dengan penjadwalan memori berkala agar tidak mudah lupa.
            </p>
          </div>
          <span className="text-xs font-medium text-[var(--accent-primary)] inline-flex items-center gap-1">
            Buka Kartu <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </Link>
      </section>

      {/* Rencana Belajar 15 Menit & Log Penguasaan */}
      <DailyStudyPlan roadmapSteps={roadmapSteps} />

      {/* Word of the Day */}
      {wordOfTheDay && (
        <section
          aria-labelledby="wotd-heading"
          className="p-5 sm:p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-semibold">
                Kata Pilihan Hari Ini
              </span>
              <span className="px-2 py-0.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] font-mono-ipa text-[var(--ink-secondary)]">
                {wordOfTheDay.cefr_level} · {wordOfTheDay.pos}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Link
                id="wotd-heading"
                href={`/kamus/${encodeURIComponent(wordOfTheDay.slug)}`}
                className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] hover:text-[var(--accent-primary)] transition-colors"
              >
                {wordOfTheDay.word}
              </Link>
              {wordOfTheDay.reading_hint_id && (
                <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                  baca: {wordOfTheDay.reading_hint_id}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              {wordOfTheDay.translations_id.slice(0, 3).join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <AudioPlayButton
              text={wordOfTheDay.word}
              audioUrl={wordOfTheDay.audio_url}
              label="Dengar"
            />
            <BookmarkButton slug={wordOfTheDay.slug} />
            <Link
              href={`/kamus/${encodeURIComponent(wordOfTheDay.slug)}`}
              className="min-h-[40px] px-3.5 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] hover:border-[var(--accent-primary)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-1"
            >
              Detail
              <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </section>
      )}

      {/* Kata Esensial Awal (Highlight cepat) */}
      {starterWords.length > 0 && (
        <section aria-labelledby="kata-esensial-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="kata-esensial-heading"
              className="font-display text-xl font-semibold text-[var(--ink-primary)]"
            >
              Kosakata Pilihan Hari Ini
            </h2>
            <span className="text-xs text-[var(--ink-muted)]">
              Klik kata untuk melihat pelafalan dan contoh kalimat
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {starterWords.slice(0, 12).map((w) => (
              <Link
                key={w.slug}
                href={`/kamus/${encodeURIComponent(w.slug)}`}
                className="p-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] transition-colors"
              >
                <div className="font-display font-semibold text-base text-[var(--ink-primary)] truncate">
                  {w.word}
                </div>
                <div className="text-xs text-[var(--ink-secondary)] truncate mt-0.5">
                  {w.translations_id[0]}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Indeks Eksplorasi CEFR A1-B1 */}
      <HomeVocabExplorer
        wordsByLevel={{
          A1: a1Words,
          A2: a2Words,
          B1: b1Words,
        }}
        categories={categories}
      />
    </div>
  );
}
