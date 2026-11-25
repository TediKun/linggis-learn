import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { DictionarySearch } from "@/components/DictionarySearch";
import { WordDetailClient } from "@/components/WordDetailClient";
import { ExternalWordLookup } from "@/components/ExternalWordLookup";
import { getWordBySlug } from "@/lib/data-store";

interface WordPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WordPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { word } = await getWordBySlug(slug);
  if (!word) {
    return {
      title: `Cari "${decodeURIComponent(slug)}" di Kamus`,
    };
  }
  return {
    title: `${word.word} — Arti, Cara Baca & Contoh Kalimat`,
    description: `Arti kata bahasa Inggris "${word.word}" (${word.pos}, CEFR ${word.cefr_level}): ${word.translations_id.slice(0, 3).join(", ")}.`,
  };
}

export default async function WordDetailPage({ params }: WordPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { word, examples, suggestions } = await getWordBySlug(decodedSlug);

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            Kembali ke Kamus
          </Link>
          <span className="text-xs font-mono-ipa text-[var(--ink-muted)] truncate">
            /kamus/{decodedSlug}
          </span>
        </div>

        <DictionarySearch initialQuery={word ? word.word : decodedSlug} />
      </div>

      {word ? (
        <WordDetailClient initialWord={word} examples={examples} />
      ) : (
        <ExternalWordLookup
          decodedSlug={decodedSlug}
          suggestions={suggestions}
        />
      )}
    </div>
  );
}
