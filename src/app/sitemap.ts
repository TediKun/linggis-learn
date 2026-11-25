import type { MetadataRoute } from "next";
import {
  getAllLocalWords,
  getAllQuizPacks,
  getAllReadingsList,
} from "@/lib/data-store";
import { getFullRoadmap } from "@/lib/roadmap-builder";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/roadmap`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/bacaan`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/latihan`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/flashcard`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const roadmapRoutes: MetadataRoute.Sitemap = getFullRoadmap().map((mod) => ({
    url: `${baseUrl}/roadmap/${encodeURIComponent(mod.slug)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const readingRoutes: MetadataRoute.Sitemap = getAllReadingsList().map((r) => ({
    url: `${baseUrl}/bacaan/${encodeURIComponent(r.slug)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const quizRoutes: MetadataRoute.Sitemap = getAllQuizPacks().map((p) => ({
    url: `${baseUrl}/latihan/${encodeURIComponent(p.slug)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Sertakan 500 entri kamus inti awal di sitemap utama
  const wordRoutes: MetadataRoute.Sitemap = getAllLocalWords()
    .slice(0, 500)
    .map((w) => ({
      url: `${baseUrl}/kamus/${encodeURIComponent(w.slug)}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [
    ...staticRoutes,
    ...roadmapRoutes,
    ...readingRoutes,
    ...quizRoutes,
    ...wordRoutes,
  ];
}

