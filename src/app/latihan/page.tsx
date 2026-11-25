import type { Metadata } from "next";
import {
  LatihanHubClient,
  type QuizPackSummary,
} from "@/components/LatihanHubClient";
import { getAllQuizPacks } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "Latihan & Kuis Interaktif",
  description:
    "Pusat latihan bahasa Inggris dengan soal pilihan ganda, kalimat rumpang, tebak audio listening, susun kalimat, dan respon percakapan.",
};

export default function LatihanPage() {
  const allPacks = getAllQuizPacks();
  const summaries: QuizPackSummary[] = allPacks.map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
    description: p.description,
    difficulty: p.difficulty,
    question_count: p.question_count,
  }));

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <LatihanHubClient packs={summaries} />
    </div>
  );
}

