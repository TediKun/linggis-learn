import type { Metadata } from "next";
import { ProfileDashboardClient } from "@/components/ProfileDashboardClient";
import { getFullRoadmap } from "@/lib/roadmap-builder";
import { getAllQuizPacks, getAllReadingsList } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Profil & Progres Belajar",
  description:
    "Lihat kosakata tersimpan, modul roadmap yang selesai, bacaan, dan riwayat latihan Anda di Linggis.",
};

export default function ProfilPage() {
  const modules = getFullRoadmap().map((m) => ({
    slug: m.slug,
    title: m.title,
    stage: m.cefr_level as string,
    order: m.order_index,
  }));
  const quizTitles: Record<string, string> = {};
  for (const p of getAllQuizPacks()) quizTitles[p.slug] = p.title;
  const readingTitles: Record<string, string> = {};
  for (const r of getAllReadingsList()) readingTitles[r.slug] = r.title;

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <ProfileDashboardClient
        modules={modules}
        quizTitles={quizTitles}
        readingTitles={readingTitles}
      />
    </div>
  );
}

