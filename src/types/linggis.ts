import { z } from "zod";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";
export type RoadmapStage = "A0" | CefrLevel;
export type RoadmapTrack = "fondasi" | "hafalan" | "grammar" | "praktik";

export interface DefinitionEn {
  meaning: string;
  example?: string;
}

export interface WordEntry {
  id?: string;
  slug: string;
  word: string;
  pos: string;
  cefr_level: CefrLevel;
  ipa: string | null;
  reading_hint_id: string | null;
  audio_url: string | null;
  translations_id: string[];
  definitions_en: DefinitionEn[];
  usage_note_id: string | null;
  category: string | null;
  topics: string[];
  synonyms: string[];
  antonyms: string[];
  enriched_at?: string | null;
}

export interface ExampleSentence {
  id: string;
  word_slug: string;
  en_text: string;
  id_text: string;
  cefr_level: CefrLevel;
  source: string;
}

export interface WordSearchHit {
  slug: string;
  word: string;
  pos: string;
  cefr_level: CefrLevel;
  short_meaning_id: string;
  ipa: string | null;
  reading_hint_id: string | null;
  kind: "word" | "phrase" | "idiom" | "phrasal_verb" | "slang";
}

export interface VocabCategory {
  id: number;
  group: string;
  cefr: CefrLevel;
  title_id: string;
  title_en: string;
}

export interface PhraseItem {
  en: string;
  read_hint: string;
  id: string;
}

export interface PhraseGroup {
  slug: string;
  title: string;
  subtitle?: string;
  group?: string;
  level_label?: string;
  cefr: CefrLevel;
  kind:
    | "hafalan"
    | "expressions"
    | "phrasal_verbs"
    | "idioms"
    | "slang"
    | "patterns"
    | "i_statements";
  items: PhraseItem[];
}

export interface RoadmapModule {
  slug: string;
  cefr_level: RoadmapStage;
  track: RoadmapTrack;
  order_index: number;
  title: string;
  subtitle: string;
  summary: string;
  learning_goal: string;
  how_to_study: string;
  markdown: string;
  key_vocab_slugs: string[];
  key_phrases: PhraseItem[];
  quiz_module_slug?: string;
  estimated_minutes: number;
}

export type QuizQuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "listening"
  | "word_order";

export interface QuizQuestion {
  id: string;
  module_slug: string;
  question_type: QuizQuestionType;
  prompt: string;
  audio_text?: string | null;
  options: string[];
  correct_answer: string;
  explanation_id: string;
  difficulty: CefrLevel;
}

export interface QuizPack {
  slug: string;
  title: string;
  category: "roadmap" | "ujian" | "kosa_kata" | "kalimat_rumpang" | "percakapan" | "listening" | "susun_kata";
  description: string;
  difficulty: CefrLevel;
  question_count: number;
  questions: QuizQuestion[];
}

export interface ReadingGuide {
  slug: string;
  title: string;
  cefr: CefrLevel;
  markdown: string;
}

export interface ConversationTurn {
  speaker: string;
  en: string;
  id: string;
}

export interface ConversationPassage {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  cefr: CefrLevel;
  turns: ConversationTurn[];
}

export interface ReadingPassage {
  id: number;
  slug: string;
  category:
    | "guides"
    | "daily_talk"
    | "stories"
    | "fun_facts"
    | "movie_scenes"
    | "daily_news"
    | "speeches";
  title: string;
  subtitle?: string;
  cefr: CefrLevel;
  markdown: string;
}

export interface RelatableScenario {
  id: number;
  slug: string;
  title: string;
  situation: string;
  question: string;
  hint: string;
  prompt_en: string;
  prompt_id: string;
  correct_en: string;
  correct_id: string;
  distractors: string[];
  correct_reason: string;
  wrong_reasons: string[];
  tip: string;
  cefr: CefrLevel;
}

export interface FlashcardState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
}

export interface QuizHistoryEntry {
  moduleSlug: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface LinggisProgress {
  version: 1;
  bookmarks: string[]; // array of word/phrase slugs
  completedModules: string[]; // array of roadmap module slugs
  completedReadings: string[]; // array of reading slugs
  flashcards: Record<string, FlashcardState>;
  quizHistory: QuizHistoryEntry[];
}

export const FlashcardStateSchema = z.object({
  intervalDays: z.number().min(0),
  easeFactor: z.number().min(1.3).max(4),
  repetitions: z.number().int().min(0),
  nextReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const QuizHistoryEntrySchema = z.object({
  moduleSlug: z.string().min(1),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  completedAt: z.string().min(1),
});

export const LinggisProgressSchema = z.object({
  version: z.literal(1),
  bookmarks: z.array(z.string()),
  completedModules: z.array(z.string()),
  completedReadings: z.array(z.string()).optional().default([]),
  flashcards: z.record(z.string(), FlashcardStateSchema),
  quizHistory: z.array(QuizHistoryEntrySchema),
});

