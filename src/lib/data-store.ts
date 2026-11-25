import fs from "node:fs";
import path from "node:path";
import type {
  CefrLevel,
  ConversationPassage,
  ExampleSentence,
  PhraseGroup,
  QuizPack,
  QuizQuestion,
  ReadingGuide,
  ReadingPassage,
  RelatableScenario,
  VocabCategory,
  WordEntry,
  WordSearchHit,
} from "@/types/linggis";
import {
  getSupabaseAnonServerClient,
  getSupabaseServiceClient,
} from "@/lib/supabase/server";

interface RawApkWord {
  slug: string;
  word: string;
  pos: string;
  cefr_level: CefrLevel;
  pronunciation_hint_id: string;
  translations_id: string[];
  category: string;
  topics: string[];
}

interface RawApkPhraseGroup {
  slug: string;
  title: string;
  subtitle?: string;
  group?: string;
  level_label?: string;
  cefr: CefrLevel;
  part?: number;
  items: Array<{ en: string; read_hint: string; id: string }>;
}

interface RawApkGrammar {
  order: number;
  slug: string;
  title: string;
  html_title: string;
  apk_level: string;
  cefr_level: CefrLevel;
  markdown: string;
}

interface RawApkReadings {
  guides: ReadingGuide[];
  daily_talk: Array<{
    id: number;
    slug: string;
    title: string;
    apk_level: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  conversations: ConversationPassage[];
  stories: Array<{
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  fun_facts: Array<{
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  movie_scenes: Array<{
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  daily_news: Array<{
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  speeches: Array<{
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    cefr: CefrLevel;
    markdown: string;
  }>;
  relatable: RelatableScenario[];
}

interface RawApkQuizzes {
  ujian: Array<{
    id: number;
    slug: string;
    title: string;
    topic: string;
    cefr: CefrLevel;
    questions: Array<{
      prompt: string;
      options: string[];
      correct_answer: string;
      explanation_id: string;
    }>;
  }>;
  fill_blank: Array<{
    prompt: string;
    options: string[];
    correct_answer: string;
    cefr: CefrLevel;
    explanation_id: string;
  }>;
  vocab_match: Array<{
    en: string;
    id: string;
    cefr: CefrLevel;
    group: string;
  }>;
  conversation_choice: Array<{
    prompt: string;
    options: string[];
    correct_answer: string;
    explanation_id: string;
    cefr: CefrLevel;
  }>;
}

function readJsonFile<T>(relPath: string): T {
  const fullPath = path.join(process.cwd(), "data", "apk", relPath);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapWordCefrOverride(raw: RawApkWord): CefrLevel {
  if (raw.topics.some((t) => t.includes("Politik") || t.includes("Pertanian"))) {
    return "B2";
  }
  if (raw.topics.some((t) => t.includes("Less") || t.includes("Ly"))) {
    return "B2";
  }
  return raw.cefr_level;
}

// Cache dataset lokal di memori server
let cachedWords: WordEntry[] | null = null;
let cachedWordMap: Map<string, WordEntry> | null = null;
let cachedCategories: VocabCategory[] | null = null;
let cachedPhraseGroups: PhraseGroup[] | null = null;
let cachedGrammar: RawApkGrammar[] | null = null;
let cachedReadings: RawApkReadings | null = null;
let cachedQuizzes: RawApkQuizzes | null = null;
let cachedSearchIndex: WordSearchHit[] | null = null;

export function getApkCategories(): VocabCategory[] {
  if (!cachedCategories) {
    cachedCategories = readJsonFile<VocabCategory[]>("vocab_categories.json");
  }
  return cachedCategories;
}

export function getAllLocalWords(): WordEntry[] {
  if (cachedWords) return cachedWords;

  const rawWords = readJsonFile<RawApkWord[]>("words.json");
  const phrasesData = readJsonFile<
    Record<
      "hafalan" | "expressions" | "phrasal_verbs" | "idioms" | "slang" | "patterns" | "i_statements",
      RawApkPhraseGroup[]
    >
  >("phrases.json");

  const map = new Map<string, WordEntry>();

  for (const rw of rawWords) {
    const cefr = mapWordCefrOverride(rw);
    map.set(rw.slug, {
      slug: rw.slug,
      word: rw.word,
      pos: rw.pos,
      cefr_level: cefr,
      ipa: null,
      reading_hint_id: rw.pronunciation_hint_id || null,
      audio_url: null,
      translations_id: rw.translations_id,
      definitions_en: [],
      usage_note_id: rw.topics.length
        ? `Termasuk topik: ${rw.topics.join(", ")}.`
        : null,
      category: rw.category,
      topics: rw.topics,
      synonyms: [],
      antonyms: [],
    });
  }

  // Tambahkan idiom, phrasal verb, slang, dan ungkapan inti ke kamus agar bisa dicari & disimpan ke flashcard
  const phrasePosMap: Array<[keyof typeof phrasesData, string, string]> = [
    ["phrasal_verbs", "phrasal verb", "Phrasal Verb"],
    ["idioms", "idiom", "Idiom"],
    ["slang", "slang", "Slang & Kasual"],
    ["expressions", "expression", "Ekspresi Harian"],
  ];

  for (const [key, posLabel, catLabel] of phrasePosMap) {
    for (const grp of phrasesData[key]) {
      for (const item of grp.items) {
        const s = slugify(item.en);
        if (!s || map.has(s)) continue;
        map.set(s, {
          slug: s,
          word: item.en,
          pos: posLabel,
          cefr_level: grp.cefr,
          ipa: null,
          reading_hint_id: item.read_hint || null,
          audio_url: null,
          translations_id: [item.id],
          definitions_en: [],
          usage_note_id: `Ungkapan dari kelompok "${grp.title}" (${catLabel}).`,
          category: catLabel,
          topics: [grp.title],
          synonyms: [],
          antonyms: [],
        });
      }
    }
  }

  cachedWords = Array.from(map.values());
  cachedWordMap = map;
  return cachedWords;
}

function getWordMap(): Map<string, WordEntry> {
  if (!cachedWordMap) {
    getAllLocalWords();
  }
  return cachedWordMap!;
}

export function getAllPhraseGroups(): PhraseGroup[] {
  if (cachedPhraseGroups) return cachedPhraseGroups;
  const raw = readJsonFile<
    Record<PhraseGroup["kind"], RawApkPhraseGroup[]>
  >("phrases.json");

  const list: PhraseGroup[] = [];
  (Object.keys(raw) as Array<PhraseGroup["kind"]>).forEach((kind) => {
    for (const g of raw[kind]) {
      list.push({
        slug: g.slug,
        title: g.title,
        subtitle: g.subtitle,
        group: g.group,
        level_label: g.level_label,
        cefr: g.cefr,
        kind,
        items: g.items,
      });
    }
  });
  cachedPhraseGroups = list;
  return list;
}

export function getAllGrammarRaw(): RawApkGrammar[] {
  if (!cachedGrammar) {
    cachedGrammar = readJsonFile<RawApkGrammar[]>("grammar.json");
  }
  return cachedGrammar;
}

export function getAllReadingsRaw(): RawApkReadings {
  if (!cachedReadings) {
    cachedReadings = readJsonFile<RawApkReadings>("readings.json");
  }
  return cachedReadings;
}

export function getAllQuizzesRaw(): RawApkQuizzes {
  if (!cachedQuizzes) {
    cachedQuizzes = readJsonFile<RawApkQuizzes>("quizzes.json");
  }
  return cachedQuizzes;
}

function getSearchIndex(): WordSearchHit[] {
  if (cachedSearchIndex) return cachedSearchIndex;
  const words = getAllLocalWords();
  cachedSearchIndex = words.map((w) => ({
    slug: w.slug,
    word: w.word,
    pos: w.pos,
    cefr_level: w.cefr_level,
    short_meaning_id: w.translations_id.slice(0, 2).join(" / "),
    ipa: w.ipa,
    reading_hint_id: w.reading_hint_id,
    kind:
      w.pos === "idiom"
        ? "idiom"
        : w.pos === "phrasal verb"
        ? "phrasal_verb"
        : w.pos === "slang"
        ? "slang"
        : w.pos === "expression"
        ? "phrase"
        : "word",
  }));
  return cachedSearchIndex;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export async function searchDictionary(
  query: string,
  limit = 8
): Promise<{ hits: WordSearchHit[]; suggestions: WordSearchHit[] }> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { hits: [], suggestions: [] };
  }

  // Jika Supabase sudah dikonfigurasi, utamakan query ke Supabase lebih dulu
  const supabase = getSupabaseAnonServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("words")
        .select("slug, word, pos, cefr_level, translations_id, ipa, reading_hint_id")
        .ilike("word", `%${q}%`)
        .limit(limit);

      if (data && data.length > 0) {
        const hits: WordSearchHit[] = data.map((row) => ({
          slug: String(row.slug),
          word: String(row.word),
          pos: String(row.pos),
          cefr_level: (row.cefr_level as CefrLevel) ?? "A1",
          short_meaning_id: Array.isArray(row.translations_id)
            ? (row.translations_id as string[]).slice(0, 2).join(" / ")
            : "",
          ipa: (row.ipa as string | null) ?? null,
          reading_hint_id: (row.reading_hint_id as string | null) ?? null,
          kind: "word",
        }));
        return { hits, suggestions: [] };
      }
    } catch {
      // Fallback mulus ke indeks lokal jika tabel belum di-seed
    }
  }

  const index = getSearchIndex();
  const scored: Array<{ hit: WordSearchHit; score: number }> = [];

  for (const hit of index) {
    const wLower = hit.word.toLowerCase();
    const idLower = hit.short_meaning_id.toLowerCase();
    if (wLower === q) {
      scored.push({ hit, score: 100 });
    } else if (wLower.startsWith(q)) {
      scored.push({ hit, score: 85 - Math.min(15, wLower.length - q.length) });
    } else if (idLower === q) {
      scored.push({ hit, score: 80 });
    } else if (idLower.startsWith(q)) {
      scored.push({ hit, score: 65 });
    } else if (wLower.includes(q)) {
      scored.push({ hit, score: 50 });
    } else if (idLower.includes(q)) {
      scored.push({ hit, score: 35 });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.hit.word.length - b.hit.word.length);
  const hits = scored.slice(0, limit).map((s) => s.hit);

  if (hits.length > 0) {
    return { hits, suggestions: [] };
  }

  // Fuzzy similarity suggestions jika tidak ada hasil persis
  const fuzzy = index
    .filter((h) => Math.abs(h.word.length - q.length) <= 3)
    .map((h) => ({ hit: h, dist: levenshtein(q, h.word.toLowerCase()) }))
    .filter((x) => x.dist <= 3)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 6)
    .map((x) => x.hit);

  return { hits: [], suggestions: fuzzy };
}

export async function getWordBySlug(slug: string): Promise<{
  word: WordEntry | null;
  examples: ExampleSentence[];
  suggestions: WordSearchHit[];
}> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  let entry: WordEntry | null = null;
  const examples: ExampleSentence[] = [];

  // 1. Cek Supabase jika aktif
  const supabase = getSupabaseAnonServerClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("words")
        .select("*")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (data) {
        entry = {
          id: String(data.id),
          slug: String(data.slug),
          word: String(data.word),
          pos: String(data.pos),
          cefr_level: (data.cefr_level as CefrLevel) ?? "A1",
          ipa: (data.ipa as string | null) ?? null,
          reading_hint_id: (data.reading_hint_id as string | null) ?? null,
          audio_url: (data.audio_url as string | null) ?? null,
          translations_id: Array.isArray(data.translations_id)
            ? (data.translations_id as string[])
            : [],
          definitions_en: Array.isArray(data.definitions_en)
            ? (data.definitions_en as WordEntry["definitions_en"])
            : [],
          usage_note_id: (data.usage_note_id as string | null) ?? null,
          category: (data.category as string | null) ?? null,
          topics: [],
          synonyms: Array.isArray(data.synonyms) ? (data.synonyms as string[]) : [],
          antonyms: Array.isArray(data.antonyms) ? (data.antonyms as string[]) : [],
          enriched_at: (data.enriched_at as string | null) ?? null,
        };

        const { data: exRows } = await supabase
          .from("example_sentences")
          .select("*")
          .eq("word_id", data.id)
          .limit(6);

        if (exRows) {
          for (const row of exRows) {
            examples.push({
              id: String(row.id),
              word_slug: cleanSlug,
              en_text: String(row.en_text),
              id_text: String(row.id_text),
              cefr_level: (row.cefr_level as CefrLevel) ?? "A1",
              source: String(row.source ?? "supabase"),
            });
          }
        }
      }
    } catch {
      // Fallback ke lokal
    }
  }

  // 2. Fallback / gabungkan dengan kamus lokal APK
  if (!entry) {
    entry = getWordMap().get(cleanSlug) ?? null;
  }

  if (!entry) {
    const { suggestions } = await searchDictionary(cleanSlug.replace(/-/g, " "), 6);
    return { word: null, examples: [], suggestions };
  }

  // 3. Temukan contoh kalimat kontekstual dari percakapan, ungkapan, & relatable scenarios APK
  if (examples.length < 4) {
    const targetRegex = new RegExp(
      `\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    const readings = getAllReadingsRaw();

    for (const conv of readings.conversations) {
      for (const turn of conv.turns) {
        if (targetRegex.test(turn.en)) {
          examples.push({
            id: `conv-${conv.id}-${examples.length}`,
            word_slug: entry.slug,
            en_text: turn.en,
            id_text: turn.id,
            cefr_level: conv.cefr,
            source: conv.title,
          });
        }
        if (examples.length >= 5) break;
      }
      if (examples.length >= 5) break;
    }

    if (examples.length < 5) {
      for (const rel of readings.relatable) {
        if (targetRegex.test(rel.correct_en) || targetRegex.test(rel.prompt_en)) {
          const usePrompt = targetRegex.test(rel.prompt_en);
          examples.push({
            id: `rel-${rel.id}`,
            word_slug: entry.slug,
            en_text: usePrompt ? rel.prompt_en : rel.correct_en,
            id_text: usePrompt ? rel.prompt_id : rel.correct_id,
            cefr_level: rel.cefr,
            source: rel.title,
          });
        }
        if (examples.length >= 5) break;
      }
    }

    if (examples.length < 5) {
      const phrases = getAllPhraseGroups();
      for (const grp of phrases) {
        for (const it of grp.items) {
          if (targetRegex.test(it.en) && it.en.toLowerCase() !== entry.word.toLowerCase()) {
            examples.push({
              id: `phr-${grp.slug}-${examples.length}`,
              word_slug: entry.slug,
              en_text: it.en,
              id_text: it.id,
              cefr_level: grp.cefr,
              source: grp.title,
            });
          }
          if (examples.length >= 5) break;
        }
        if (examples.length >= 5) break;
      }
    }
  }

  return { word: entry, examples, suggestions: [] };
}

export async function cacheWordEnrichmentToSupabase(
  slug: string,
  payload: {
    ipa: string | null;
    audio_url: string | null;
    definitions_en: WordEntry["definitions_en"];
    synonyms: string[];
    antonyms: string[];
  }
): Promise<boolean> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("words")
      .update({
        ipa: payload.ipa,
        audio_url: payload.audio_url,
        definitions_en: payload.definitions_en,
        synonyms: payload.synonyms,
        antonyms: payload.antonyms,
        enriched_at: new Date().toISOString(),
      })
      .eq("slug", slug);
    return !error;
  } catch {
    return false;
  }
}

export function getPopularStarterWords(): WordEntry[] {
  const map = getWordMap();
  const featuredSlugs = [
    "apple",
    "water",
    "book",
    "family",
    "friend",
    "happy",
    "learn",
    "speak",
    "work",
    "time",
    "beautiful",
    "confident",
  ];
  const out: WordEntry[] = [];
  for (const s of featuredSlugs) {
    const found = map.get(s);
    if (found) out.push(found);
  }
  if (out.length < 12) {
    for (const w of getAllLocalWords()) {
      if (!out.some((x) => x.slug === w.slug)) {
        out.push(w);
      }
      if (out.length >= 12) break;
    }
  }
  return out;
}

export function getWordsByCefr(level: CefrLevel, limit = 60): WordEntry[] {
  return getAllLocalWords()
    .filter((w) => w.cefr_level === level)
    .slice(0, limit);
}

export function getWordsBySlugs(slugs: string[]): WordEntry[] {
  const map = getWordMap();
  const out: WordEntry[] = [];
  for (const s of slugs) {
    const w = map.get(s);
    if (w) out.push(w);
  }
  return out;
}

export function getAllQuizPacks(): QuizPack[] {
  const raw = getAllQuizzesRaw();
  const packs: QuizPack[] = [];

  // 1. Kuis Kalimat Rumpang Bertahap (400 soal dibagi per 20 soal = 20 paket Level 1-20)
  for (let i = 0; i < raw.fill_blank.length; i += 20) {
    const slice = raw.fill_blank.slice(i, i + 20);
    const levelNum = Math.floor(i / 20) + 1;
    const diff: CefrLevel =
      levelNum <= 4 ? "A1" : levelNum <= 9 ? "A2" : levelNum <= 14 ? "B1" : "B2";
    packs.push({
      slug: `rumpang-level-${levelNum}`,
      title: `Lengkapi Kalimat Level ${levelNum}`,
      category: "kalimat_rumpang",
      description: `Latihan mengisi kata/tenses yang tepat dalam konteks kalimat (Level ${levelNum}).`,
      difficulty: diff,
      question_count: slice.length,
      questions: slice.map((q, idx) => ({
        id: `fb-${levelNum}-${idx}`,
        module_slug: `rumpang-level-${levelNum}`,
        question_type: "fill_blank",
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation_id: q.explanation_id,
        difficulty: q.cefr,
      })),
    });
  }

  // 2. Paket Ujian Grammar & Topik (Ujian 01..38 dari APK)
  for (const u of raw.ujian) {
    if (u.questions.length === 0) continue;
    // Jika ujian besar (seperti Ujian 10 / 38), pecah atau batasi sesi 20 soal acak/terpilih, simpan semua di pool
    packs.push({
      slug: u.slug,
      title: u.title,
      category: "ujian",
      description: `Uji pemahaman topik ${u.topic} dalam bentuk pilihan ganda.`,
      difficulty: u.cefr,
      question_count: u.questions.length,
      questions: u.questions.map((q, idx) => ({
        id: `${u.slug}-${idx}`,
        module_slug: u.slug,
        question_type: "multiple_choice",
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation_id: q.explanation_id,
        difficulty: u.cefr,
      })),
    });
  }

  // 3. Kuis Respon Percakapan Alami (Relatable Conversations)
  if (raw.conversation_choice.length > 0) {
    packs.push({
      slug: "respon-percakapan-natural",
      title: "Respon Percakapan Natural",
      category: "percakapan",
      description:
        "Pilih respons bahasa Inggris yang paling alami dan sopan sesuai situasi nyata.",
      difficulty: "A2",
      question_count: raw.conversation_choice.length,
      questions: raw.conversation_choice.map((q, idx) => ({
        id: `rel-${idx}`,
        module_slug: "respon-percakapan-natural",
        question_type: "multiple_choice",
        prompt: q.prompt,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation_id: q.explanation_id,
        difficulty: q.cefr,
      })),
    });
  }

  // 4. Paket Latihan Kosakata, Tebak Audio (Listening), & Susun Kalimat (Word Order) per CEFR Level
  const levels: CefrLevel[] = ["A1", "A2", "B1", "B2"];
  for (const lvl of levels) {
    const pairs = raw.vocab_match.filter((p) => p.cefr === lvl);
    if (pairs.length >= 10) {
      const sample = pairs.slice(0, 20);
      const allIds = pairs.map((p) => p.id);
      const mcQuestions: QuizQuestion[] = sample.map((item, idx) => {
        const distractors: string[] = [];
        let cursor = (idx * 7 + 3) % allIds.length;
        while (distractors.length < 3 && distractors.length < allIds.length - 1) {
          const cand = allIds[cursor];
          if (cand !== item.id && !distractors.includes(cand)) {
            distractors.push(cand);
          }
          cursor = (cursor + 5) % allIds.length;
        }
        const opts = [item.id, ...distractors].sort((a, b) => a.localeCompare(b));
        return {
          id: `vm-${lvl}-${idx}`,
          module_slug: `kosakata-${lvl.toLowerCase()}`,
          question_type: "multiple_choice",
          prompt: `Apa arti kata atau frasa "${item.en}"?`,
          options: opts,
          correct_answer: item.id,
          explanation_id: `"${item.en}" dalam bahasa Indonesia berarti "${item.id}".`,
          difficulty: lvl,
        };
      });

      packs.push({
        slug: `kosakata-${lvl.toLowerCase()}`,
        title: `Latihan Kosakata Level ${lvl}`,
        category: "kosa_kata",
        description: `Uji hafalan arti kosakata dan ungkapan penting tingkat ${lvl}.`,
        difficulty: lvl,
        question_count: mcQuestions.length,
        questions: mcQuestions,
      });

      // Listening Pack berbasis kata/frasa level ini
      const listeningQs: QuizQuestion[] = sample.slice(0, 15).map((item, idx) => {
        const distractors: string[] = [];
        let cursor = (idx * 11 + 2) % sample.length;
        while (distractors.length < 3 && distractors.length < sample.length - 1) {
          const cand = sample[cursor].en;
          if (cand !== item.en && !distractors.includes(cand)) {
            distractors.push(cand);
          }
          cursor = (cursor + 3) % sample.length;
        }
        const opts = [item.en, ...distractors].sort((a, b) => a.localeCompare(b));
        return {
          id: `ls-${lvl}-${idx}`,
          module_slug: `listening-${lvl.toLowerCase()}`,
          question_type: "listening",
          prompt: "Putar audio lalu pilih kata atau frasa bahasa Inggris yang Anda dengar.",
          audio_text: item.en,
          options: opts,
          correct_answer: item.en,
          explanation_id: `Audio mengucapkan "${item.en}" yang berarti "${item.id}".`,
          difficulty: lvl,
        };
      });

      packs.push({
        slug: `listening-${lvl.toLowerCase()}`,
        title: `Tebak Audio (Listening) ${lvl}`,
        category: "listening",
        description: `Latih telinga mengenali pelafalan kata dan frasa level ${lvl}.`,
        difficulty: lvl,
        question_count: listeningQs.length,
        questions: listeningQs,
      });
    }
  }

  // 5. Paket Susun Kalimat (Word Order) dari kalimat percakapan & ungkapan
  const readings = getAllReadingsRaw();
  const wordOrderItems: QuizQuestion[] = [];
  for (const conv of readings.conversations) {
    for (const turn of conv.turns) {
      const clean = turn.en.replace(/[.!?]+$/, "").trim();
      const tokens = clean.split(/\s+/);
      if (tokens.length >= 4 && tokens.length <= 9) {
        wordOrderItems.push({
          id: `wo-${wordOrderItems.length}`,
          module_slug: "susun-kalimat-harian",
          question_type: "word_order",
          prompt: `Susun kata berikut menjadi kalimat untuk arti: "${turn.id}"`,
          options: tokens,
          correct_answer: clean,
          explanation_id: `Susunan kalimat yang benar adalah: "${clean}".`,
          difficulty: conv.cefr,
        });
      }
      if (wordOrderItems.length >= 25) break;
    }
    if (wordOrderItems.length >= 25) break;
  }

  packs.push({
    slug: "susun-kalimat-harian",
    title: "Susun Kalimat Percakapan (Word Order)",
    category: "susun_kata",
    description:
      "Latih insting urutan struktur kalimat bahasa Inggris dengan menyusun kepingan kata.",
    difficulty: "A1",
    question_count: wordOrderItems.length,
    questions: wordOrderItems,
  });

  return packs;
}

export function getQuizPackBySlug(slug: string): QuizPack | null {
  const packs = getAllQuizPacks();
  const exact = packs.find((p) => p.slug === slug);
  if (exact) return exact;

  // Juga dukung alias dari roadmap module slug
  if (slug.startsWith("grammar-")) {
    // Cocokkan topik grammar ke paket ujian yang sesuai
    const topicLower = slug.replace(/^grammar-\d+-/, "").replace(/-/g, " ");
    const matched = packs.find(
      (p) =>
        p.category === "ujian" &&
        (p.topicSlugMatch?.includes(topicLower) ||
          p.title.toLowerCase().includes(topicLower) ||
          topicLower.includes(p.title.replace("Latihan ", "").toLowerCase()))
    );
    if (matched) return matched;
  }

  return null;
}

declare module "@/types/linggis" {
  interface QuizPack {
    topicSlugMatch?: string;
  }
}

export function getAllReadingsList(): ReadingPassage[] {
  const raw = getAllReadingsRaw();
  const list: ReadingPassage[] = [];

  for (let i = 0; i < raw.guides.length; i++) {
    const g = raw.guides[i];
    list.push({
      id: i + 1,
      slug: g.slug,
      category: "guides",
      title: g.title,
      subtitle: "Panduan strategi dan cara berpikir belajar bahasa Inggris",
      cefr: g.cefr,
      markdown: g.markdown,
    });
  }

  for (const item of raw.daily_talk) {
    list.push({
      id: item.id,
      slug: item.slug,
      category: "daily_talk",
      title: item.title,
      subtitle: item.apk_level,
      cefr: item.cefr,
      markdown: item.markdown,
    });
  }

  const groups: Array<[ReadingPassage["category"], typeof raw.stories]> = [
    ["stories", raw.stories],
    ["fun_facts", raw.fun_facts],
    ["movie_scenes", raw.movie_scenes],
    ["daily_news", raw.daily_news],
    ["speeches", raw.speeches],
  ];

  for (const [cat, arr] of groups) {
    for (const item of arr) {
      list.push({
        id: item.id,
        slug: item.slug,
        category: cat,
        title: item.title,
        subtitle: item.subtitle,
        cefr: item.cefr,
        markdown: item.markdown,
      });
    }
  }

  return list;
}

export function getWordOfTheDay(isoDate?: string): WordEntry {
  const words = getAllLocalWords().filter(
    (w) => w.pos !== "slang" && w.word.length >= 4 && w.word.length <= 16
  );
  const dateStr = isoDate ?? new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return words[hash % words.length] ?? getPopularStarterWords()[0];
}

export function getDictationSentences(limit = 20): Array<{
  id: string;
  en: string;
  id_text: string;
  cefr: CefrLevel;
  source: string;
}> {
  const raw = getAllReadingsRaw();
  const out: Array<{
    id: string;
    en: string;
    id_text: string;
    cefr: CefrLevel;
    source: string;
  }> = [];

  for (const conv of raw.conversations) {
    for (const turn of conv.turns) {
      const wordsCount = turn.en.trim().split(/\s+/).length;
      if (wordsCount >= 3 && wordsCount <= 12) {
        out.push({
          id: `dict-${conv.id}-${out.length}`,
          en: turn.en.trim(),
          id_text: turn.id.trim(),
          cefr: conv.cefr,
          source: conv.title,
        });
      }
      if (out.length >= limit) return out;
    }
  }
  return out;
}

