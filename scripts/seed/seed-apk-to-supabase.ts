/**
 * Skrip Seeding Dataset APK ke Supabase
 * Jalankan setelah mengisi .env.local dan menjalankan migrasi SQL:
 *   npm run seed:apk
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  getAllLocalWords,
  getAllQuizPacks,
  getAllReadingsRaw,
} from "../../src/lib/data-store";
import { getFullRoadmap } from "../../src/lib/roadmap-builder";

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

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local sebelum menjalankan seeding."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  console.log("1. Seeding tabel words...");
  const words = getAllLocalWords();
  const batchSize = 200;
  for (let i = 0; i < words.length; i += batchSize) {
    const chunk = words.slice(i, i + batchSize).map((w) => ({
      word: w.word,
      slug: w.slug,
      pos: w.pos,
      cefr_level: w.cefr_level,
      ipa: w.ipa,
      reading_hint_id: w.reading_hint_id,
      audio_url: w.audio_url,
      translations_id: w.translations_id,
      definitions_en: w.definitions_en,
      usage_note_id: w.usage_note_id,
      category: w.category,
      synonyms: w.synonyms,
      antonyms: w.antonyms,
    }));
    const { error } = await supabase
      .from("words")
      .upsert(chunk, { onConflict: "slug" });
    if (error) {
      throw new Error(`Gagal upsert words batch ${i}: ${error.message}`);
    }
  }
  console.log(`   -> ${words.length} entri kamus berhasil di-upsert.`);

  console.log("2. Seeding tabel roadmap_modules...");
  const roadmap = getFullRoadmap();
  for (let i = 0; i < roadmap.length; i += 50) {
    const chunk = roadmap.slice(i, i + 50).map((m) => ({
      slug: m.slug,
      cefr_level: m.cefr_level,
      track: m.track,
      order_index: m.order_index,
      title: m.title,
      summary: m.summary,
      grammar_markdown: m.markdown,
      key_vocab_slugs: m.key_vocab_slugs,
      estimated_minutes: m.estimated_minutes,
    }));
    const { error } = await supabase
      .from("roadmap_modules")
      .upsert(chunk, { onConflict: "slug" });
    if (error) {
      throw new Error(`Gagal upsert roadmap batch ${i}: ${error.message}`);
    }
  }
  console.log(`   -> ${roadmap.length} modul roadmap berhasil di-upsert.`);

  console.log("3. Seeding tabel quiz_questions...");
  const packs = getAllQuizPacks();
  const allQuestions = packs.flatMap((p) =>
    p.questions.map((q) => ({
      module_slug: p.slug,
      question_type: q.question_type,
      prompt: q.prompt,
      audio_text: q.audio_text ?? null,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation_id: q.explanation_id,
      difficulty: q.difficulty,
    }))
  );

  // Bersihkan soal lama terlebih dahulu agar idempoten
  await supabase.from("quiz_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  for (let i = 0; i < allQuestions.length; i += 200) {
    const chunk = allQuestions.slice(i, i + 200);
    const { error } = await supabase.from("quiz_questions").insert(chunk);
    if (error) {
      throw new Error(`Gagal insert quiz batch ${i}: ${error.message}`);
    }
  }
  console.log(`   -> ${allQuestions.length} soal kuis berhasil dimasukkan.`);

  console.log("4. Seeding tabel example_sentences...");
  const readings = getAllReadingsRaw();
  const exampleRows: Array<{
    en_text: string;
    id_text: string;
    cefr_level: string;
    source: string;
  }> = [];

  for (const conv of readings.conversations) {
    for (const turn of conv.turns) {
      if (turn.en.trim() && turn.id.trim()) {
        exampleRows.push({
          en_text: turn.en.trim(),
          id_text: turn.id.trim(),
          cefr_level: conv.cefr,
          source: `Dialog: ${conv.title}`,
        });
      }
    }
  }
  for (const rel of readings.relatable) {
    if (rel.correct_en.trim() && rel.correct_id.trim()) {
      exampleRows.push({
        en_text: rel.correct_en.trim(),
        id_text: rel.correct_id.trim(),
        cefr_level: rel.cefr,
        source: `Natural: ${rel.title}`,
      });
    }
  }

  await supabase
    .from("example_sentences")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  for (let i = 0; i < exampleRows.length; i += 200) {
    const chunk = exampleRows.slice(i, i + 200);
    const { error } = await supabase.from("example_sentences").insert(chunk);
    if (error) {
      throw new Error(`Gagal insert example_sentences batch ${i}: ${error.message}`);
    }
  }
  console.log(`   -> ${exampleRows.length} contoh kalimat berhasil dimasukkan.`);
  console.log("Seeding selesai.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

