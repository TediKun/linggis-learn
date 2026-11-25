"use client";

import { useMemo, useState } from "react";
import { Search, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { AudioPlayButton } from "@/components/AudioPlayButton";
import { BookmarkButton } from "@/components/BookmarkButton";

export interface IrregularVerbRow {
  v1: string;
  v2: string;
  v3: string;
  meaning_id: string;
  group: "tetap" | "ought" | "iau" | "en" | "umum";
}

const IRREGULAR_VERBS: IrregularVerbRow[] = [
  // 1. Bentuk Tetap (V1 = V2 = V3)
  { v1: "cut", v2: "cut", v3: "cut", meaning_id: "memotong", group: "tetap" },
  { v1: "put", v2: "put", v3: "put", meaning_id: "meletakkan", group: "tetap" },
  { v1: "read", v2: "read", v3: "read", meaning_id: "membaca (V2/V3 dibaca 'red')", group: "tetap" },
  { v1: "hit", v2: "hit", v3: "hit", meaning_id: "memukul / menabrak", group: "tetap" },
  { v1: "hurt", v2: "hurt", v3: "hurt", meaning_id: "melukai / menyakiti", group: "tetap" },
  { v1: "let", v2: "let", v3: "let", meaning_id: "membiarkan", group: "tetap" },
  { v1: "set", v2: "set", v3: "set", meaning_id: "mengatur", group: "tetap" },
  { v1: "shut", v2: "shut", v3: "shut", meaning_id: "menutup", group: "tetap" },
  { v1: "cost", v2: "cost", v3: "cost", meaning_id: "berharga / memakan biaya", group: "tetap" },

  // 2. Pola -ought / -aught
  { v1: "buy", v2: "bought", v3: "bought", meaning_id: "membeli", group: "ought" },
  { v1: "bring", v2: "brought", v3: "brought", meaning_id: "membawa", group: "ought" },
  { v1: "think", v2: "thought", v3: "thought", meaning_id: "berpikir", group: "ought" },
  { v1: "fight", v2: "fought", v3: "fought", meaning_id: "bertarung / berjuang", group: "ought" },
  { v1: "catch", v2: "caught", v3: "caught", meaning_id: "menangkap", group: "ought" },
  { v1: "teach", v2: "taught", v3: "taught", meaning_id: "mengajar", group: "ought" },

  // 3. Pola Vokal i - a - u
  { v1: "sing", v2: "sang", v3: "sung", meaning_id: "bernyanyi", group: "iau" },
  { v1: "drink", v2: "drank", v3: "drunk", meaning_id: "minum", group: "iau" },
  { v1: "begin", v2: "began", v3: "begun", meaning_id: "memulai", group: "iau" },
  { v1: "swim", v2: "swam", v3: "swum", meaning_id: "berenang", group: "iau" },
  { v1: "ring", v2: "rang", v3: "rung", meaning_id: "berdering / menelepon", group: "iau" },
  { v1: "run", v2: "ran", v3: "run", meaning_id: "berlari", group: "iau" },

  // 4. Akhiran -en / -ne pada V3
  { v1: "go", v2: "went", v3: "gone", meaning_id: "pergi", group: "en" },
  { v1: "do", v2: "did", v3: "done", meaning_id: "melakukan / mengerjakan", group: "en" },
  { v1: "see", v2: "saw", v3: "seen", meaning_id: "melihat", group: "en" },
  { v1: "eat", v2: "ate", v3: "eaten", meaning_id: "makan", group: "en" },
  { v1: "give", v2: "gave", v3: "given", meaning_id: "memberi", group: "en" },
  { v1: "take", v2: "took", v3: "taken", meaning_id: "mengambil", group: "en" },
  { v1: "write", v2: "wrote", v3: "written", meaning_id: "menulis", group: "en" },
  { v1: "speak", v2: "spoke", v3: "spoken", meaning_id: "berbicara", group: "en" },
  { v1: "break", v2: "broke", v3: "broken", meaning_id: "memecahkan / merusak", group: "en" },
  { v1: "choose", v2: "chose", v3: "chosen", meaning_id: "memilih", group: "en" },
  { v1: "drive", v2: "drove", v3: "driven", meaning_id: "mengemudi", group: "en" },
  { v1: "forget", v2: "forgot", v3: "forgotten", meaning_id: "lupa", group: "en" },
  { v1: "know", v2: "knew", v3: "known", meaning_id: "mengetahui", group: "en" },

  // 5. Pola V2 = V3 Umum Lainnya
  { v1: "make", v2: "made", v3: "made", meaning_id: "membuat", group: "umum" },
  { v1: "have", v2: "had", v3: "had", meaning_id: "memiliki", group: "umum" },
  { v1: "say", v2: "said", v3: "said", meaning_id: "mengatakan", group: "umum" },
  { v1: "pay", v2: "paid", v3: "paid", meaning_id: "membayar", group: "umum" },
  { v1: "build", v2: "built", v3: "built", meaning_id: "membangun", group: "umum" },
  { v1: "send", v2: "sent", v3: "sent", meaning_id: "mengirim", group: "umum" },
  { v1: "spend", v2: "spent", v3: "spent", meaning_id: "menghabiskan (waktu/uang)", group: "umum" },
  { v1: "feel", v2: "felt", v3: "felt", meaning_id: "merasakan", group: "umum" },
  { v1: "keep", v2: "kept", v3: "kept", meaning_id: "menyimpan / menjaga", group: "umum" },
  { v1: "sleep", v2: "slept", v3: "slept", meaning_id: "tidur", group: "umum" },
  { v1: "meet", v2: "met", v3: "met", meaning_id: "bertemu", group: "umum" },
  { v1: "leave", v2: "left", v3: "left", meaning_id: "meninggalkan / berangkat", group: "umum" },
  { v1: "find", v2: "found", v3: "found", meaning_id: "menemukan", group: "umum" },
  { v1: "tell", v2: "told", v3: "told", meaning_id: "menceritakan / memberitahu", group: "umum" },
  { v1: "sell", v2: "sold", v3: "sold", meaning_id: "menjual", group: "umum" },
  { v1: "win", v2: "won", v3: "won", meaning_id: "menang", group: "umum" },
  { v1: "lose", v2: "lost", v3: "lost", meaning_id: "kehilangan / kalah", group: "umum" },
  { v1: "understand", v2: "understood", v3: "understood", meaning_id: "mengerti / memahami", group: "umum" },
];

const GROUP_TABS: Array<{ key: "semua" | IrregularVerbRow["group"]; label: string; desc: string }> = [
  { key: "semua", label: "Semua Pola", desc: "Seluruh 52 kata kerja tak beraturan paling sering dipakai." },
  { key: "tetap", label: "1. Tetap (V1=V2=V3)", desc: "Paling mudah: bentuk ke-1, ke-2, dan ke-3 tulisannya tetap sama." },
  { key: "ought", label: "2. Pola -ought / -aught", desc: "Bentuk V2 dan V3 sama-sama berakhiran bunyi -ót (-ought / -aught)." },
  { key: "iau", label: "3. Vokal i – a – u", desc: "Perubahan vokal berirama: i pada V1, a pada V2, dan u pada V3." },
  { key: "en", label: "4. Akhiran -en / -ne", desc: "Bentuk V3 ditutup dengan akhiran -en atau -ne (dipakai setelah have/has/had atau kalimat pasif)." },
  { key: "umum", label: "5. V2 = V3 Umum", desc: "Cukup hafal satu perubahan karena V2 dan V3-nya kembar." },
];

export function IrregularVerbsClient() {
  const [viewMode, setViewMode] = useState<"table" | "quiz">("table");
  const [selectedGroup, setSelectedGroup] = useState<"semua" | IrregularVerbRow["group"]>("semua");
  const [search, setSearch] = useState("");

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [v2Input, setV2Input] = useState("");
  const [v3Input, setV3Input] = useState("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return IRREGULAR_VERBS.filter((row) => {
      if (selectedGroup !== "semua" && row.group !== selectedGroup) return false;
      if (q) {
        return (
          row.v1.includes(q) ||
          row.v2.includes(q) ||
          row.v3.includes(q) ||
          row.meaning_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedGroup, search]);

  const activeGroupMeta =
    GROUP_TABS.find((g) => g.key === selectedGroup) ?? GROUP_TABS[0];

  const quizVerb = IRREGULAR_VERBS[quizIdx % IRREGULAR_VERBS.length];
  const isV2Right = v2Input.trim().toLowerCase() === quizVerb.v2;
  const isV3Right = v3Input.trim().toLowerCase() === quizVerb.v3;

  const handleCheckQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizChecked) return;
    setQuizChecked(true);
    if (isV2Right && isV3Right) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setV2Input("");
    setV3Input("");
    setQuizChecked(false);
    setQuizIdx((prev) => (prev + 1) % IRREGULAR_VERBS.length);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-[4px] cursor-pointer ${
              viewMode === "table"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            Tabel Pola Bunyi (52 Kata Kerja)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("quiz")}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-[4px] cursor-pointer ${
              viewMode === "quiz"
                ? "bg-[var(--accent-primary)] text-white"
                : "text-[var(--ink-secondary)]"
            }`}
          >
            Kuis Tebak V2 &amp; V3
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="space-y-5">
          {/* Filter Kelompok Pola Bunyi */}
          <div className="flex flex-wrap gap-1.5">
            {GROUP_TABS.map((g) => {
              const active = selectedGroup === g.key;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setSelectedGroup(g.key)}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-[6px] border transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white font-medium"
                      : "border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-[var(--ink-primary)]">
              <strong>Pola hafalan:</strong> {activeGroupMeta.desc}
            </p>
            <div className="relative sm:w-64 shrink-0">
              <Search
                className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2"
                strokeWidth={1.75}
              />
              <input
                id="irregular-search-input"
                name="irregularSearch"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari V1, V2, V3, atau arti..."
                className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs sm:text-sm text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <section className="rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-hairline)] text-xs uppercase tracking-wider text-[var(--ink-secondary)]">
                    <th className="py-3 px-4 font-semibold">V1 (Present)</th>
                    <th className="py-3 px-4 font-semibold">V2 (Past)</th>
                    <th className="py-3 px-4 font-semibold">V3 (Participle)</th>
                    <th className="py-3 px-4 font-semibold">Arti Indonesia</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {filtered.map((row) => (
                    <tr key={row.v1} className="hover:bg-[var(--bg-paper)]">
                      <td className="py-3 px-4 font-display font-semibold text-base text-[var(--ink-primary)]">
                        {row.v1}
                      </td>
                      <td className="py-3 px-4 font-mono-ipa text-[var(--accent-primary)] font-medium">
                        {row.v2}
                      </td>
                      <td className="py-3 px-4 font-mono-ipa text-[var(--accent-warm)] font-medium">
                        {row.v3}
                      </td>
                      <td className="py-3 px-4 text-[var(--ink-secondary)]">
                        {row.meaning_id}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <AudioPlayButton
                            text={`${row.v1}, ${row.v2}, ${row.v3}`}
                            label="V1-V2-V3"
                            compact
                          />
                          <BookmarkButton slug={row.v1} compact />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        /* Kuis Tebak V2 & V3 */
        <section className="p-6 sm:p-8 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
          <div className="flex items-center justify-between text-xs font-mono-ipa text-[var(--ink-muted)]">
            <span>
              Kata #{quizIdx + 1} dari {IRREGULAR_VERBS.length}
            </span>
            <span>Skor benar sempurna: {quizScore}</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider font-mono-ipa text-[var(--accent-primary)]">
              Tuliskan Bentuk V2 (Past) dan V3 (Past Participle)
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-display text-3xl font-semibold text-[var(--ink-primary)]">
                {quizVerb.v1}
              </h2>
              <span className="text-base text-[var(--ink-secondary)]">
                — {quizVerb.meaning_id}
              </span>
            </div>
          </div>

          <form onSubmit={handleCheckQuiz} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="quiz-v2-input"
                  className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]"
                >
                  Bentuk V2 (Simple Past)
                </label>
                <input
                  id="quiz-v2-input"
                  name="v2"
                  type="text"
                  required
                  disabled={quizChecked}
                  value={v2Input}
                  onChange={(e) => setV2Input(e.target.value)}
                  placeholder="Ketik V2..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-base font-mono-ipa text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="quiz-v3-input"
                  className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]"
                >
                  Bentuk V3 (Past Participle)
                </label>
                <input
                  id="quiz-v3-input"
                  name="v3"
                  type="text"
                  required
                  disabled={quizChecked}
                  value={v3Input}
                  onChange={(e) => setV3Input(e.target.value)}
                  placeholder="Ketik V3..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-base font-mono-ipa text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {!quizChecked && (
              <button
                type="submit"
                className="min-h-[42px] px-5 py-2 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium cursor-pointer"
              >
                Periksa Jawaban
              </button>
            )}
          </form>

          {quizChecked && (
            <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {isV2Right ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--state-correct)]" strokeWidth={1.75} />
                  ) : (
                    <XCircle className="w-4 h-4 text-[var(--state-wrong)]" strokeWidth={1.75} />
                  )}
                  <span>
                    V2: <strong className="font-mono-ipa">{quizVerb.v2}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isV3Right ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--state-correct)]" strokeWidth={1.75} />
                  ) : (
                    <XCircle className="w-4 h-4 text-[var(--state-wrong)]" strokeWidth={1.75} />
                  )}
                  <span>
                    V3: <strong className="font-mono-ipa">{quizVerb.v3}</strong>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-hairline)]">
                <AudioPlayButton
                  text={`${quizVerb.v1}, ${quizVerb.v2}, ${quizVerb.v3}`}
                  label="Dengarkan V1-V2-V3"
                  compact
                />
                <button
                  type="button"
                  onClick={handleNextQuiz}
                  className="min-h-[38px] px-4 py-1.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Kata Kerja Berikutnya
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

