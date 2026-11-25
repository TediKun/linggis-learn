import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SentencePatternBuilderClient } from "@/components/SentencePatternBuilderClient";
import { getAllPhraseGroups } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Interactive Sentence Pattern Builder (Latihan Pola Kalimat)",
  description:
    "Pelajari dan rangkai variasi pola kalimat bahasa Inggris siap pakai untuk percakapan sehari-hari maupun kerja.",
};

export default function SentencePatternBuilderPage() {
  const patternGroups = getAllPhraseGroups().filter(
    (g) => g.kind === "patterns" || g.kind === "i_statements"
  );
  const sampleItems = patternGroups.flatMap((g) => g.items).slice(0, 24);

  return (
    <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <Link
        href="/latihan"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Kembali ke Pusat Latihan
      </Link>

      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
        <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
          Studio Merangkai Kalimat
        </p>
        <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
          Interactive Sentence Pattern Builder
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
          Pilih satu kerangka kalimat bahasa Inggris yang sering dipakai penutur asli, lalu klik potongan kata penggantinya untuk melihat bagaimana kalimat dan artinya berubah.
        </p>
      </header>

      <SentencePatternBuilderClient apkPatterns={sampleItems} />
    </div>
  );
}

