import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DictationPracticeClient } from "@/components/DictationPracticeClient";
import { getDictationSentences } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Latihan Dikte Audio (Spelling & Listening)",
  description:
    "Latih pendengaran dan ketepatan ejaan bahasa Inggris dengan mengetik kalimat dari dialog percakapan.",
};

export default function DictationPage() {
  const items = getDictationSentences(18);

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <Link
        href="/latihan"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Kembali ke Pusat Latihan
      </Link>

      <DictationPracticeClient items={items} />
    </div>
  );
}

