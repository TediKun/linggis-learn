import type { Metadata } from "next";
import {
  BacaanExplorerClient,
  type BacaanListItem,
} from "@/components/BacaanExplorerClient";
import {
  getAllPhraseGroups,
  getAllReadingsList,
  getAllReadingsRaw,
} from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Bacaan, Percakapan & Lembar Ungkapan",
  description:
    "Kumpulan bacaan Daily Talk, dialog percakapan, cerita pendek, adegan film, berita, pidato, serta lembar phrasal verbs, idiom, dan slang.",
};

export default function BacaanPage() {
  const readings = getAllReadingsList();
  const raw = getAllReadingsRaw();
  const phraseGroups = getAllPhraseGroups();

  const items: BacaanListItem[] = [
    ...raw.conversations.map((c) => ({
      slug: `dialog-${c.slug}`,
      category: "conversations" as const,
      title: c.title,
      subtitle: c.subtitle,
      cefr: c.cefr,
      metaLabel: `${c.turns.length} baris dialog`,
    })),
    ...readings.map((r) => ({
      slug: r.slug,
      category: r.category,
      title: r.title,
      subtitle: r.subtitle ?? "",
      cefr: r.cefr,
      metaLabel: "Bacaan dwi-bahasa",
    })),
    ...raw.relatable.map((rel) => ({
      slug: `situasi-${rel.slug}`,
      category: "relatable" as const,
      title: rel.title,
      subtitle: rel.situation,
      cefr: rel.cefr,
      metaLabel: "Perbandingan natural",
    })),
    ...phraseGroups.map((pg) => ({
      slug: `frasa-${pg.slug}`,
      category: "phrases" as const,
      title: pg.title,
      subtitle: pg.subtitle ?? `${pg.items.length} ungkapan siap pakai`,
      cefr: pg.cefr,
      metaLabel: `${pg.items.length} ungkapan`,
    })),
  ];

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <BacaanExplorerClient items={items} />
    </div>
  );
}

