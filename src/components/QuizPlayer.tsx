"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Volume2,
} from "lucide-react";
import type { QuizPack, QuizQuestion } from "@/types/linggis";
import { recordQuizResult } from "@/lib/progress";
import { AudioPlayButton } from "@/components/AudioPlayButton";

interface QuizPlayerProps {
  pack: QuizPack;
}

interface AnswerRecord {
  question: QuizQuestion;
  chosen: string;
  isCorrect: boolean;
}

function deterministicShuffle(tokens: string[], seedStr: string): string[] {
  const indexed = tokens.map((word, idx) => ({ word, idx }));
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = indexed.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = indexed[i];
    indexed[i] = indexed[j];
    indexed[j] = tmp;
  }
  return indexed.map((item) => item.word);
}

export function QuizPlayer({ pack }: QuizPlayerProps) {
  const hasLargePool = pack.questions.length > 20;
  const [useAllQuestions, setUseAllQuestions] = useState(false);

  const activeQuestions = useMemo(() => {
    if (!hasLargePool || useAllQuestions) return pack.questions;
    return pack.questions.slice(0, 20);
  }, [pack.questions, hasLargePool, useAllQuestions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wordOrderIndices, setWordOrderIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const recordedOnceRef = useRef(false);

  const currentQuestion = activeQuestions[currentIdx];

  const shuffledWordBank = useMemo(() => {
    if (!currentQuestion || currentQuestion.question_type !== "word_order") {
      return [];
    }
    return deterministicShuffle(currentQuestion.options, currentQuestion.id);
  }, [currentQuestion]);

  const progressPercent =
    activeQuestions.length > 0
      ? Math.round(
          ((finished ? activeQuestions.length : currentIdx + (submitted ? 1 : 0)) /
            activeQuestions.length) *
            100
        )
      : 0;

  const resetSession = (nextUseAll?: boolean) => {
    if (typeof nextUseAll === "boolean") {
      setUseAllQuestions(nextUseAll);
    }
    setCurrentIdx(0);
    setSelectedOption(null);
    setWordOrderIndices([]);
    setSubmitted(false);
    setRecords([]);
    setFinished(false);
    recordedOnceRef.current = false;
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-secondary)]">
        Paket latihan ini belum memiliki soal.
      </div>
    );
  }

  const handleSelectOption = (option: string) => {
    if (submitted) return;
    setSelectedOption(option);
    setSubmitted(true);
    const isCorrect =
      option.trim().toLowerCase() ===
      currentQuestion.correct_answer.trim().toLowerCase();
    setRecords((prev) => [
      ...prev,
      { question: currentQuestion, chosen: option, isCorrect },
    ]);
  };

  const handleSubmitWordOrder = () => {
    if (submitted || wordOrderIndices.length === 0) return;
    const builtSentence = wordOrderIndices
      .map((i) => shuffledWordBank[i])
      .join(" ")
      .trim();
    const isCorrect =
      builtSentence.toLowerCase() ===
      currentQuestion.correct_answer.trim().toLowerCase();
    setSelectedOption(builtSentence);
    setSubmitted(true);
    setRecords((prev) => [
      ...prev,
      { question: currentQuestion, chosen: builtSentence, isCorrect },
    ]);
  };

  const handleNext = () => {
    if (currentIdx + 1 < activeQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setWordOrderIndices([]);
      setSubmitted(false);
      return;
    }

    setFinished(true);
    if (!recordedOnceRef.current) {
      recordedOnceRef.current = true;
      const correctCount = records.filter((r) => r.isCorrect).length;
      recordQuizResult({
        moduleSlug: pack.slug,
        score: correctCount,
        total: activeQuestions.length,
        completedAt: new Date().toISOString(),
      });
    }
  };

  if (finished) {
    const score = records.filter((r) => r.isCorrect).length;
    const total = activeQuestions.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const wrongRecords = records.filter((r) => !r.isCorrect);

    return (
      <div className="space-y-6">
        <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
              Ringkasan Hasil Latihan
            </p>
            <h1 className="font-display text-3xl font-semibold text-[var(--ink-primary)]">
              Skor Anda: {score} / {total} ({pct}%)
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
              {pct >= 80
                ? "Hasil sangat baik! Pemahaman Anda pada materi ini sudah kuat."
                : pct >= 60
                  ? "Cukup baik. Tinjau kembali soal yang masih keliru di bawah ini agar makin mantap."
                  : "Terus berlatih pelan-pelan. Tinjau penjelasan tiap soal di bawah lalu ulangi sekali lagi."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => resetSession()}
              className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
              Ulangi Latihan
            </button>
            <Link
              href="/latihan"
              className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              Pilih Paket Lain
            </Link>
          </div>
        </section>

        {wrongRecords.length > 0 && (
          <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
              Evaluasi Jawaban yang Perlu Diperbaiki ({wrongRecords.length})
            </h2>
            <div className="divide-y divide-[var(--border-hairline)]">
              {wrongRecords.map((rec, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-1.5 text-sm">
                  <p className="font-medium text-[var(--ink-primary)]">
                    {rec.question.prompt}
                  </p>
                  <p className="text-[var(--state-wrong)]">
                    Jawaban Anda: {rec.chosen}
                  </p>
                  <p className="text-[var(--state-correct)] font-medium">
                    Jawaban Benar: {rec.question.correct_answer}
                  </p>
                  <p className="text-[var(--ink-secondary)]">
                    {rec.question.explanation_id}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const lastRecord = records[currentIdx];

  return (
    <div className="space-y-6">
      {/* Header Paket + Mode Sesi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-mono-ipa text-[var(--ink-muted)]">
            CEFR {pack.difficulty}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)]">
            {pack.title}
          </h1>
        </div>

        {hasLargePool && currentIdx === 0 && !submitted && (
          <div className="inline-flex rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5 self-start">
            <button
              type="button"
              onClick={() => resetSession(false)}
              className={`px-2.5 py-1 text-xs rounded-[4px] cursor-pointer ${
                !useAllQuestions
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              Sesi 20 Soal
            </button>
            <button
              type="button"
              onClick={() => resetSession(true)}
              className={`px-2.5 py-1 text-xs rounded-[4px] cursor-pointer ${
                useAllQuestions
                  ? "bg-[var(--accent-primary)] text-white"
                  : "text-[var(--ink-secondary)]"
              }`}
            >
              Semua ({pack.questions.length})
            </button>
          </div>
        )}
      </div>

      {/* 4px Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--ink-muted)]">
          <span>
            Soal {currentIdx + 1} dari {activeQuestions.length}
          </span>
          <span>
            Benar sementara: {records.filter((r) => r.isCorrect).length}
          </span>
        </div>
        <div className="w-full h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Kartu Soal Tunggal Bebas Distraksi */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--ink-muted)]">
            {currentQuestion.question_type === "listening"
              ? "Tebak Audio (Listening)"
              : currentQuestion.question_type === "word_order"
                ? "Susun Kalimat (Word Order)"
                : currentQuestion.question_type === "fill_blank"
                  ? "Kalimat Rumpang"
                  : "Pilihan Ganda"}
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] leading-snug">
            {currentQuestion.prompt}
          </h2>

          {currentQuestion.question_type === "listening" &&
            currentQuestion.audio_text && (
              <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] flex flex-wrap items-center gap-3">
                <Volume2 className="w-5 h-5 text-[var(--accent-primary)]" strokeWidth={1.75} />
                <AudioPlayButton
                  text={currentQuestion.audio_text}
                  label="Putar Audio Soal"
                  showAccentToggle
                />
              </div>
            )}
        </div>

        {/* Pilihan Ganda / Rumpang / Listening */}
        {currentQuestion.question_type !== "word_order" ? (
          <div className="space-y-2.5">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOption === opt;
              const isRightAnswer =
                opt.trim().toLowerCase() ===
                currentQuestion.correct_answer.trim().toLowerCase();

              let styleClass =
                "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-paper)] text-[var(--ink-primary)]";

              if (submitted) {
                if (isRightAnswer) {
                  styleClass =
                    "border-[var(--state-correct)] bg-[var(--accent-primary-tint)] text-[var(--ink-primary)]";
                } else if (isSelected && !isRightAnswer) {
                  styleClass =
                    "border-[var(--state-wrong)] bg-red-50 text-[var(--state-wrong)]";
                } else {
                  styleClass =
                    "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-muted)] opacity-70";
                }
              }

              return (
                <button
                  key={`${idx}-${opt}`}
                  type="button"
                  disabled={submitted}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full min-h-[52px] px-4 py-3 rounded-[8px] border text-left flex items-center justify-between gap-3 transition-colors ${
                    submitted ? "cursor-default" : "cursor-pointer"
                  } ${styleClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] font-mono-ipa text-xs font-medium flex items-center justify-center shrink-0 text-[var(--ink-secondary)]">
                      {letter}
                    </span>
                    <span className="text-sm sm:text-base font-medium break-words">
                      {opt}
                    </span>
                  </div>

                  {submitted && isRightAnswer && (
                    <CheckCircle2
                      className="w-5 h-5 text-[var(--state-correct)] shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                  {submitted && isSelected && !isRightAnswer && (
                    <XCircle
                      className="w-5 h-5 text-[var(--state-wrong)] shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Word Order Interface */
          <div className="space-y-4">
            <div className="min-h-[64px] p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] flex flex-wrap gap-2 items-center">
              {wordOrderIndices.length === 0 ? (
                <span className="text-sm text-[var(--ink-muted)]">
                  Klik kata-kata di bawah secara berurutan untuk menyusun kalimat...
                </span>
              ) : (
                wordOrderIndices.map((bankIdx, pos) => (
                  <button
                    key={`${pos}-${bankIdx}`}
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      setWordOrderIndices((prev) =>
                        prev.filter((_, i) => i !== pos)
                      )
                    }
                    className="px-3 py-1.5 rounded-[6px] border border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] text-sm font-medium cursor-pointer"
                  >
                    {shuffledWordBank[bankIdx]}
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {shuffledWordBank.map((token, idx) => {
                const used = wordOrderIndices.includes(idx);
                return (
                  <button
                    key={`${idx}-${token}`}
                    type="button"
                    disabled={submitted || used}
                    onClick={() =>
                      setWordOrderIndices((prev) => [...prev, idx])
                    }
                    className={`min-h-[42px] px-3.5 py-2 rounded-[6px] border text-sm font-medium transition-colors ${
                      used
                        ? "border-dashed border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-transparent select-none"
                        : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] text-[var(--ink-primary)] cursor-pointer"
                    }`}
                  >
                    {token}
                  </button>
                );
              })}
            </div>

            {!submitted && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={wordOrderIndices.length === 0}
                  onClick={handleSubmitWordOrder}
                  className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-40 text-white text-sm font-medium cursor-pointer"
                >
                  Periksa Susunan
                </button>
                <button
                  type="button"
                  disabled={wordOrderIndices.length === 0}
                  onClick={() => setWordOrderIndices([])}
                  className="min-h-[42px] px-3.5 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-sm text-[var(--ink-secondary)] disabled:opacity-40 cursor-pointer"
                >
                  Ulangi Susunan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Umpan Balik Instan Bahasa Indonesia */}
        {submitted && lastRecord && (
          <div
            className={`p-4 rounded-[8px] border space-y-3 ${
              lastRecord.isCorrect
                ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)]/45"
                : "border-[var(--state-wrong)] bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div
                  className={`text-sm font-semibold ${
                    lastRecord.isCorrect
                      ? "text-[var(--state-correct)]"
                      : "text-[var(--state-wrong)]"
                  }`}
                >
                  {lastRecord.isCorrect
                    ? "Tepat sekali!"
                    : `Kurang tepat — Jawaban yang benar: "${currentQuestion.correct_answer}"`}
                </div>
                <p className="text-sm text-[var(--ink-primary)]">
                  {currentQuestion.explanation_id}
                </p>
              </div>

              {currentQuestion.audio_text && (
                <AudioPlayButton
                  text={currentQuestion.audio_text}
                  label="Putar"
                  compact
                />
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                {currentIdx + 1 < activeQuestions.length
                  ? "Soal Berikutnya"
                  : "Lihat Hasil Akhir"}
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

