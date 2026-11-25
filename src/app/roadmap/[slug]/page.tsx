import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { RoadmapModuleClient } from "@/components/RoadmapModuleClient";
import { getWordsBySlugs } from "@/lib/data-store";
import { getFullRoadmap, getRoadmapModuleBySlug } from "@/lib/roadmap-builder";

interface RoadmapDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: RoadmapDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const mod = getRoadmapModuleBySlug(decodeURIComponent(slug));
  if (!mod) {
    return { title: "Modul Roadmap Tidak Ditemukan" };
  }
  return {
    title: `${mod.title} (${mod.cefr_level})`,
    description: mod.summary,
  };
}

export default async function RoadmapModulePage({
  params,
}: RoadmapDetailProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const allModules = getFullRoadmap();
  const currentIdx = allModules.findIndex((m) => m.slug === decodedSlug);
  const mod = currentIdx >= 0 ? allModules[currentIdx] : null;

  if (!mod) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Roadmap
        </Link>
        <section className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Modul &ldquo;{decodedSlug}&rdquo; tidak ditemukan
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Silakan kembali ke halaman daftar Roadmap untuk memilih modul yang tersedia.
          </p>
        </section>
      </div>
    );
  }

  const keyVocabEntries = getWordsBySlugs(mod.key_vocab_slugs);
  const prevRaw = currentIdx > 0 ? allModules[currentIdx - 1] : null;
  const nextRaw =
    currentIdx >= 0 && currentIdx < allModules.length - 1
      ? allModules[currentIdx + 1]
      : null;

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Peta Roadmap
        </Link>
        <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
          Modul #{String(mod.order_index).padStart(2, "0")}
        </span>
      </div>

      <RoadmapModuleClient
        mod={mod}
        keyVocabEntries={keyVocabEntries}
        prevModule={
          prevRaw
            ? {
                slug: prevRaw.slug,
                title: prevRaw.title,
                cefr_level: prevRaw.cefr_level,
              }
            : null
        }
        nextModule={
          nextRaw
            ? {
                slug: nextRaw.slug,
                title: nextRaw.title,
                cefr_level: nextRaw.cefr_level,
              }
            : null
        }
      />
    </div>
  );
}

