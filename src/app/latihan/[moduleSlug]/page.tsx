import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { QuizPlayer } from "@/components/QuizPlayer";
import { getQuizPackBySlug } from "@/lib/data-store";

interface LatihanDetailProps {
  params: Promise<{ moduleSlug: string }>;
}

export async function generateMetadata({
  params,
}: LatihanDetailProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const pack = getQuizPackBySlug(decodeURIComponent(moduleSlug));
  if (!pack) {
    return { title: "Paket Latihan Tidak Ditemukan" };
  }
  return {
    title: `${pack.title} — Latihan Linggis`,
    description: pack.description,
  };
}

export default async function LatihanDetailPage({
  params,
}: LatihanDetailProps) {
  const { moduleSlug } = await params;
  const decoded = decodeURIComponent(moduleSlug);
  const pack = getQuizPackBySlug(decoded);

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div>
        <Link
          href="/latihan"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Pusat Latihan
        </Link>
      </div>

      {pack ? (
        <QuizPlayer pack={pack} />
      ) : (
        <section className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Paket latihan &ldquo;{decoded}&rdquo; belum tersedia
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Silakan kembali ke halaman daftar Latihan untuk memilih paket soal lainnya.
          </p>
        </section>
      )}
    </div>
  );
}

