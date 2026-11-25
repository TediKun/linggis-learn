# Linggis

**Linggis** adalah website belajar bahasa Inggris untuk penutur Indonesia. Fokusnya sederhana: cari kata dengan cepat, belajar bertahap dari nol (A0) sampai mahir (C1), dan mengulang hafalan dengan metode pengulangan berjarak (SM-2).

Semua fitur bisa dipakai **tanpa login**. Progres disimpan di browser (`localStorage`). Login bersifat opsional dan hanya dipakai untuk menyimpan progres secara permanen ke cloud (Supabase), sehingga bisa dibuka di perangkat lain.

---

## Daftar Isi

1. [Fitur](#fitur)
2. [Teknologi](#teknologi)
3. [Struktur Folder](#struktur-folder)
4. [Prasyarat](#prasyarat)
5. [Menjalankan di Lokal](#menjalankan-di-lokal)
6. [Variabel Lingkungan](#variabel-lingkungan)
7. [Setup Database Supabase](#setup-database-supabase)
8. [Perintah npm](#perintah-npm)
9. [Deploy ke Vercel](#deploy-ke-vercel)
10. [Penyimpanan Progres](#penyimpanan-progres)
11. [Pemecahan Masalah](#pemecahan-masalah)
12. [Keamanan](#keamanan)

---

## Fitur

| Halaman | Rute | Keterangan |
|---|---|---|
| Kamus | `/`, `/kamus/[slug]` | Pencarian cepat (tekan `/`), saran ejaan, pelafalan audio, latihan pengucapan, simpan ke flashcard, Kata Hari Ini, Rencana Belajar 15 Menit |
| Roadmap | `/roadmap`, `/roadmap/[slug]` | 85 modul A0–C1 dalam 4 jalur: Fondasi, Hafalan, Grammar, Praktik |
| Bacaan | `/bacaan`, `/bacaan/[slug]` | 400+ dialog, cerita, daily talk, movie scene, berita. Mode shadowing dan klik kata untuk lihat arti |
| Latihan | `/latihan`, `/latihan/[moduleSlug]` | Kuis pilihan ganda, kalimat rumpang, listening, susun kata |
| Tes Level | `/latihan/tes-level` | 12 soal untuk menentukan level awal dan rekomendasi modul |
| Dikte | `/latihan/dikte` | Dengar kalimat (normal/lambat) lalu ketik, dinilai per kata |
| Pola Kalimat | `/latihan/pola-kalimat` | Merangkai pola kalimat secara interaktif |
| Cheatsheet | `/cheatsheet`, `/cheatsheet/irregular-verbs` | Ringkasan tenses & grammar, 52 irregular verbs per pola bunyi + kuis |
| Flashcard | `/flashcard` | Kartu hafalan dengan jadwal ulang SM-2 (Lupa / Ingat / Mudah) |
| Profil | `/profil` | Ringkasan progres, kosakata tersimpan, silabus roadmap, riwayat latihan |

Menu akun (avatar di kanan atas) berisi: Profil, Backup & Pulihkan (.json), dan Masuk/Keluar.

---

## Teknologi

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (mode `strict`)
- **Tailwind CSS 4**
- **Supabase** — PostgreSQL + Auth (email & password)
- **Zod** — validasi data progres
- **lucide-react** — ikon
- Font lokal via `@fontsource-variable` (Newsreader, Plus Jakarta Sans, JetBrains Mono), tidak butuh koneksi ke Google Fonts saat build

---

## Struktur Folder

```
linggis-web/
├── data/apk/              # Data konten (kata, frasa, grammar, kuis, bacaan) dalam JSON
├── scripts/
│   ├── extract-apk.py     # Ekstraksi data mentah (tidak diperlukan untuk menjalankan web)
│   └── seed/              # Skrip pengisian database Supabase
├── supabase/migrations/   # File SQL skema database
├── src/
│   ├── app/               # Halaman & API route (App Router)
│   │   └── api/           # /api/words/*, /api/flashcards
│   ├── components/        # Komponen UI
│   ├── lib/               # Logika data, progres, audio, klien Supabase
│   └── types/             # Tipe TypeScript & skema Zod
├── .env.example           # Contoh variabel lingkungan
└── package.json
```

> Folder `data/apk/` **wajib ikut di-commit**. Kamus, kuis, dan bacaan dibaca dari file ini saat aplikasi berjalan, jadi website tetap berfungsi walau Supabase belum diatur.

---

## Prasyarat

- **Node.js 18.18 atau lebih baru** (disarankan Node 20 LTS)
- **npm** (sudah termasuk dalam Node.js)
- Akun **Supabase** (gratis) — opsional, hanya jika ingin fitur login & sinkron cloud

---

## Menjalankan di Lokal

```bash
# 1. Clone repo
git clone https://github.com/<username>/linggis.git
cd linggis

# 2. Install dependensi
npm install

# 3. Buat file env
cp .env.example .env.local
# lalu isi nilainya (lihat bagian Variabel Lingkungan)

# 4. Jalankan server pengembangan
npm run dev
```

Buka http://localhost:3000.

Untuk mencoba versi produksi di lokal:

```bash
npm run build
npm run start
```

---

## Variabel Lingkungan

Isi di file `.env.local` (lokal) atau di pengaturan Environment Variables (Vercel).

| Nama | Wajib | Dipakai di | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya* | Browser & server | URL proyek Supabase, contoh `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya* | Browser & server | Kunci publik (anon / publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya* | **Server saja** | Kunci rahasia (service role / `sb_secret_...`). Dipakai API route dan skrip seed |
| `NEXT_PUBLIC_SITE_URL` | Disarankan | Server | Alamat website untuk sitemap & SEO. Lokal: `http://localhost:3000` |
| `MYMEMORY_EMAIL` | Tidak | Server | Email untuk menaikkan kuota harian terjemahan cadangan MyMemory |

\* Tanpa Supabase, website tetap berjalan memakai data lokal, tetapi fitur login dan sinkron cloud tidak aktif.

**Di mana mendapatkan kunci Supabase?**
Dashboard Supabase → pilih proyek → **Project Settings** → **API**.

> **Penting:** `SUPABASE_SERVICE_ROLE_KEY` jangan pernah diberi awalan `NEXT_PUBLIC_`, karena variabel berawalan itu akan ikut terkirim ke browser.

---

## Setup Database Supabase

### 1. Buat tabel

Buka **SQL Editor** di Dashboard Supabase, lalu jalankan file berikut **secara berurutan**:

1. [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) — tabel `words`, `roadmap_modules`, `quiz_questions`, `example_sentences`
2. [`supabase/migrations/002_user_progress_auth.sql`](supabase/migrations/002_user_progress_auth.sql) — tabel `user_progress` beserta aturan keamanan (RLS) agar setiap pengguna hanya bisa membaca/mengubah progresnya sendiri

### 2. Isi data awal

Pastikan `.env.local` sudah berisi `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, lalu:

```bash
npm run seed:apk
```

Hasil yang diharapkan kurang lebih:

| Tabel | Jumlah baris |
|---|---|
| `words` | ± 4.207 |
| `roadmap_modules` | 85 |
| `quiz_questions` | ± 1.359 |
| `example_sentences` | ± 162 |

Skrip ini aman dijalankan ulang (memakai upsert).

### 3. Atur Authentication

Di Dashboard Supabase → **Authentication**:

- **Providers → Email**: pastikan aktif. Matikan **Confirm email** jika tidak ingin pengguna harus verifikasi email (menghindari batas kirim email gratis Supabase).
- **URL Configuration**:
  - **Site URL**: `http://localhost:3000` saat pengembangan, ganti ke domain produksi setelah deploy.
  - **Redirect URLs**: tambahkan `http://localhost:3000/**` dan `https://<domain-anda>/**`.

---

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Menjalankan server pengembangan di port 3000 |
| `npm run build` | Build versi produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run lint` | Pemeriksaan lint |
| `npm run seed:apk` | Mengisi tabel Supabase dari `data/apk/` |

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git remote add origin https://github.com/<username>/linggis.git
git push -u origin main
```

### 2. Import proyek

1. Masuk ke https://vercel.com → **Add New…** → **Project**.
2. Pilih repo `linggis` → **Import**.
3. Framework akan otomatis terdeteksi sebagai **Next.js**. Build command dan output directory biarkan default.

### 3. Isi Environment Variables

Pada langkah import (atau nanti di **Settings → Environment Variables**), isi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://<nama-proyek>.vercel.app
MYMEMORY_EMAIL=...        # opsional
```

Tips: Anda bisa menempelkan seluruh isi `.env.local` sekaligus, lalu ubah `NEXT_PUBLIC_SITE_URL` ke domain Vercel.

### 4. Deploy

Klik **Deploy**. Setiap `git push` ke branch `main` akan otomatis memicu deploy ulang.

### 5. Setelah deploy

- Perbarui **Site URL** dan **Redirect URLs** di Supabase (lihat [Atur Authentication](#3-atur-authentication)) dengan domain Vercel Anda.
- Jika mengubah Environment Variables di Vercel, lakukan **Redeploy** agar nilainya terpakai.

---

## Penyimpanan Progres

- **Tanpa login:** progres disimpan di `localStorage` browser dengan kunci `linggis_progress_v1`. Data hilang jika cache browser dibersihkan, jadi gunakan menu **Backup & Pulihkan** untuk mengunduh cadangan `.json`.
- **Dengan login:** progres lokal digabung dengan data di tabel `user_progress` Supabase, lalu disinkronkan otomatis setiap ada perubahan. Saat keluar, data lokal tetap ada.

Data yang disimpan:

| Kolom | Isi |
|---|---|
| `bookmarks` | Kata/frasa yang disimpan |
| `completedModules` | Modul roadmap yang selesai |
| `completedReadings` | Bacaan yang selesai |
| `flashcards` | Status hafalan SM-2 per kata (interval, ease factor, tanggal ulang berikutnya) |
| `quizHistory` | Riwayat skor latihan (maks. 100 terakhir) |

---

## Pemecahan Masalah

| Masalah | Penyebab & solusi |
|---|---|
| Suara pelafalan tidak keluar | Browser belum punya suara bahasa Inggris atau autoplay diblokir. Klik tombol putar sekali lagi; aplikasi otomatis beralih ke audio kamus online sebagai cadangan. Di Linux, pastikan `speech-dispatcher` terpasang. |
| `seed:apk` gagal dengan error RLS | `SUPABASE_SERVICE_ROLE_KEY` terisi kunci publik. Ganti dengan kunci **service role / secret** (`sb_secret_...`). |
| Login gagal / tidak ada email konfirmasi | Matikan **Confirm email** di Supabase, atau cek kuota email. Pastikan Site URL & Redirect URLs sudah benar. |
| Progres tidak tersinkron | Pastikan migrasi `002_user_progress_auth.sql` sudah dijalankan dan Anda sedang login. |
| Perubahan env di Vercel tidak berpengaruh | Lakukan **Redeploy** setelah mengubah Environment Variables. |
| Build error `build-manifest.json` tidak ditemukan | Ada dua proses build berjalan bersamaan. Hentikan semuanya, hapus folder `.next`, lalu build ulang. |

---

## Keamanan

- File `.env.local` sudah masuk `.gitignore`. **Jangan pernah meng-commit kunci rahasia.**
- Jika `SUPABASE_SERVICE_ROLE_KEY` sempat bocor (misalnya ter-push ke GitHub), segera buat ulang kuncinya di Dashboard Supabase → **Project Settings → API**.
- Tabel `user_progress` dilindungi Row Level Security sehingga pengguna hanya dapat mengakses datanya sendiri.
