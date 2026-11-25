/**
 * Skrip Ekspansi Kamus & Contoh Kalimat dari Kaikki.org (Wiktionary JSONL) dan Tatoeba TSV.
 * Gunakan jika ingin memperluas kamus Linggis di Supabase menjadi puluhan ribu kata setelah setup Supabase.
 *
 * Cara pakai:
 *   1. Unduh JSONL Wiktionary dari https://kaikki.org/dictionary/rawdata.html
 *      (mis. wiktextract English JSONL atau Indonesian Wiktionary JSONL)
 *      dan korpus kalimat EN-ID dari https://www.manythings.org/bilingual/ind/ (ind.txt)
 *   2. Pastikan .env.local terisi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY
 *   3. Jalankan:
 *      npx tsx scripts/seed/seed-kaikki-tatoeba.ts --tatoeba ./ind.txt --kaikki ./kaikki-en.jsonl
 */
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function getArg(flag: string): string | null {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface KaikkiLine {
  word?: string;
  lang_code?: string;
  pos?: string;
  sounds?: Array<{ ipa?: string; audio?: string }>;
  senses?: Array<{
    glosses?: string[];
    examples?: Array<{ text?: string }>;
  }>;
  translations?: Array<{
    lang_code?: string;
    code?: string;
    word?: string;
  }>;
  synonyms?: Array<{ word?: string }>;
  antonyms?: Array<{ word?: string }>;
}

async function importTatoeba(supabase: SupabaseClient, filePath: string) {
  const stream = fs.createReadStream(path.resolve(filePath), "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const batch: Array<{ en_text: string; id_text: string; source: string }> = [];
  let total = 0;

  for await (const line of rl) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    const enText = parts[0].trim();
    const idText = parts[1].trim();
    if (!enText || !idText) continue;

    batch.push({ en_text: enText, id_text: idText, source: "tatoeba" });
    if (batch.length >= 250) {
      const { error } = await supabase
        .from("example_sentences")
        .insert(batch.splice(0, batch.length));
      if (error) throw error;
      total += 250;
      if (total % 2500 === 0) {
        console.log(`Imported ${total} Tatoeba sentences...`);
      }
    }
  }

  if (batch.length > 0) {
    const { error } = await supabase.from("example_sentences").insert(batch);
    if (error) throw error;
    total += batch.length;
  }
  console.log(`Selesai mengimpor ${total} contoh kalimat Tatoeba.`);
}

async function importKaikki(
  supabase: SupabaseClient,
  filePath: string,
  maxEntries: number
) {
  const stream = fs.createReadStream(path.resolve(filePath), "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const batch: Array<Record<string, unknown>> = [];
  const seenSlugs = new Set<string>();
  let total = 0;

  for await (const rawLine of rl) {
    if (total >= maxEntries) break;
    const line = rawLine.trim();
    if (!line) continue;

    let parsed: KaikkiLine;
    try {
      parsed = JSON.parse(line) as KaikkiLine;
    } catch {
      continue;
    }

    if (parsed.lang_code && parsed.lang_code !== "en") continue;
    const headword = parsed.word?.trim();
    if (!headword || !/^[a-zA-Z][a-zA-Z\s-]{0,40}$/.test(headword)) continue;

    const idTranslations = (parsed.translations ?? [])
      .filter((t) => (t.lang_code === "id" || t.code === "id") && t.word)
      .map((t) => t.word!.trim())
      .filter(Boolean);

    const defsEn = (parsed.senses ?? [])
      .flatMap((s) =>
        (s.glosses ?? []).map((g) => ({
          meaning: g,
          example: s.examples?.[0]?.text,
        }))
      )
      .slice(0, 4);

    if (idTranslations.length === 0 && defsEn.length === 0) continue;

    const slug = slugify(headword);
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const ipa = parsed.sounds?.find((s) => s.ipa)?.ipa ?? null;
    const synonyms = (parsed.synonyms ?? [])
      .map((s) => s.word?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 8);
    const antonyms = (parsed.antonyms ?? [])
      .map((a) => a.word?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 8);

    batch.push({
      word: headword,
      slug,
      pos: parsed.pos ?? "noun",
      cefr_level: "B2",
      ipa,
      translations_id: idTranslations.slice(0, 6),
      definitions_en: defsEn,
      synonyms,
      antonyms,
      category: "Kaikki Extended",
    });

    if (batch.length >= 200) {
      const { error } = await supabase
        .from("words")
        .upsert(batch.splice(0, batch.length), {
          onConflict: "slug",
          ignoreDuplicates: true,
        });
      if (error) throw error;
      total += 200;
      if (total % 2000 === 0) {
        console.log(`Upserted ${total} Kaikki entries...`);
      }
    }
  }

  if (batch.length > 0) {
    const len = batch.length;
    const { error } = await supabase.from("words").upsert(batch, {
      onConflict: "slug",
      ignoreDuplicates: true,
    });
    if (error) throw error;
    total += len;
  }
  console.log(`Selesai mengimpor ${total} entri kamus Kaikki.`);
}

async function main() {
  loadEnvLocal();
  const tatoebaPath = getArg("--tatoeba");
  const kaikkiPath = getArg("--kaikki");
  const limitRaw = Number.parseInt(getArg("--limit") ?? "25000", 10);
  const maxKaikki = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 25000;

  if (!tatoebaPath && !kaikkiPath) {
    console.log(
      "Gunakan --tatoeba <path/to/ind.txt> dan/atau --kaikki <path/to/kaikki.jsonl> [--limit 25000]."
    );
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local terlebih dahulu."
    );
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  if (kaikkiPath) {
    await importKaikki(supabase, kaikkiPath, maxKaikki);
  }
  if (tatoebaPath) {
    await importTatoeba(supabase, tatoebaPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
