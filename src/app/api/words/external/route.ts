import { NextRequest, NextResponse } from "next/server";
import type { DefinitionEn, WordEntry } from "@/types/linggis";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

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

interface MyMemoryResponse {
  responseStatus?: number;
  responseData?: {
    translatedText?: string;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawWord = (searchParams.get("word") ?? "").trim();

  // Batasi hanya kata Inggris bersih (1-3 kata huruf alfabet/tanda hubung)
  if (!/^[a-zA-Z][a-zA-Z\s-]{1,32}$/.test(rawWord)) {
    return NextResponse.json({ found: false, word: null });
  }

  try {
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(rawWord)}`,
      {
        signal: AbortSignal.timeout(4500),
        next: { revalidate: 86400 },
      }
    );

    if (!dictRes.ok) {
      return NextResponse.json({ found: false, word: null });
    }

    const dictJson = (await dictRes.json()) as FreeDictEntry[];
    const first = Array.isArray(dictJson) ? dictJson[0] : null;
    if (!first) {
      return NextResponse.json({ found: false, word: null });
    }

    const ipa =
      first.phonetic ??
      first.phonetics?.find((p) => p.text && p.text.trim().length > 0)?.text ??
      null;
    const audioUrl =
      first.phonetics?.find((p) => p.audio && p.audio.trim().length > 0)?.audio ??
      null;

    const firstPos = first.meanings?.[0]?.partOfSpeech ?? "word";
    const defs: DefinitionEn[] = [];
    const synSet = new Set<string>();
    const antSet = new Set<string>();

    for (const m of first.meanings ?? []) {
      for (const s of m.synonyms ?? []) synSet.add(s);
      for (const a of m.antonyms ?? []) antSet.add(a);
      for (const d of m.definitions ?? []) {
        if (d.definition && defs.length < 4) {
          defs.push({ meaning: d.definition, example: d.example });
        }
        for (const s of d.synonyms ?? []) synSet.add(s);
        for (const a of d.antonyms ?? []) antSet.add(a);
      }
    }

    // Opsional fallback terjemahan EN -> ID lewat MyMemory API
    let translationsId: string[] = [];
    try {
      const mmEmail = process.env.MYMEMORY_EMAIL;
      const mmUrl = new URL("https://api.mymemory.translated.net/get");
      mmUrl.searchParams.set("q", first.word ?? rawWord);
      mmUrl.searchParams.set("langpair", "en|id");
      if (mmEmail) {
        mmUrl.searchParams.set("de", mmEmail);
      }

      const mmRes = await fetch(mmUrl.toString(), {
        signal: AbortSignal.timeout(3500),
      });
      if (mmRes.ok) {
        const mmData = (await mmRes.json()) as MyMemoryResponse;
        const translated = mmData.responseData?.translatedText?.trim();
        if (
          translated &&
          translated.toLowerCase() !== rawWord.toLowerCase() &&
          !/invalid|limit/i.test(translated)
        ) {
          translationsId = [translated];
        }
      }
    } catch {
      // Tetap lanjut memakai definisi bahasa Inggris bila layanan terjemahan tidak terjangkau
    }

    if (translationsId.length === 0) {
      translationsId = [
        "Terjemahan ringkas Indonesia belum tersedia offline — simak definisi bahasa Inggris di bawah.",
      ];
    }

    const headword = first.word ?? rawWord;
    const slug = slugify(headword);
    const entry: WordEntry = {
      slug,
      word: headword.charAt(0).toUpperCase() + headword.slice(1),
      pos: firstPos,
      cefr_level: "B2",
      ipa,
      reading_hint_id: null,
      audio_url: audioUrl,
      translations_id: translationsId,
      definitions_en: defs,
      usage_note_id:
        "Entri dilengkapi secara daring dari Free Dictionary API & fallback terjemahan.",
      category: "Kamus Daring",
      topics: ["Kamus Daring"],
      synonyms: Array.from(synSet).slice(0, 8),
      antonyms: Array.from(antSet).slice(0, 8),
      enriched_at: new Date().toISOString(),
    };

    // Cache ke Supabase jika sudah dikonfigurasi
    const supabase = getSupabaseServiceClient();
    if (supabase) {
      try {
        await supabase.from("words").upsert(
          {
            word: entry.word,
            slug: entry.slug,
            pos: entry.pos,
            cefr_level: entry.cefr_level,
            ipa: entry.ipa,
            audio_url: entry.audio_url,
            translations_id: entry.translations_id,
            definitions_en: entry.definitions_en,
            usage_note_id: entry.usage_note_id,
            category: entry.category,
            synonyms: entry.synonyms,
            antonyms: entry.antonyms,
            enriched_at: entry.enriched_at,
          },
          { onConflict: "slug", ignoreDuplicates: true }
        );
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({ found: true, word: entry });
  } catch {
    return NextResponse.json({ found: false, word: null });
  }
}

