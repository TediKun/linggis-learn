import type { Metadata } from "next";
import { RoadmapClient, type RoadmapSummaryItem } from "@/components/RoadmapClient";
import { getFullRoadmap } from "@/lib/roadmap-builder";

export const metadata: Metadata = {
  title: "Roadmap Belajar Bahasa Inggris A0–C1",
  description:
    "Peta belajar bahasa Inggris terstruktur mulai dari Tahap Fondasi (A0), Hafalan Inti, 70 topik Grammar fungsional, hingga Praktik Percakapan dan Bacaan.",
};

export default function RoadmapPage() {
  const fullModules = getFullRoadmap();
  const summaries: RoadmapSummaryItem[] = fullModules.map((m) => ({
    slug: m.slug,
    cefr_level: m.cefr_level,
    track: m.track,
    order_index: m.order_index,
    title: m.title,
    subtitle: m.subtitle,
    summary: m.summary,
    estimated_minutes: m.estimated_minutes,
    quiz_module_slug: m.quiz_module_slug,
  }));

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <RoadmapClient modules={summaries} />
    </div>
  );
}

