import { NextRequest, NextResponse } from "next/server";
import {
  getAllReadingsList,
  getAllReadingsRaw,
  searchDictionary,
} from "@/lib/data-store";
import { getFullRoadmap } from "@/lib/roadmap-builder";

export interface ContentSearchHit {
  kind: "roadmap" | "bacaan";
  href: string;
  title: string;
  subtitle: string;
  cefr: string;
}

function searchRelatedContent(query: string, maxItems = 4): ContentSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: ContentSearchHit[] = [];

  for (const mod of getFullRoadmap()) {
    if (
      mod.title.toLowerCase().includes(q) ||
      mod.subtitle.toLowerCase().includes(q)
    ) {
      results.push({
        kind: "roadmap",
        href: `/roadmap/${encodeURIComponent(mod.slug)}`,
        title: mod.title,
        subtitle: mod.subtitle,
        cefr: mod.cefr_level,
      });
      if (results.length >= maxItems) return results;
    }
  }

  const rawReadings = getAllReadingsRaw();
  for (const conv of rawReadings.conversations) {
    if (
      conv.title.toLowerCase().includes(q) ||
      conv.subtitle.toLowerCase().includes(q)
    ) {
      results.push({
        kind: "bacaan",
        href: `/bacaan/${encodeURIComponent(`dialog-${conv.slug}`)}`,
        title: conv.title,
        subtitle: conv.subtitle,
        cefr: conv.cefr,
      });
      if (results.length >= maxItems) return results;
    }
  }

  for (const r of getAllReadingsList()) {
    if (
      r.title.toLowerCase().includes(q) ||
      (r.subtitle ?? "").toLowerCase().includes(q)
    ) {
      results.push({
        kind: "bacaan",
        href: `/bacaan/${encodeURIComponent(r.slug)}`,
        title: r.title,
        subtitle: r.subtitle ?? "Materi bacaan",
        cefr: r.cefr,
      });
      if (results.length >= maxItems) return results;
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "8", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(limitRaw, 20))
    : 8;

  if (!query) {
    return NextResponse.json({ hits: [], suggestions: [], contentHits: [] });
  }

  const result = await searchDictionary(query, limit);
  const contentHits = searchRelatedContent(query, 4);
  return NextResponse.json({ ...result, contentHits });
}
