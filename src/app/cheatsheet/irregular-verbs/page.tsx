import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IrregularVerbsClient } from "@/components/IrregularVerbsClient";

export const metadata: Metadata = {
  title: "Tabel & Kuis Irregular Verbs (V1 - V2 - V3)",
  description:
    "Daftar 52 kata kerja tidak beraturan (irregular verbs) bahasa Inggris yang dikelompokkan berdasarkan kemiripan pola bunyi agar mudah dihafal.",
};

export default function IrregularVerbsPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link
          href="/cheatsheet"
          className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Cheatsheet Tenses
        </Link>
      </div>

      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
        <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
          Hafalan Pola Bunyi (V1 – V2 – V3)
        </p>
        <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
          Irregular Verbs: Hafal Lewat Pola Bunyi
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
          Jangan menghafal kata kerja tak beraturan secara acak dari A sampai Z. Kelompokkan berdasarkan pola perubahan bunyinya lalu uji di tab Kuis.
        </p>
      </header>

      <IrregularVerbsClient />
    </div>
  );
}

