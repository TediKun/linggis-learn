import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  BacaanDetailClient,
  type BacaanPayload,
} from "@/components/BacaanDetailClient";
import {
  getAllPhraseGroups,
  getAllReadingsList,
  getAllReadingsRaw,
} from "@/lib/data-store";

interface BacaanDetailPageProps {
  params: Promise<{ slug: string }>;
}

function resolveBacaanBySlug(slug: string): {
  payload: BacaanPayload | null;
  prevItem: { slug: string; title: string } | null;
  nextItem: { slug: string; title: string } | null;
} {
  const clean = decodeURIComponent(slug);
  const readings = getAllReadingsList();
  const raw = getAllReadingsRaw();
  const phraseGroups = getAllPhraseGroups();

  if (clean.startsWith("dialog-")) {
    const convSlug = clean.slice("dialog-".length);
    const idx = raw.conversations.findIndex((c) => c.slug === convSlug);
    if (idx >= 0) {
      const conv = raw.conversations[idx];
      const prev = idx > 0 ? raw.conversations[idx - 1] : null;
      const next =
        idx < raw.conversations.length - 1 ? raw.conversations[idx + 1] : null;
      return {
        payload: { kind: "conversation", data: conv, slug: clean },
        prevItem: prev ? { slug: `dialog-${prev.slug}`, title: prev.title } : null,
        nextItem: next ? { slug: `dialog-${next.slug}`, title: next.title } : null,
      };
    }
  }

  if (clean.startsWith("situasi-")) {
    const relSlug = clean.slice("situasi-".length);
    const idx = raw.relatable.findIndex((r) => r.slug === relSlug);
    if (idx >= 0) {
      const rel = raw.relatable[idx];
      const prev = idx > 0 ? raw.relatable[idx - 1] : null;
      const next =
        idx < raw.relatable.length - 1 ? raw.relatable[idx + 1] : null;
      return {
        payload: { kind: "relatable", data: rel, slug: clean },
        prevItem: prev
          ? { slug: `situasi-${prev.slug}`, title: prev.title }
          : null,
        nextItem: next
          ? { slug: `situasi-${next.slug}`, title: next.title }
          : null,
      };
    }
  }

  if (clean.startsWith("frasa-")) {
    const grpSlug = clean.slice("frasa-".length);
    const idx = phraseGroups.findIndex((g) => g.slug === grpSlug);
    if (idx >= 0) {
      const grp = phraseGroups[idx];
      const prev = idx > 0 ? phraseGroups[idx - 1] : null;
      const next =
        idx < phraseGroups.length - 1 ? phraseGroups[idx + 1] : null;
      return {
        payload: { kind: "phrases", data: grp, slug: clean },
        prevItem: prev ? { slug: `frasa-${prev.slug}`, title: prev.title } : null,
        nextItem: next ? { slug: `frasa-${next.slug}`, title: next.title } : null,
      };
    }
  }

  const rIdx = readings.findIndex((r) => r.slug === clean);
  if (rIdx >= 0) {
    const item = readings[rIdx];
    const sameCat = readings.filter((r) => r.category === item.category);
    const catIdx = sameCat.findIndex((r) => r.slug === item.slug);
    const prev = catIdx > 0 ? sameCat[catIdx - 1] : null;
    const next = catIdx < sameCat.length - 1 ? sameCat[catIdx + 1] : null;
    return {
      payload: { kind: "passage", data: item, slug: clean },
      prevItem: prev ? { slug: prev.slug, title: prev.title } : null,
      nextItem: next ? { slug: next.slug, title: next.title } : null,
    };
  }

  return { payload: null, prevItem: null, nextItem: null };
}

export async function generateMetadata({
  params,
}: BacaanDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { payload } = resolveBacaanBySlug(slug);
  if (!payload) {
    return { title: "Materi Bacaan Tidak Ditemukan" };
  }
  return {
    title: `${payload.data.title} — Bacaan Linggis`,
    description:
      payload.kind === "phrases"
        ? payload.data.subtitle ?? `Lembar ungkapan ${payload.data.title}`
        : payload.kind === "relatable"
          ? payload.data.situation
          : payload.data.subtitle ?? payload.data.title,
  };
}

export default async function BacaanDetailPage({
  params,
}: BacaanDetailPageProps) {
  const { slug } = await params;
  const { payload, prevItem, nextItem } = resolveBacaanBySlug(slug);

  if (!payload) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Link
          href="/bacaan"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Daftar Bacaan
        </Link>
        <section className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-3">
          <h1 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Materi bacaan tidak ditemukan
          </h1>
          <p className="text-sm text-[var(--ink-secondary)]">
            Silakan kembali ke halaman pustaka Bacaan untuk memilih topik yang tersedia.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link
          href="/bacaan"
          className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Pustaka Bacaan
        </Link>
      </div>

      <BacaanDetailClient
        payload={payload}
        prevItem={prevItem}
        nextItem={nextItem}
      />
    </div>
  );
}

