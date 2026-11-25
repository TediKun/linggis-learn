import { NextRequest, NextResponse } from "next/server";
import {
  getAllLocalWords,
  getAllPhraseGroups,
  getWordsByCefr,
} from "@/lib/data-store";
import { getFullRoadmap } from "@/lib/roadmap-builder";
import type { CefrLevel } from "@/types/linggis";

export interface FlashcardItem {
  slug: string;
  word: string;
  pos: string;
  cefr_level: CefrLevel;
  ipa: string | null;
  reading_hint_id: string | null;
  audio_url: string | null;
  translations_id: string[];
  usage_note_id: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFlashcardLookup(): Map<string, FlashcardItem> {
  const map = new Map<string, FlashcardItem>();

  for (const w of getAllLocalWords()) {
    map.set(w.slug, {
      slug: w.slug,
      word: w.word,
      pos: w.pos,
      cefr_level: w.cefr_level,
      ipa: w.ipa,
      reading_hint_id: w.reading_hint_id,
      audio_url: w.audio_url,
      translations_id: w.translations_id,
      usage_note_id: w.usage_note_id,
    });
  }

  for (const grp of getAllPhraseGroups()) {
    for (const item of grp.items) {
      const s = slugify(item.en);
      if (!s || map.has(s)) continue;
      map.set(s, {
        slug: s,
        word: item.en,
        pos: grp.kind.replace("_", " "),
        cefr_level: grp.cefr,
        ipa: null,
        reading_hint_id: item.read_hint || null,
        audio_url: null,
        translations_id: [item.id],
        usage_note_id: grp.title,
      });
    }
  }

  for (const mod of getFullRoadmap()) {
    const level: CefrLevel = mod.cefr_level === "A0" ? "A1" : mod.cefr_level;
    for (const item of mod.key_phrases) {
      const s = slugify(item.en);
      if (!s || map.has(s)) continue;
      map.set(s, {
        slug: s,
        word: item.en,
        pos: "frasa roadmap",
        cefr_level: level,
        ipa: null,
        reading_hint_id: item.read_hint || null,
        audio_url: null,
        translations_id: [item.id],
        usage_note_id: mod.title,
      });
    }
  }

  return map;
}

let cachedLookup: Map<string, FlashcardItem> | null = null;

function getLookup(): Map<string, FlashcardItem> {
  if (!cachedLookup) {
    cachedLookup = buildFlashcardLookup();
  }
  return cachedLookup;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs");
  const levelParam = (searchParams.get("level") ?? "A1").toUpperCase();
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "30", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(limitRaw, 80))
    : 30;

  if (slugsParam !== null) {
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 120);

    const lookup = getLookup();
    const cards: FlashcardItem[] = [];
    for (const s of slugs) {
      const found = lookup.get(s);
      if (found) cards.push(found);
    }
    return NextResponse.json({ cards });
  }

  const validLevels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
  const level: CefrLevel = validLevels.includes(levelParam as CefrLevel)
    ? (levelParam as CefrLevel)
    : "A1";

  const words = getWordsByCefr(level, limit);
  const cards: FlashcardItem[] = words.map((w) => ({
    slug: w.slug,
    word: w.word,
    pos: w.pos,
    cefr_level: w.cefr_level,
    ipa: w.ipa,
    reading_hint_id: w.reading_hint_id,
    audio_url: w.audio_url,
    translations_id: w.translations_id,
    usage_note_id: w.usage_note_id,
  }));

  return NextResponse.json({ cards });
}

