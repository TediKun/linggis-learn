# Linggis

Website belajar bahasa Inggris untuk penutur Indonesia: kamus, roadmap A0–C1, bacaan, latihan, dan flashcard SM-2.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (opsional untuk login & sinkron cloud)

## Menjalankan lokal
```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase
npm run dev
```

## Database (Supabase)
1. Jalankan SQL di `supabase/migrations/` secara berurutan di SQL Editor Supabase.
2. Isi data awal: `npm run seed:apk` (butuh `SUPABASE_SERVICE_ROLE_KEY`).

## Deploy ke Vercel
Set Environment Variables di Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan pakai prefix `NEXT_PUBLIC_`)
- `NEXT_PUBLIC_SITE_URL` (contoh: `https://linggis.vercel.app`)
- `MYMEMORY_EMAIL` (opsional)
