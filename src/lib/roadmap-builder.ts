import type {
  CefrLevel,
  PhraseItem,
  RoadmapModule,
  RoadmapStage,
} from "@/types/linggis";
import {
  getAllGrammarRaw,
  getAllPhraseGroups,
  getAllReadingsRaw,
  getAllLocalWords,
} from "@/lib/data-store";

let cachedRoadmap: RoadmapModule[] | null = null;

function formatPhraseTableMarkdown(items: PhraseItem[], limit = 30): string {
  const rows = items.slice(0, limit);
  const lines = [
    "| Ungkapan / Kosakata | Cara Baca | Arti Bahasa Indonesia |",
    "| --- | --- | --- |",
  ];
  for (const item of rows) {
    const en = item.en.replace(/\|/g, "/");
    const hint = item.read_hint ? `/${item.read_hint}/` : "-";
    const id = item.id.replace(/\|/g, "/");
    lines.push(`| **${en}** | \`${hint}\` | ${id} |`);
  }
  return lines.join("\n");
}

function findBestQuizForGrammarTitle(title: string): string {
  const t = title.toLowerCase();
  const mapping: Array<[string, string]> = [
    ["pronoun", "ujian-01-pronoun"],
    ["article", "ujian-02-articles"],
    ["demonstrative", "ujian-03-demonstrative"],
    ["this & these", "ujian-03-demonstrative"],
    ["that & those", "ujian-03-demonstrative"],
    ["adjective", "ujian-04-adjective"],
    ["quantifier", "ujian-05-quantifier"],
    ["some & any", "ujian-06-some-vs-any"],
    ["much & many", "ujian-07-much-vs-many"],
    ["a little", "ujian-08-a-little-vs-a-few"],
    ["a few", "ujian-08-a-little-vs-a-few"],
    ["adverb", "ujian-09-adverb"],
    ["verb", "ujian-10-verb"],
    ["preposition", "ujian-11-preposition-of-time"],
    ["conjunction", "ujian-12-conjunction"],
    ["interjection", "ujian-13-interjection"],
    ["to be", "ujian-14-to-be"],
    ["simple present", "ujian-15-simple-present"],
    ["present continuous", "ujian-16-present-continuous"],
    ["present perfect continuous", "ujian-18-present-perfect-continuous"],
    ["present perfect", "ujian-17-present-perfect"],
    ["simple past", "ujian-19-simple-past"],
    ["past continuous", "ujian-20-past-continuous"],
    ["past perfect continuous", "ujian-22-past-perfect-continuous"],
    ["past perfect", "ujian-21-past-perfect"],
    ["simple future", "ujian-23-simple-future"],
    ["future continuous", "ujian-24-future-continuous"],
    ["future perfect continuous", "ujian-26-future-perfect-continuous"],
    ["future perfect", "ujian-25-future-perfect"],
    ["simple past future", "ujian-27-simple-past-future"],
    ["past future continuous", "ujian-28-past-future-continuous"],
    ["past future perfect continuous", "ujian-30-past-future-perfect-continuous"],
    ["past future perfect", "ujian-29-past-future-perfect"],
    ["direct & indirect", "ujian-31-direct-indirect-speech"],
    ["question tag", "ujian-32-question-tag"],
    ["degree of comparison", "ujian-33-degree-of-comparison"],
    ["passive voice", "ujian-34-passive-voice"],
    ["preference", "ujian-35-preferences"],
    ["each & every", "ujian-36-each-every"],
    ["relative pronoun", "ujian-37-relative-pronoun"],
  ];

  for (const [needle, slug] of mapping) {
    if (t.includes(needle)) return slug;
  }
  return "rumpang-level-1";
}

export function getFullRoadmap(): RoadmapModule[] {
  if (cachedRoadmap) return cachedRoadmap;

  const readings = getAllReadingsRaw();
  const phrases = getAllPhraseGroups();
  const grammar = getAllGrammarRaw();
  const allWords = getAllLocalWords();
  const wordSlugsByTopic = (topicPrefix: string, limit = 10) =>
    allWords
      .filter((w) =>
        w.topics.some((t) => t.toLowerCase().includes(topicPrefix.toLowerCase()))
      )
      .slice(0, limit)
      .map((w) => w.slug);

  const modules: RoadmapModule[] = [];
  let order = 1;

  // =========================================================================
  // TAHAP 0 (A0): FONDASI & CARA BELAJAR YANG BENAR (MULAI DARI NOL)
  // =========================================================================
  const kisahAris = readings.guides.find((g) => g.slug === "cara-memulai-belajar-bahasa-inggris");
  const thinkGuide = readings.guides.find((g) => g.slug === "mastering-think-in-english");
  const mistakesGuide = readings.guides.find((g) => g.slug === "4-kesalahan-umum-pemula");

  modules.push({
    slug: "fondasi-peta-belajar-dan-urutan-hafalan",
    cefr_level: "A0",
    track: "fondasi",
    order_index: order++,
    title: "Peta Belajar: Mulai dari Mana dan Hafalan Apa Dulu?",
    subtitle: "Metode belajar terstruktur agar pemula tidak tersesat",
    summary:
      "Pahami urutan belajar bahasa Inggris yang benar: kenapa tidak langsung menghafal 16 tenses, dan urutan hafalan kosakata dari frekuensi tertinggi.",
    learning_goal:
      "Menentukan alur belajar harian 15-20 menit dengan siklus Input -> Hafalan Kontekstual -> Pola Kalimat -> Active Recall.",
    how_to_study:
      "Baca panduan ini sekali hingga tuntas sebelum masuk ke level A1, lalu ikuti urutan modul dari atas ke bawah.",
    markdown: `## Masalah Terbesar Pemula: Salah Urutan

Banyak pembelajar bahasa Inggris di Indonesia langsung mencoba menghafal **16 tenses** atau menghafal daftar kata benda yang jarang dipakai (seperti nama hewan eksotis) sebelum bisa merangkai kalimat harian sederhana. Akibatnya cepat lelah dan tetap bingung saat harus berbicara.

## Metode 4 Jalur Linggis (Berbasis Riset Pemerolehan Bahasa)

Berdasarkan prinsip *Nation's Four Strands* dan *High-Frequency Vocabulary First*, setiap level di Linggis dibagi menjadi **4 jalur berimbang**:

| Jalur | Fokus | Porsi Waktu Ideal |
| --- | --- | --- |
| **1. Fondasi & Cara Pikir** | Melatih bunyi dasar, cara baca IPA, dan menghentikan kebiasaan menerjemahkan kata per kata | 10% |
| **2. Hafalan Terarah (Chunks)** | Menghafal kata frekuensi tertinggi dan potongan kalimat siap pakai (*lexical chunks*) | 30% |
| **3. Grammar Fungsional** | Mempelajari hanya pola tata bahasa yang langsung dipakai di level saat itu (*just-in-time grammar*) | 25% |
| **4. Praktik & Pengulangan** | Kuis aktif (*active recall*), mendengarkan dialog pendek, dan mengulang kata sulit lewat Flashcard SM-2 | 35% |

## Urutan Hafalan yang Benar (Mulai dari Mana Dulu?)

1. **Tahap A1 Awal (Survival Chunks & Kata Inti):** Mulai dari kata ganti (*I, you, we, they*), kata kerja paling sering (*be, have, do, go, want, need, make, eat, drink*), angka, dan 25-50 ungkapan bertahan hidup (*"My name is...", "I don't understand", "How much is this?"*).
2. **Tahap A1 Lanjut (Benda Dekat & Sifat Dasar):** Kata benda rumah, makanan, keluarga, waktu, dan kata sifat dasar (*big, small, good, hot, tired*). Selalu hafalkan bersama contoh kalimat pendek, bukan kata lepas.
3. **Tahap A2 (Aktivitas Harian & Ekspresi Diri):** Kata kerja aktivitas rutin, tempat umum, pekerjaan, serta pola *I Statement* (*"I agree", "I think...", "I feel..."*).
4. **Tahap B1 (Penghubung & Phrasal Verbs):** Kata hubung (*because, although*), preposisi yang sering tertukar, *phrasal verbs* harian (*wake up, give up, look for*), dan perbandingan bahasa buku teks vs kasual.
5. **Tahap B2-C1 (Nuansa, Idiom & Profesional):** Idiom kontekstual, kolokasi, slang (dan batas pemakaiannya), serta struktur kompleks untuk berita dan pidato.

---

${kisahAris ? kisahAris.markdown : ""}`,
    key_vocab_slugs: ["learn", "speak", "understand", "practice", "remember"],
    key_phrases: [
      { en: "I want to learn English", read_hint: "ai wont tu lern ing-glish", id: "Saya ingin belajar bahasa Inggris" },
      { en: "Step by step", read_hint: "step bai step", id: "Langkah demi langkah" },
      { en: "I don't understand", read_hint: "ai dont an-der-stænd", id: "Saya tidak mengerti" },
    ],
    quiz_module_slug: "kosakata-a1",
    estimated_minutes: 10,
  });

  modules.push({
    slug: "fondasi-pelafalan-dan-bunyi-dasar",
    cefr_level: "A0",
    track: "fondasi",
    order_index: order++,
    title: "Cara Baca & Bunyi Dasar Bahasa Inggris (Pra-A1)",
    subtitle: "Mengenal bunyi vokal/konsonan Inggris yang sering keliru oleh penutur Indonesia",
    summary:
      "Pelajari perbedaan bunyi penting seperti th, v vs f, vokal panjang-pendek, dan huruf bisu (silent letters) sebelum mulai menghafal kosakata.",
    learning_goal:
      "Membedakan bunyi /θ/ vs /t/, /v/ vs /f/, /ɪ/ vs /iː/, serta membaca simbol fonetik IPA di kamus Linggis.",
    how_to_study:
      "Klik tombol putar audio pada setiap contoh di bawah, tirukan pelan dengan suara keras, lalu ulangi 3 kali.",
    markdown: `## Mengapa Belajar Bunyi di Awal Itu Wajib?

Dalam bahasa Indonesia, tulisan dan cara baca hampir selalu sama (*a* dibaca *a*). Di bahasa Inggris, satu huruf bisa punya beberapa bunyi, dan ada bunyi yang **tidak ada di bahasa Indonesia**. Jika fondasi bunyi ini dilatih di awal, Anda akan jauh lebih cepat mengenali kata saat *listening*.

## 5 Bunyi Paling Kritis untuk Pemula Indonesia

| Bunyi / Simbol IPA | Penjelasan Cara Mengucap | Contoh Kata | Kesalahan Umum |
| --- | --- | --- | --- |
| **th lembut** \`/θ/\` | Ujung lidah sedikit di antara gigi atas-bawah, tiup napas (tanpa suara) | **think** \`/θɪŋk/\`, **thank** \`/θæŋk/\` | Dibaca seperti *t* ("tink") |
| **th bergetar** \`/ð/\` | Posisi lidah sama dengan atas, tapi pita suara bergetar | **this** \`/ðɪs/\`, **they** \`/ðeɪ/\` | Dibaca seperti *d* ("dis") |
| **v vs f** \`/v/\` vs \`/f/\` | Untuk \`/v/\`, gigi atas menyentuh bibir bawah + getarkan tenggorokan | **very** \`/ˈveri/\` vs **ferry** | Keduanya dibaca *p* atau *f* datar |
| **Vokal pendek vs panjang** \`/ɪ/\` vs \`/iː/\` | \`/ɪ/\` pendek dan rileks, \`/iː/\` lebih panjang dan bibir tertarik | **live** (tinggal) vs **leave** (pergi) | Tertukar arti karena panjang vokal sama |
| **Silent Letters** | Huruf tertulis tapi tidak diucapkan | **know** (k bisu), **listen** (t bisu), **hour** (h bisu) | Semua huruf ikut dieja |

## Cara Membaca Notasi di Kamus Linggis

Setiap entri kata di Linggis menampilkan dua bantuan:
1. **IPA Standar** (misal \`/ˈbjuːtɪfəl/\`) dengan font monospace.
2. **Panduan Baca Pemula** (misal \`byu-ti-fəl\`) dan tombol **Audio** untuk langsung mendengar pengucapan asli.`,
    key_vocab_slugs: ["think", "thank", "know", "listen", "very"],
    key_phrases: [
      { en: "Thank you very much", read_hint: "thængk yu ve-ri mach", id: "Terima kasih banyak" },
      { en: "This is my book", read_hint: "dhis iz mai buk", id: "Ini buku saya" },
      { en: "Listen to me", read_hint: "li-sən tu mi", id: "Dengarkan saya" },
    ],
    quiz_module_slug: "listening-a1",
    estimated_minutes: 12,
  });

  if (thinkGuide) {
    modules.push({
      slug: "fondasi-think-in-english",
      cefr_level: "A0",
      track: "fondasi",
      order_index: order++,
      title: "Metode Think in English (Berhenti Menerjemahkan di Kepala)",
      subtitle: "4 langkah melatih refleks otak langsung dalam bahasa Inggris",
      summary:
        "Latih otak menghubungkan objek dan kegiatan harian langsung ke kata Inggris melalui teknik Labeling, Monolog, Parafrase, dan Jurnal Malam.",
      learning_goal:
        "Mengurangi jeda berpikir karena menerjemahkan kalimat Indonesia -> Inggris di kepala.",
      how_to_study:
        "Praktikkan Langkah 1 (Labeling 5 benda di sekitar Anda) hari ini juga sebelum tidur.",
      markdown: thinkGuide.markdown,
      key_vocab_slugs: ["table", "chair", "door", "window", "sleep"],
      key_phrases: [
        { en: "I need to get up now", read_hint: "ai nid tu get ap nau", id: "Saya harus bangun sekarang" },
        { en: "Where is my phone?", read_hint: "wer iz mai foun", id: "Di mana ponsel saya?" },
      ],
      quiz_module_slug: "respon-percakapan-natural",
      estimated_minutes: 10,
    });
  }

  if (mistakesGuide) {
    modules.push({
      slug: "fondasi-4-kesalahan-umum",
      cefr_level: "A0",
      track: "fondasi",
      order_index: order++,
      title: "Hindari 4 Kesalahan Umum Pembelajar Indonesia",
      subtitle: "Jebakan To Be + Verb, Uncountable Noun, Preposisi, dan Terjemahan Literal",
      summary:
        "Kenali pola kesalahan klasik seperti 'I am agree', 'waiting you', dan 'open the lamp' sejak awal agar tidak menjadi kebiasaan.",
      learning_goal:
        "Menghindari kesalahan tata bahasa dasar yang paling sering muncul akibat pengaruh struktur bahasa Indonesia.",
      how_to_study:
        "Catat contoh kalimat salah vs benar, lalu coba ucapkan versi benarnya tiga kali.",
      markdown: mistakesGuide.markdown,
      key_vocab_slugs: ["agree", "wait", "listen", "furniture", "advice"],
      key_phrases: [
        { en: "I agree with you", read_hint: "ai ə-gri with yu", id: "Saya setuju denganmu" },
        { en: "I'm waiting for you", read_hint: "aim wei-ting for yu", id: "Saya sedang menunggumu" },
        { en: "Turn off the light", read_hint: "tern of dhə lait", id: "Matikan lampunya" },
      ],
      quiz_module_slug: "rumpang-level-1",
      estimated_minutes: 12,
    });
  }

  // =========================================================================
  // TRACK 2: HAFALAN TERARAH (DARI A1 SURVIVAL -> C1 EXPERT)
  // =========================================================================
  const exprBasic = phrases.find((p) => p.kind === "expressions");
  const qnaGuide = readings.guides.find((g) => g.slug === "100-expressions-penting");
  const hafalanA1 = phrases.filter((p) => p.kind === "hafalan" && p.cefr === "A1").slice(0, 3);
  const hafalanA1Items = [
    ...(exprBasic?.items.slice(0, 15) ?? []),
    ...hafalanA1.flatMap((h) => h.items.slice(0, 10)),
  ];

  modules.push({
    slug: "a1-hafalan-survival-ungkapan",
    cefr_level: "A1",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 1: Ungkapan Survival & Salam Sehari-hari",
    subtitle: "Mulai hafalan dari kalimat pendek siap pakai (bukan kata lepas)",
    summary:
      "Kumpulan ungkapan inti untuk menyapa, meminta maaf, berterima kasih, meminta bantuan, dan merespons obrolan awal.",
    learning_goal:
      "Menguasai 30+ ungkapan paling sering muncul di percakapan nyata beserta pelafalannya.",
    how_to_study:
      "Putar audio setiap ungkapan, hafalkan 5-7 ungkapan per hari, lalu simpan ke Flashcard untuk diulang besok.",
    markdown: `## Mengapa Hafalan Dimulai dari Ungkapan Pendek?

Saat pemula menghafal *"how = bagaimana"*, *"are = adalah"*, *"you = kamu"*, otak masih bekerja lambat merangkainya. Dengan menghafal **satu paket utuh** (*chunk*) seperti *"How are you?"*, Anda langsung bisa berbicara dalam 1 detik.

${formatPhraseTableMarkdown(hafalanA1Items, 25)}

${qnaGuide ? "\n\n---\n\n" + qnaGuide.markdown.slice(0, 3200) : ""}`,
    key_vocab_slugs: ["hello", "sorry", "thank", "help", "please", "understand"],
    key_phrases: hafalanA1Items.slice(0, 20),
    quiz_module_slug: "respon-percakapan-natural",
    estimated_minutes: 15,
  });

  modules.push({
    slug: "a1-hafalan-kosakata-sekitar-kita",
    cefr_level: "A1",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 2: Kata Kerja, Benda Rumah, Keluarga & Sifat Inti",
    subtitle: "Kosakata A1 frekuensi tertinggi untuk kehidupan sehari-hari",
    summary:
      "Pelajari kelompok kosakata paling penting untuk pemula: anggota keluarga, benda rumah, makanan, minuman, angka, dan kata sifat dasar.",
    learning_goal:
      "Mengenal 50+ kata inti A1 dan mampu menggunakannya dalam kalimat sederhana dengan 'I have / I like / This is'.",
    how_to_study:
      "Gunakan teknik Labeling (sebutkan kata Inggrisnya saat melihat benda asli di rumah) lalu uji di latihan kosakata A1.",
    markdown: `## Urutan Kategori Hafalan Kosakata A1

Jangan menghafal kamus dari A sampai Z. Mulailah dari kata-kata yang Anda lihat dan gunakan setiap hari:

1. **Keluarga & Orang:** *mother, father, brother, sister, friend, teacher, student*
2. **Rumah & Benda Harian:** *house, room, bed, table, chair, door, key, phone, water, food*
3. **Kata Kerja Inti:** *eat, drink, sleep, go, come, want, need, like, make, take, give, see*
4. **Kata Sifat Utama:** *big, small, good, bad, hot, cold, happy, tired, easy, difficult*

> Klik kosakata kunci di bawah untuk membuka halaman detail kata lengkap dengan contoh kalimat, IPA, dan tombol Simpan ke Flashcard.`,
    key_vocab_slugs: [
      ...wordSlugsByTopic("Family", 5),
      ...wordSlugsByTopic("Perabotan", 5),
      ...wordSlugsByTopic("Makanan", 5),
      ...wordSlugsByTopic("Kata Sifat", 5),
    ].slice(0, 16),
    key_phrases: [
      { en: "I like coffee", read_hint: "ai laik ko-fi", id: "Saya suka kopi" },
      { en: "This room is clean", read_hint: "dhis rum iz klin", id: "Ruangan ini bersih" },
      { en: "I need some water", read_hint: "ai nid sam wo-ter", id: "Saya butuh air" },
    ],
    quiz_module_slug: "kosakata-a1",
    estimated_minutes: 15,
  });

  // A2 Hafalan: I Statements + Daily Vocabulary + Hafalan A2
  const iStmt1 = phrases.find((p) => p.kind === "i_statements");
  const hafalanA2 = phrases.filter((p) => p.kind === "hafalan" && p.cefr === "A2").slice(0, 2);
  const a2PhraseItems = [
    ...(iStmt1?.items.slice(0, 15) ?? []),
    ...hafalanA2.flatMap((h) => h.items.slice(0, 10)),
  ];

  modules.push({
    slug: "a2-hafalan-aktivitas-dan-i-statement",
    cefr_level: "A2",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 3: Aktivitas Harian & Mengungkapkan Diri (I Statement)",
    subtitle: "Kosakata rutinitas, pekerjaan, tempat umum, dan pola kalimat 'I ...'",
    summary:
      "Perluas hafalan ke kata kerja aktivitas harian, profesi, belanja, kesehatan, serta pola kalimat langsung untuk menyatakan pendapat dan perasaan.",
    learning_goal:
      "Mampu menceritakan rutinitas harian dan menanggapi situasi sederhana dengan pola 'I think / I agree / I need / I feel'.",
    how_to_study:
      "Latih setiap pola I Statement dengan mengganti objeknya sesuai kondisi Anda hari ini.",
    markdown: `## Pola Kalimat Diri (I Statements) & Aktivitas Harian

Di level A2, fokus hafalan bergeser ke kata kerja aksi harian dan pola kalimat untuk menyampaikan pendapat, kondisi, dan kebutuhan diri:

${formatPhraseTableMarkdown(a2PhraseItems, 25)}`,
    key_vocab_slugs: [
      ...wordSlugsByTopic("Aktivitas Harian", 6),
      ...wordSlugsByTopic("Pekerjaan", 4),
      ...wordSlugsByTopic("Kesehatan", 4),
    ].slice(0, 14),
    key_phrases: a2PhraseItems.slice(0, 20),
    quiz_module_slug: "kosakata-a2",
    estimated_minutes: 18,
  });

  // B1 Hafalan: Basic vs Advanced Casual + Phrasal Verbs + Patterns
  const basicVsAdv = readings.guides.find((g) => g.slug === "basic-vs-advanced-casual");
  const phrasalDaily = phrases.find((p) => p.kind === "phrasal_verbs");
  const patternSave = phrases.find((p) => p.kind === "patterns");
  const b1Items = [
    ...(phrasalDaily?.items.slice(0, 15) ?? []),
    ...(patternSave?.items.slice(0, 10) ?? []),
  ];

  modules.push({
    slug: "b1-hafalan-phrasal-verb-dan-casual-english",
    cefr_level: "B1",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 4: Phrasal Verb Harian & Gaya Bicara Natural",
    subtitle: "Tinggalkan bahasa buku teks yang kaku dengan phrasal verb dan pola frasa unik",
    summary:
      "Kuasai kata kerja gabungan (wake up, give up, look for, find out) serta padanan ekspresi kasual yang dipakai penutur asli.",
    learning_goal:
      "Memahami makna idiomatis 25+ phrasal verb harian dan membedakan ungkapan buku teks vs natural casual.",
    how_to_study:
      "Hafalkan phrasal verb bersama pasangan preposisinya sekaligus (misal 'look for' = mencari, bukan hanya 'look').",
    markdown: `## Mengapa Phrasal Verb Penting di Level B1?

Penutur asli lebih sering berkata *"Please find out"* daripada *"Please investigate"*, atau *"Don't give up"* daripada *"Don't surrender"*.

${formatPhraseTableMarkdown(b1Items, 25)}

${basicVsAdv ? "\n\n---\n\n" + basicVsAdv.markdown : ""}`,
    key_vocab_slugs: ["wake-up", "give-up", "look-for", "find-out", "carry-on"],
    key_phrases: b1Items.slice(0, 20),
    quiz_module_slug: "kosakata-b1",
    estimated_minutes: 20,
  });

  // B2 Hafalan: Idiom & Slang + Konteks Sosial
  const idiomB2 = phrases.find((p) => p.kind === "idioms");
  const slangB2 = phrases.find((p) => p.kind === "slang");
  const b2Items = [
    ...(idiomB2?.items.slice(0, 15) ?? []),
    ...(slangB2?.items.slice(0, 15) ?? []),
  ];

  modules.push({
    slug: "b2-hafalan-idiom-dan-slang-kontekstual",
    cefr_level: "B2",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 5: Idiom Populer & Slang Sehari-hari",
    subtitle: "Memahami ungkapan figuratif di film, media sosial, dan obrolan santai",
    summary:
      "Pelajari idiom yang maknanya tidak bisa ditebak kata per kata (seperti 'piece of cake', 'break a leg') serta slang modern dan kapan menggunakannya.",
    learning_goal:
      "Mengenali 30 idiom dan slang populer serta membedakan penggunaannya di situasi santai vs profesional.",
    how_to_study:
      "Fokus pada konteks kapan ungkapan boleh dipakai: slang cocok untuk teman/chat, hindari di email bisnis atau presentasi resmi.",
    markdown: `## Memahami Idiom & Slang Tanpa Salah Tempat

Idiom memiliki makna kiasan yang berbeda dari arti harfiah tiap kata. Slang jauh lebih santai dan cepat berubah mengikuti tren komunikasi.

${formatPhraseTableMarkdown(b2Items, 30)}`,
    key_vocab_slugs: ["piece-of-cake", "break-a-leg", "hangout", "ghosting"],
    key_phrases: b2Items.slice(0, 20),
    quiz_module_slug: "kosakata-b2",
    estimated_minutes: 18,
  });

  // C1 Hafalan: Advanced Expressions & Formal Nuance
  const hafalanC1 = phrases.filter((p) => p.kind === "hafalan" && p.cefr === "C1").slice(0, 3);
  const idiomC1 = phrases.filter((p) => p.kind === "idioms" && p.cefr === "C1").slice(0, 2);
  const c1Items = [
    ...hafalanC1.flatMap((h) => h.items.slice(0, 10)),
    ...idiomC1.flatMap((i) => i.items.slice(0, 10)),
  ];

  modules.push({
    slug: "c1-hafalan-ekspresi-profesional-dan-nuansa",
    cefr_level: "C1",
    track: "hafalan",
    order_index: order++,
    title: "Hafalan Tahap 6: Ekspresi Profesional, Bisnis & Nuansa Lanjut",
    subtitle: "Kosakata dan ungkapan tingkat lanjut untuk diskusi kompleks dan pidato",
    summary:
      "Kuasai ungkapan tingkat mahir (Level 11-12 APK) dan idiom lanjutan untuk komunikasi kerja, debat opini, dan tulisan formal.",
    learning_goal:
      "Menyampaikan argumen yang terstruktur dan bernuansa tajam dalam konteks profesional dan akademik.",
    how_to_study:
      "Padukan ungkapan di bawah dengan modul Grammar C1 (Inversion, Clauses) dan bacaan Akademi Pidato.",
    markdown: `## Ekspresi & Idiom Tingkat Mahir (C1)

Di tingkat C1, target bukan lagi sekadar dimengerti, melainkan memilih ungkapan yang tepat secara gaya, register (formal/informal), dan ketajaman makna.

${formatPhraseTableMarkdown(c1Items, 30)}`,
    key_vocab_slugs: wordSlugsByTopic("Politik", 8),
    key_phrases: c1Items.slice(0, 20),
    quiz_module_slug: "ujian-38-vocabulary",
    estimated_minutes: 20,
  });

  // =========================================================================
  // TRACK 3: MODUL GRAMMAR BERTAHAP (70 MODUL DARI APK DIPETAKAN KE A1-C1)
  // =========================================================================
  for (const gm of grammar) {
    // Sesuaikan pemetaan CEFR agar A1, A2, B1, B2, C1 seimbang & progresif secara pedagogis
    let cefr: CefrLevel = gm.cefr_level;
    const tLower = gm.title.toLowerCase();
    if (
      tLower.includes("to be") ||
      tLower.includes("there is") ||
      tLower.includes("simple present") ||
      tLower.includes("pengenalan tenses")
    ) {
      cefr = "A1";
    } else if (
      tLower.includes("present continuous") ||
      tLower.includes("simple past") ||
      tLower.includes("simple future") ||
      tLower.includes("regular verb") ||
      tLower.includes("irregular verb") ||
      tLower.includes("has & have") ||
      tLower.includes("was & were") ||
      tLower.includes("preposition") ||
      tLower.includes("adverb")
    ) {
      cefr = "A2";
    } else if (
      tLower.includes("past continuous") ||
      tLower.includes("present perfect") ||
      tLower.includes("future continuous") ||
      tLower.includes("passive") ||
      tLower.includes("question tag") ||
      tLower.includes("comparison") ||
      tLower.includes("preference") ||
      tLower.includes("because") ||
      tLower.includes("another") ||
      tLower.includes("each & every") ||
      tLower.includes("conjunction")
    ) {
      cefr = "B1";
    } else if (
      tLower.includes("past perfect") ||
      tLower.includes("future perfect") ||
      tLower.includes("past future") ||
      tLower.includes("conditional") ||
      tLower.includes("direct & indirect") ||
      tLower.includes("relative pronoun") ||
      tLower.includes("exclamatory")
    ) {
      cefr = "B2";
    } else if (gm.apk_level.includes("Advanced")) {
      cefr = "C1";
    }

    modules.push({
      slug: gm.slug,
      cefr_level: cefr,
      track: "grammar",
      order_index: order++,
      title: gm.title,
      subtitle: `${gm.apk_level} — Tata Bahasa`,
      summary: `Pelajari konsep, pola kalimat, contoh penggunaan, dan jebakan umum topik ${gm.title}.`,
      learning_goal: `Memahami fungsi dan mampu membentuk kalimat benar menggunakan pola ${gm.title}.`,
      how_to_study:
        "Pahami tabel polanya terlebih dahulu, baca contoh kalimat dengan suara keras, lalu kerjakan kuis modul.",
      markdown: gm.markdown,
      key_vocab_slugs: [],
      key_phrases: [],
      quiz_module_slug: findBestQuizForGrammarTitle(gm.title),
      estimated_minutes: 15,
    });
  }

  // =========================================================================
  // TRACK 4: PRAKTIK NYATA (DIALOG AUDIO, CERITA, BERITA, PIDATO)
  // =========================================================================
  const practicePlans: Array<{
    slug: string;
    cefr: RoadmapStage;
    title: string;
    subtitle: string;
    summary: string;
    goal: string;
    markdown: string;
    quiz: string;
  }> = [
    {
      slug: "a1-praktik-percakapan-dan-daily-talk",
      cefr: "A1",
      title: "Praktik A1: Percakapan Pendek & Daily Talk Dasar",
      subtitle: "Membaca dan mendengarkan dialog perkenalan, makanan, dan aktivitas awal",
      summary:
        "Latih pemahaman mendengar dan membaca melalui 8 skrip percakapan awal serta 9 artikel Daily Talk tingkat pemula.",
      goal: "Memahami dialog perkenalan, menanyakan waktu, harga, dan arah sederhana.",
      markdown: `## Cara Praktik Audio & Bacaan di Tahap A1

1. Buka halaman **Bacaan & Dialog**, pilih kategori **Percakapan Audio** atau **Daily Talk (Beginner)**.
2. Putar audio setiap baris dialog sambil membaca teks Inggrisnya (jangan lihat terjemahan Indonesia dulu).
3. Putar ulang sekali lagi sambil menirukan intonasinya (*shadowing*).

## Cuplikan Dialog Pertama

${readings.conversations[0]?.turns.map((t) => `- **${t.speaker}:** ${t.en} *(${t.id})*`).join("\n") ?? ""}`,
      quiz: "susun-kalimat-harian",
    },
    {
      slug: "a2-praktik-cerita-dan-situasi-nyata",
      cefr: "A2",
      title: "Praktik A2: Cerita Pendek & Respon Situasi Nyata",
      subtitle: "Menikmati bacaan cerita pendek dan simulasi obrolan sehari-hari",
      summary:
        "Terapkan kosakata dan past tense lewat 20 Cerita Pendek (Short Stories) dan skenario respon percakapan harian.",
      goal: "Mampu menangkap alur cerita sederhana tanpa menerjemahkan setiap kata.",
      markdown: `## Membaca Ekstensif untuk Membangun Kelancaran

Di level A2, Anda siap membaca teks naratif singkat (*Cerita Pendek*) yang memakai kosakata sehari-hari dan pola *Simple Past*. Jika menemukan 1-2 kata baru yang tidak mengganggu pemahaman kalimat, tebak dulu maknanya dari konteks sebelum membuka kamus!`,
      quiz: "respon-percakapan-natural",
    },
    {
      slug: "b1-praktik-movie-scene-dan-fun-facts",
      cefr: "B1",
      title: "Praktik B1: Dialog Film (Movie Scene) & Fakta Menarik",
      subtitle: "Belajar bahasa lisan alami dari adegan film dan artikel fakta populer",
      summary:
        "Biasakan diri dengan ekspresi emosional, pengisi percakapan, dan wacana informatif ringan.",
      goal: "Memahami gaya bahasa lisan yang dipakai di adegan film dan obrolan santai.",
      markdown: `## Mengapa Belajar dari Adegan Film & Fakta Unik?

Dialog film kaya akan ekspresi emosi (meminta maaf, berargumen sopan, memberi saran), sementara *Fun Facts* melatih kemampuan membaca artikel deskriptif dengan topik yang seru.`,
      quiz: "rumpang-level-10",
    },
    {
      slug: "b2-praktik-berita-harian",
      cefr: "B2",
      title: "Praktik B2: Membaca Berita Harian (Daily News)",
      subtitle: "Meningkatkan pemahaman kosakata isu sosial, ekonomi, dan teknologi",
      summary:
        "Latih membaca 21 artikel berita bahasa Inggris berstruktur dengan padanan terjemahan dan kosakata kunci.",
      goal: "Mampu memahami gagasan utama berita dan kalimat pasif/kompleks secara mandiri.",
      markdown: `## Strategi Membaca Berita Bahasa Inggris

1. Baca **judul** dan **kalimat pertama tiap paragraf** untuk menangkap ide pokok (*skimming*).
2. Tandai kata kerja utama dan subjek kalimat panjang sebelum membedah anak kalimatnya.
3. Simpan 3-5 kata baru yang penting dari tiap berita ke Flashcard.`,
      quiz: "rumpang-level-15",
    },
    {
      slug: "c1-praktik-akademi-pidato",
      cefr: "C1",
      title: "Praktik C1: Akademi Pidato & Retorika Profesional",
      subtitle: "Analisis dan latihan membaca 28 naskah pidato tingkat lanjut",
      summary:
        "Pelajari bagaimana ide besar dirangkai menggunakan transisi argumen, struktur paralel, dan diksi tingkat lanjut.",
      goal: "Mampu menyampaikan pidato atau presentasi terstruktur dengan intonasi dan jeda yang meyakinkan.",
      markdown: `## Latihan Berbicara Terstruktur lewat Naskah Pidato

Pilih satu topik dari **Akademi Pidato** di menu Bacaan, dengarkan pelafalannya lewat fitur Audio, lalu praktikkan membaca satu paragraf penuh dengan fitur **Latihan Pelafalan** untuk melatih kejelasan artikulasi.`,
      quiz: "rumpang-level-20",
    },
  ];

  for (const pp of practicePlans) {
    modules.push({
      slug: pp.slug,
      cefr_level: pp.cefr,
      track: "praktik",
      order_index: order++,
      title: pp.title,
      subtitle: pp.subtitle,
      summary: pp.summary,
      learning_goal: pp.goal,
      how_to_study:
        "Lanjutkan ke menu Bacaan sesuai rekomendasi tahap ini, lalu tandai modul selesai setelah berlatih minimal 1 topik.",
      markdown: pp.markdown,
      key_vocab_slugs: [],
      key_phrases: [],
      quiz_module_slug: pp.quiz,
      estimated_minutes: 20,
    });
  }

  cachedRoadmap = modules;
  return modules;
}

export function getRoadmapModuleBySlug(slug: string): RoadmapModule | null {
  return getFullRoadmap().find((m) => m.slug === slug) ?? null;
}

