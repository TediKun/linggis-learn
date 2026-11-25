import type { Metadata } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { StorageNoticeBanner } from "@/components/StorageNoticeBanner";

export const metadata: Metadata = {
  title: {
    default: "Linggis — Kamus & Panduan Belajar Bahasa Inggris",
    template: "%s — Linggis",
  },
  description:
    "Website belajar bahasa Inggris berbahasa Indonesia dengan kamus cepat, roadmap belajar terstruktur dari A0 sampai C1, bacaan percakapan, latihan soal interaktif, dan flashcard berbasis SM-2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[var(--bg-paper)] text-[var(--ink-primary)] antialiased">
        <AuthProvider>
          <Navbar />
          <StorageNoticeBanner />
          <main className="flex-1 w-full">{children}</main>
          <footer className="border-t border-[var(--border-hairline)] bg-[var(--bg-paper)] mt-16">
            <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-[var(--ink-muted)]">
              <div className="space-y-1">
                <p className="font-display text-base font-semibold text-[var(--ink-primary)]">
                  Linggis
                </p>
                <p>
                  Kamus Inggris–Indonesia &amp; Panduan Belajar Terstruktur A0–C1.
                  Progres tersimpan di peramban atau disinkronkan ke akun Anda.
                </p>
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                Tekan <kbd className="font-mono-ipa px-1.5 py-0.5 border border-[var(--border-hairline)] rounded bg-[var(--bg-surface)] text-[var(--ink-secondary)]">/</kbd> kapan saja untuk mencari kata.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
