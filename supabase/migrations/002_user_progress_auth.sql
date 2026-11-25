-- Migrasi Tambahan: Tabel Progres & Hafalan Pengguna (Login Opsional via Supabase Auth)
-- Catatan: Tabel ini juga sudah disertakan di bagian akhir 001_initial_schema.sql dengan IF NOT EXISTS.

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
