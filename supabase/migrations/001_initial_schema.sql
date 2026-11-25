-- Migrasi Awal Database Linggis (Supabase PostgreSQL)
-- Mengaktifkan pg_trgm untuk pencarian kamus cepat & toleransi salah ketik (fuzzy search)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Tabel Kamus Utama
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  pos TEXT NOT NULL, -- noun, verb, adjective, adverb, idiom, phrasal_verb, slang, expression, etc.
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  ipa TEXT,
  reading_hint_id TEXT, -- Cara baca ramah pemula Indonesia dari dataset offline
  audio_url TEXT,
  translations_id JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["berlari", "menjalankan"]
  definitions_en JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ "meaning": "...", "example": "..." }]
  usage_note_id TEXT, -- Catatan penggunaan singkat dalam bahasa Indonesia
  category TEXT, -- Kategori topik (mis. Basic Vocabulary, Daily Vocabulary, Grammar Vocabulary)
  synonyms TEXT[] DEFAULT '{}',
  antonyms TEXT[] DEFAULT '{}',
  enriched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_words_word_trgm ON words USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_words_cefr ON words (cefr_level);
CREATE INDEX IF NOT EXISTS idx_words_pos ON words (pos);

-- 2. Tabel Contoh Kalimat Bilingual (Tatoeba & Kurasi)
CREATE TABLE IF NOT EXISTS example_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID REFERENCES words(id) ON DELETE SET NULL,
  en_text TEXT NOT NULL,
  id_text TEXT NOT NULL,
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  source TEXT DEFAULT 'apk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sentences_word_id ON example_sentences (word_id);

-- 3. Tabel Modul Roadmap Belajar & Grammar
CREATE TABLE IF NOT EXISTS roadmap_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A0', 'A1', 'A2', 'B1', 'B2', 'C1')),
  track TEXT NOT NULL DEFAULT 'grammar', -- fondasi | hafalan | grammar | praktik
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  grammar_markdown TEXT NOT NULL,
  key_vocab_slugs TEXT[] DEFAULT '{}',
  estimated_minutes INT NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_level_order ON roadmap_modules (cefr_level, order_index);

-- 4. Tabel Bank Soal Latihan Interaktif
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES roadmap_modules(id) ON DELETE CASCADE,
  module_slug TEXT, -- Referensi fleksibel ke modul atau topik kuis
  question_type TEXT NOT NULL CHECK (
    question_type IN ('multiple_choice', 'fill_blank', 'listening', 'word_order')
  ),
  prompt TEXT NOT NULL,
  audio_text TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation_id TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_module ON quiz_questions (module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_module_slug ON quiz_questions (module_slug);

-- 5. Kebijakan Keamanan Row Level Security (RLS)
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'words' AND policyname = 'Public read words') THEN
    CREATE POLICY "Public read words" ON words FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'example_sentences' AND policyname = 'Public read sentences') THEN
    CREATE POLICY "Public read sentences" ON example_sentences FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roadmap_modules' AND policyname = 'Public read roadmap') THEN
    CREATE POLICY "Public read roadmap" ON roadmap_modules FOR SELECT TO anon, authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_questions' AND policyname = 'Public read quiz') THEN
    CREATE POLICY "Public read quiz" ON quiz_questions FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- 6. Tabel Progres & Hafalan Pengguna (Login Opsional via Supabase Auth)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  progress_data JSONB NOT NULL DEFAULT '{"version":1,"bookmarks":[],"completedModules":[],"completedReadings":[],"flashcards":{},"quizHistory":[]}'::jsonb,
  bookmarks_count INT NOT NULL DEFAULT 0,
  completed_modules_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can read own progress') THEN
    CREATE POLICY "Users can read own progress"
      ON user_progress FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can insert own progress') THEN
    CREATE POLICY "Users can insert own progress"
      ON user_progress FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can update own progress') THEN
    CREATE POLICY "Users can update own progress"
      ON user_progress FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_progress' AND policyname = 'Users can delete own progress') THEN
    CREATE POLICY "Users can delete own progress"
      ON user_progress FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

