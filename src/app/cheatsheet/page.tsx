import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Cheatsheet Pola Kalimat & 12 Tenses Inti",
  description:
    "Ringkasan cepat penggunaan am/is/are, do/does/did, preposisi waktu in/on/at, dan 12 tenses bahasa Inggris beserta contoh kalimat.",
};

const TENSES_ROWS = [
  {
    name: "Simple Present",
    formula: "S + V1 (s/es)",
    use: "Kebiasaan rutin & fakta umum",
    example: "She works every day.",
    meaning: "Dia bekerja setiap hari.",
  },
  {
    name: "Present Continuous",
    formula: "S + am/is/are + V-ing",
    use: "Sedang berlangsung sekarang",
    example: "I am studying English.",
    meaning: "Saya sedang belajar bahasa Inggris.",
  },
  {
    name: "Present Perfect",
    formula: "S + have/has + V3",
    use: "Sudah terjadi / masih terasa hasilnya",
    example: "We have finished the task.",
    meaning: "Kami sudah menyelesaikan tugasnya.",
  },
  {
    name: "Present Perfect Continuous",
    formula: "S + have/has + been + V-ing",
    use: "Sudah berlangsung sejak dulu hingga kini",
    example: "He has been waiting for an hour.",
    meaning: "Dia sudah menunggu selama satu jam.",
  },
  {
    name: "Simple Past",
    formula: "S + V2",
    use: "Kejadian selesai di masa lalu",
    example: "They visited Bali last year.",
    meaning: "Mereka mengunjungi Bali tahun lalu.",
  },
  {
    name: "Past Continuous",
    formula: "S + was/were + V-ing",
    use: "Sedang terjadi di waktu tertentu masa lalu",
    example: "I was sleeping when you called.",
    meaning: "Saya sedang tidur saat kamu menelepon.",
  },
  {
    name: "Past Perfect",
    formula: "S + had + V3",
    use: "Sudah selesai sebelum kejadian lalu lainnya",
    example: "The train had left before we arrived.",
    meaning: "Kereta sudah berangkat sebelum kami tiba.",
  },
  {
    name: "Simple Future",
    formula: "S + will + V1 / going to + V1",
    use: "Rencana atau keputusan masa depan",
    example: "I will call you tomorrow.",
    meaning: "Saya akan meneleponmu besok.",
  },
  {
    name: "Future Continuous",
    formula: "S + will + be + V-ing",
    use: "Akan sedang berlangsung di masa depan",
    example: "At 8 PM, I will be studying.",
    meaning: "Pukul 8 malam nanti, saya akan sedang belajar.",
  },
  {
    name: "Future Perfect",
    formula: "S + will + have + V3",
    use: "Akan sudah selesai pada titik waktu depan",
    example: "She will have graduated by June.",
    meaning: "Dia akan sudah lulus menjelang Juni.",
  },
];

export default function CheatsheetPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="flex items-center justify-between gap-4 text-sm">
        <Link
          href="/roadmap"
          className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Kembali ke Roadmap
        </Link>
        <Link
          href="/latihan"
          className="inline-flex items-center gap-1 text-[var(--accent-primary)] font-medium hover:underline"
        >
          Uji di Latihan Soal
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </Link>
      </div>

      <header className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
        <p className="text-xs font-mono-ipa uppercase tracking-wider text-[var(--accent-primary)] font-medium">
          Referensi Cepat Tata Bahasa
        </p>
        <h1 className="font-display text-3xl sm:text-[38px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
          Cheatsheet Pola Kalimat &amp; Tenses Inti
        </h1>
        <p className="text-sm sm:text-base text-[var(--ink-secondary)]">
          Rangkuman satu halaman untuk mengecek cepat rumus kata bantu (<em>to be</em>, <em>do/does</em>, <em>have/has</em>), preposisi waktu, dan tenses paling sering dipakai.
        </p>
        <div className="pt-2">
          <Link
            href="/cheatsheet/irregular-verbs"
            className="min-h-[38px] px-3.5 py-1.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5"
          >
            Buka Tabel &amp; Kuis Irregular Verbs (V1–V2–V3)
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </header>

      {/* Kata Bantu Inti */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            To Be (am / is / are)
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Dipakai untuk kata sifat, kata benda, lokasi, atau <em>V-ing</em>. Tidak dipakai sebelum <em>V1</em> biasa.
          </p>
          <ul className="text-xs sm:text-sm space-y-1 text-[var(--ink-primary)] font-mono-ipa pt-1">
            <li>I → am / was</li>
            <li>He, She, It → is / was</li>
            <li>You, We, They → are / were</li>
          </ul>
        </div>

        <div className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Do / Does / Did
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Kata bantu untuk kalimat tanya &amp; negatif pada <em>Simple Present</em> dan <em>Simple Past</em> (kata kerja kembali ke <em>V1</em>).
          </p>
          <ul className="text-xs sm:text-sm space-y-1 text-[var(--ink-primary)] font-mono-ipa pt-1">
            <li>I, You, We, They → do</li>
            <li>He, She, It → does</li>
            <li>Masa lalu (semua) → did</li>
          </ul>
        </div>

        <div className="p-5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-2">
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            Preposisi (In / On / At)
          </h2>
          <p className="text-xs text-[var(--ink-secondary)]">
            Urutan dari cakupan paling luas ke paling spesifik (untuk waktu &amp; tempat).
          </p>
          <ul className="text-xs sm:text-sm space-y-1 text-[var(--ink-primary)] font-mono-ipa pt-1">
            <li>In → bulan, tahun, kota</li>
            <li>On → hari, tanggal, jalan</li>
            <li>At → jam spesifik, alamat</li>
          </ul>
        </div>
      </section>

      {/* Tabel Tenses Inti */}
      <section className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border-hairline)]">
          <h2 className="font-display text-2xl font-semibold text-[var(--ink-primary)]">
            Tabel Ringkas Tenses Paling Terpakai
          </h2>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--ink-secondary)]">
                <th className="py-3 px-4 font-semibold">Tense</th>
                <th className="py-3 px-4 font-semibold">Rumus</th>
                <th className="py-3 px-4 font-semibold">Fungsi Utama</th>
                <th className="py-3 px-4 font-semibold">Contoh Kalimat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {TENSES_ROWS.map((row) => (
                <tr key={row.name} className="hover:bg-[var(--bg-paper)]">
                  <td className="py-3 px-4 font-semibold text-[var(--ink-primary)] whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 font-mono-ipa text-xs text-[var(--accent-primary)] whitespace-nowrap">
                    {row.formula}
                  </td>
                  <td className="py-3 px-4 text-[var(--ink-secondary)]">
                    {row.use}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-[var(--ink-primary)]">
                      {row.example}
                    </div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {row.meaning}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

