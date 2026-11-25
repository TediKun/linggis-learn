"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Compass } from "lucide-react";

interface PlacementQuestion {
  id: string;
  level: "A1" | "A2" | "B1" | "B2";
  prompt: string;
  options: string[];
  correct: string;
}

const QUESTIONS: PlacementQuestion[] = [
  {
    id: "p1",
    level: "A1",
    prompt: "She ___ a student at a university in Jakarta.",
    options: ["am", "is", "are", "be"],
    correct: "is",
  },
  {
    id: "p2",
    level: "A1",
    prompt: "Apa arti ungkapan 'I don't understand'?",
    options: [
      "Saya tidak mengerti",
      "Saya tidak tahu jalan",
      "Saya sudah selesai",
      "Saya tidak setuju",
    ],
    correct: "Saya tidak mengerti",
  },
  {
    id: "p3",
    level: "A1",
    prompt: "___ you like coffee or tea?",
    options: ["Does", "Are", "Do", "Is"],
    correct: "Do",
  },
  {
    id: "p4",
    level: "A2",
    prompt: "We ___ to Bandung last weekend by train.",
    options: ["go", "goes", "went", "gone"],
    correct: "went",
  },
  {
    id: "p5",
    level: "A2",
    prompt: "The meeting will start ___ 9:00 AM.",
    options: ["in", "on", "at", "by"],
    correct: "at",
  },
  {
    id: "p6",
    level: "A2",
    prompt: "I'm sorry, I'm ___ for my friend right now.",
    options: ["wait", "waiting", "waited", "waits"],
    correct: "waiting",
  },
  {
    id: "p7",
    level: "B1",
    prompt: "She has lived in Surabaya ___ five years.",
    options: ["since", "for", "during", "from"],
    correct: "for",
  },
  {
    id: "p8",
    level: "B1",
    prompt: "Our car ___ on the way to the airport, so we called a taxi.",
    options: ["broke down", "gave up", "looked after", "turned on"],
    correct: "broke down",
  },
  {
    id: "p9",
    level: "B1",
    prompt: "If it rains tomorrow, we ___ the picnic indoors.",
    options: ["had", "will have", "would have", "having"],
    correct: "will have",
  },
  {
    id: "p10",
    level: "B2",
    prompt: "The report ___ by the marketing team yesterday afternoon.",
    options: ["was finished", "finished", "has finishing", "is finish"],
    correct: "was finished",
  },
  {
    id: "p11",
    level: "B2",
    prompt: "Had I known about the traffic, I ___ earlier.",
    options: ["will leave", "would have left", "left", "am leaving"],
    correct: "would have left",
  },
  {
    id: "p12",
    level: "B2",
    prompt: "Despite ___ tired, she continued preparing for the presentation.",
    options: ["feel", "feeling", "felt", "to feel"],
    correct: "feeling",
  },
];

function getRecommendation(score: number): {
  level: string;
  summary: string;
  targetSlug: string;
  targetLabel: string;
} {
  if (score <= 3) {
    return {
      level: "Tahap A0 (Fondasi dari Nol)",
      summary:
        "Sangat disarankan memulai dari Tahap 0 agar memahami cara pikir bahasa Inggris, bunyi dasar, dan urutan hafalan sebelum masuk ke grammar A1.",
      targetSlug: "/roadmap/fondasi-peta-belajar-dan-urutan-hafalan",
      targetLabel: "Mulai dari Tahap A0 (Fondasi)",
    };
  }
  if (score <= 6) {
    return {
      level: "Level A1 (Pemula Dasar)",
      summary:
        "Anda sudah mengenal dasar sederhana. Fokus berikutnya adalah memperkuat ungkapan survival, to be, dan Simple Present.",
      targetSlug: "/roadmap/a1-hafalan-survival-ungkapan",
      targetLabel: "Lanjut ke Modul A1",
    };
  }
  if (score <= 9) {
    return {
      level: "Level A2 (Pemula Lanjutan)",
      summary:
        "Dasar Anda cukup baik! Anda siap memperluas kalimat masa lalu (Simple Past), ekspresi diri, dan percakapan sehari-hari.",
      targetSlug: "/roadmap/a2-hafalan-aktivitas-dan-i-statement",
      targetLabel: "Lanjut ke Modul A2",
    };
  }
  return {
    level: "Level B1–B2 (Menengah)",
    summary:
      "Pemahaman kosakata dan struktur Anda sudah kuat. Fokuskan latihan pada phrasal verbs, kalimat kompleks, berita harian, dan pidato.",
    targetSlug: "/roadmap/b1-hafalan-phrasal-verb-dan-casual-english",
    targetLabel: "Lanjut ke Modul B1",
  };
}

export function PlacementTestClient() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = QUESTIONS[idx];
  const progressPct = Math.round(((done ? QUESTIONS.length : idx) / QUESTIONS.length) * 100);

  const handleAnswer = (opt: string) => {
    if (opt === current.correct) {
      setScore((prev) => prev + 1);
    }
    if (idx + 1 < QUESTIONS.length) {
      setIdx((prev) => prev + 1);
    } else {
      setDone(true);
    }
  };

  if (done) {
    const rec = getRecommendation(score);
    return (
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
            Hasil Tes Penempatan Level
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--ink-primary)]">
            Rekomendasi: {rec.level}
          </h1>
          <p className="text-sm font-mono-ipa text-[var(--ink-secondary)]">
            Skor Anda: {score} dari {QUESTIONS.length} soal
          </p>
          <p className="text-base text-[var(--ink-secondary)] pt-1">
            {rec.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Link
            href={rec.targetSlug}
            className="min-h-[42px] px-4 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium inline-flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" strokeWidth={1.75} />
            {rec.targetLabel}
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={() => {
              setIdx(0);
              setScore(0);
              setDone(false);
            }}
            className="min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm font-medium text-[var(--ink-primary)] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
            Ulangi Tes
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--ink-muted)]">
          <span>
            Soal {idx + 1} dari {QUESTIONS.length}
          </span>
          <span>Tingkat soal: {current.level}</span>
        </div>
        <div className="w-full h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">
          {current.prompt}
        </h1>
        <div className="space-y-2.5">
          {current.options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleAnswer(opt)}
              className="w-full min-h-[52px] px-4 py-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-paper)] text-left flex items-center gap-3 transition-colors cursor-pointer"
            >
              <span className="w-7 h-7 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] font-mono-ipa text-xs font-medium flex items-center justify-center shrink-0 text-[var(--ink-secondary)]">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm sm:text-base font-medium text-[var(--ink-primary)]">
                {opt}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

