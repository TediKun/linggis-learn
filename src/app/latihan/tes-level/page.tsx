import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PlacementTestClient } from "@/components/PlacementTestClient";

export const metadata: Metadata = {
  title: "Tes Penempatan Level (A0–B2)",
  description:
    "Tes singkat 12 soal untuk mengetahui level awal bahasa Inggris Anda dan menentukan titik mulai terbaik di Roadmap Linggis.",
};

export default function PlacementTestPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <Link
        href="/latihan"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Kembali ke Pusat Latihan
      </Link>

      <div className="space-y-1">
        <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
          Tes Penempatan Level
        </p>
        <p className="text-sm text-[var(--ink-secondary)]">
          Jawab 12 pertanyaan singkat berikut untuk melihat rekomendasi titik mulai Anda di Roadmap.
        </p>
      </div>

      <PlacementTestClient />
    </div>
  );
}

