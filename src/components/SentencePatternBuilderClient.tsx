"use client";

import { useState } from "react";
import type { PhraseItem } from "@/types/linggis";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";

interface PatternTemplate {
  id: string;
  formula: string;
  cefr: string;
  explanation_id: string;
  prefix: string;
  suffix?: string;
  slots: Array<{
    en: string;
    full_en: string;
    full_id: string;
  }>;
}

const TEMPLATES: PatternTemplate[] = [
  {
    id: "used-to-ving",
    formula: "I'm used to + V-ing / Noun",
    cefr: "B1",
    explanation_id:
      "Menyatakan sudah terbiasa melakukan sesuatu (berbeda dengan 'I used to + V1' yang berarti dulu pernah).",
    prefix: "I'm used to",
    slots: [
      {
        en: "waking up early",
        full_en: "I'm used to waking up early.",
        full_id: "Saya sudah terbiasa bangun pagi.",
      },
      {
        en: "working under pressure",
        full_en: "I'm used to working under pressure.",
        full_id: "Saya sudah terbiasa bekerja di bawah tekanan.",
      },
      {
        en: "spicy food",
        full_en: "I'm used to spicy food.",
        full_id: "Saya sudah terbiasa dengan makanan pedas.",
      },
      {
        en: "speaking English every day",
        full_en: "I'm used to speaking English every day.",
        full_id: "Saya sudah terbiasa berbicara bahasa Inggris setiap hari.",
      },
    ],
  },
  {
    id: "would-you-mind",
    formula: "Would you mind + V-ing ...?",
    cefr: "A2",
    explanation_id:
      "Cara paling sopan untuk meminta tolong kepada orang lain dalam situasi formal maupun sehari-hari.",
    prefix: "Would you mind",
    slots: [
      {
        en: "opening the window?",
        full_en: "Would you mind opening the window?",
        full_id: "Apakah Anda tidak keberatan membuka jendelanya?",
      },
      {
        en: "waiting for a moment?",
        full_en: "Would you mind waiting for a moment?",
        full_id: "Apakah Anda tidak keberatan menunggu sebentar?",
      },
      {
        en: "speaking a bit slower?",
        full_en: "Would you mind speaking a bit slower?",
        full_id: "Bolehkah bicara sedikit lebih pelan?",
      },
      {
        en: "helping me with this bag?",
        full_en: "Would you mind helping me with this bag?",
        full_id: "Bisa tolong bantu saya membawa tas ini?",
      },
    ],
  },
  {
    id: "looking-forward",
    formula: "I'm looking forward to + V-ing / Noun",
    cefr: "B1",
    explanation_id:
      "Menyatakan sangat menantikan sesuatu. Perhatikan setelah 'to' wajib diikuti V-ing atau kata benda.",
    prefix: "I'm looking forward to",
    slots: [
      {
        en: "hearing from you",
        full_en: "I'm looking forward to hearing from you.",
        full_id: "Saya menantikan kabar dari Anda.",
      },
      {
        en: "meeting your team",
        full_en: "I'm looking forward to meeting your team.",
        full_id: "Saya sangat menantikan bertemu dengan tim Anda.",
      },
      {
        en: "our holiday next week",
        full_en: "I'm looking forward to our holiday next week.",
        full_id: "Saya menantikan liburan kita minggu depan.",
      },
    ],
  },
  {
    id: "it-takes-time",
    formula: "It takes [waktu] to + V1",
    cefr: "A2",
    explanation_id:
      "Pola paling alami untuk menyatakan butuh waktu berapa lama untuk melakukan sesuatu.",
    prefix: "It takes",
    slots: [
      {
        en: "20 minutes to get there",
        full_en: "It takes 20 minutes to get there.",
        full_id: "Butuh waktu 20 menit untuk sampai ke sana.",
      },
      {
        en: "time to learn a language",
        full_en: "It takes time to learn a language.",
        full_id: "Butuh waktu untuk mempelajari sebuah bahasa.",
      },
      {
        en: "two hours to finish this report",
        full_en: "It takes two hours to finish this report.",
        full_id: "Butuh dua jam untuk menyelesaikan laporan ini.",
      },
    ],
  },
  {
    id: "about-to",
    formula: "I was just about to + V1",
    cefr: "B1",
    explanation_id:
      "Menyatakan baru saja hendak melakukan sesuatu ketika kejadian lain muncul.",
    prefix: "I was just about to",
    slots: [
      {
        en: "call you",
        full_en: "I was just about to call you.",
        full_id: "Saya baru saja mau meneleponmu.",
      },
      {
        en: "leave the office",
        full_en: "I was just about to leave the office.",
        full_id: "Saya baru saja hendak berangkat dari kantor.",
      },
      {
        en: "have lunch",
        full_en: "I was just about to have lunch.",
        full_id: "Saya baru saja mau makan siang.",
      },
    ],
  },
  {
    id: "its-worth",
    formula: "It's worth + V-ing",
    cefr: "B1",
    explanation_id:
      "Menyatakan sesuatu sangat layak atau sepadan untuk dicoba/dilakukan.",
    prefix: "It's worth",
    slots: [
      {
        en: "trying at least once",
        full_en: "It's worth trying at least once.",
        full_id: "Ini layak dicoba setidaknya sekali.",
      },
      {
        en: "waiting for",
        full_en: "It's worth waiting for.",
        full_id: "Ini sangat layak untuk ditunggu.",
      },
      {
        en: "reading every page",
        full_en: "It's worth reading every page.",
        full_id: "Sangat layak dibaca setiap halamannya.",
      },
    ],
  },
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SentencePatternBuilderClientProps {
  apkPatterns: PhraseItem[];
}

export function SentencePatternBuilderClient({
  apkPatterns,
}: SentencePatternBuilderClientProps) {
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);

  const currentTemplate = TEMPLATES[selectedTemplateIdx] ?? TEMPLATES[0];
  const currentSlot =
    currentTemplate.slots[selectedSlotIdx] ?? currentTemplate.slots[0];

  return (
    <div className="space-y-8">
      {/* Pilihan Pola Kalimat */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--ink-secondary)] font-semibold">
          1. Pilih Rumus Pola Kalimat Inti
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TEMPLATES.map((tpl, idx) => {
            const active = idx === selectedTemplateIdx;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setSelectedTemplateIdx(idx);
                  setSelectedSlotIdx(0);
                }}
                className={`p-3.5 rounded-[8px] border text-left transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)]/55"
                    : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono-ipa">
                  <span className="font-semibold text-[var(--accent-primary)]">
                    {tpl.formula}
                  </span>
                  <span className="text-[var(--ink-muted)]">{tpl.cefr}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Studio Merangkai Kalimat */}
      <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-6">
        <div className="space-y-1.5">
          <div className="text-xs font-mono-ipa text-[var(--accent-primary)] font-semibold">
            CEFR {currentTemplate.cefr} · {currentTemplate.formula}
          </div>
          <p className="text-sm text-[var(--ink-secondary)]">
            {currentTemplate.explanation_id}
          </p>
        </div>

        {/* Pilihan Slot Pengganti */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            2. Klik Variasi Lanjutan Kalimat:
          </div>
          <div className="flex flex-wrap gap-2">
            {currentTemplate.slots.map((slot, sIdx) => {
              const active = sIdx === selectedSlotIdx;
              return (
                <button
                  key={slot.en}
                  type="button"
                  onClick={() => setSelectedSlotIdx(sIdx)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-[6px] border text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white"
                      : "border-[var(--border-hairline)] bg-[var(--bg-paper)] text-[var(--ink-primary)] hover:border-[var(--accent-primary)]"
                  }`}
                >
                  + {slot.en}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hasil Rangkaian Kalimat */}
        <div className="p-5 rounded-[8px] border border-[var(--accent-primary)]/40 bg-[var(--bg-paper)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-display text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)]">
              {currentSlot.full_en}
            </div>
            <div className="text-base text-[var(--ink-secondary)]">
              {currentSlot.full_id}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AudioPlayButton
              text={currentSlot.full_en}
              label="Dengarkan"
              showAccentToggle
            />
            <BookmarkButton slug={toSlug(currentSlot.full_en)} compact />
          </div>
        </div>
      </section>

      {/* Kumpulan Pola Tambahan dari Dataset */}
      {apkPatterns.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Contoh Kalimat Berpola Lainnya
          </h2>
          <div className="divide-y divide-[var(--border-hairline)] rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {apkPatterns.slice(0, 20).map((it, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-display text-lg font-semibold text-[var(--ink-primary)]">
                    {it.en}
                  </div>
                  {it.read_hint && (
                    <div className="text-xs font-mono-ipa text-[var(--ink-muted)]">
                      baca: {it.read_hint}
                    </div>
                  )}
                  <div className="text-sm text-[var(--ink-secondary)]">
                    {it.id}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <AudioPlayButton text={it.en} label="Dengar" compact />
                  <BookmarkButton slug={toSlug(it.en)} compact />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

