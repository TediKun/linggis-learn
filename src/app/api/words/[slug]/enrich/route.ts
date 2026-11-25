import { NextRequest, NextResponse } from "next/server";
import { cacheWordEnrichmentToSupabase, getWordBySlug } from "@/lib/data-store";
import type { DefinitionEn } from "@/types/linggis";

interface FreeDictPhonetic {
  text?: string;
  audio?: string;
}

interface FreeDictDefinition {
  definition?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictMeaning {
  partOfSpeech?: string;
  definitions?: FreeDictDefinition[];
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictEntry {
  word?: string;
  phonetic?: string;
  phonetics?: FreeDictPhonetic[];
  meanings?: FreeDictMeaning[];
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { word } = await getWordBySlug(slug);

  if (!word) {
    return NextResponse.json({ error: "Kata tidak ditemukan" }, { status: 404 });
  }

  // Jangan fetch berulang jika sudah ada definisi & IPA yang terisi
  if (word.enriched_at && word.definitions_en.length > 0) {
    return NextResponse.json({ word, enriched: false });
  }

  // Untuk frasa panjang (> 3 kata), Free Dictionary API umumnya tidak memiliki entri
  const headword = word.word.trim();
  if (headword.split(/\s+/).length > 3) {
    return NextResponse.json({
      word,
      enriched: false,
      reason: "phrase_skipped",
    });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(headword)}`,
      {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        word,
        enriched: false,
        reason: "dictionary_api_not_found",
      });
    }

    const data = (await res.json()) as FreeDictEntry[];
    const first = Array.isArray(data) ? data[0] : null;
    if (!first) {
      return NextResponse.json({ word, enriched: false, reason: "empty" });
    }

    const ipa =
      word.ipa ??
      first.phonetic ??
      first.phonetics?.find((p) => p.text && p.text.trim().length > 0)?.text ??
      null;

    const audioUrl =
      word.audio_url ??
      first.phonetics?.find((p) => p.audio && p.audio.trim().length > 0)?.audio ??
      null;

    const defs: DefinitionEn[] = [];
    const synSet = new Set<string>(word.synonyms);
    const antSet = new Set<string>(word.antonyms);

    for (const m of first.meanings ?? []) {
      for (const s of m.synonyms ?? []) synSet.add(s);
      for (const a of m.antonyms ?? []) antSet.add(a);
      for (const d of m.definitions ?? []) {
        if (d.definition && defs.length < 4) {
          defs.push({
            meaning: d.definition,
            example: d.example,
          });
        }
        for (const s of d.synonyms ?? []) synSet.add(s);
        for (const a of d.antonyms ?? []) antSet.add(a);
      }
    }

    const mergedDefs = word.definitions_en.length > 0 ? word.definitions_en : defs;
    const synonyms = Array.from(synSet).slice(0, 8);
    const antonyms = Array.from(antSet).slice(0, 8);

    await cacheWordEnrichmentToSupabase(word.slug, {
      ipa,
      audio_url: audioUrl,
      definitions_en: mergedDefs,
      synonyms,
      antonyms,
    });

    return NextResponse.json({
      word: {
        ...word,
        ipa,
        audio_url: audioUrl,
        definitions_en: mergedDefs,
        synonyms,
        antonyms,
        enriched_at: new Date().toISOString(),
      },
      enriched: true,
    });
  } catch {
    return NextResponse.json({
      word,
      enriched: false,
      reason: "network_unavailable",
    });
  }
}

