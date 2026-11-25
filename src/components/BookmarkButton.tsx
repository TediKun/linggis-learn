"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { loadProgress, toggleBookmarkSlug } from "@/lib/progress";
import { useAuth } from "@/components/AuthProvider";

interface BookmarkButtonProps {
  slug: string;
  compact?: boolean;
}

export function BookmarkButton({ slug, compact = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    const syncSavedState = () => {
      const { progress } = loadProgress();
      setSaved(progress.bookmarks.includes(slug));
    };
    syncSavedState();
    window.addEventListener("linggis-progress-updated", syncSavedState);
    window.addEventListener("linggis-progress-synced", syncSavedState);
    return () => {
      window.removeEventListener("linggis-progress-updated", syncSavedState);
      window.removeEventListener("linggis-progress-synced", syncSavedState);
    };
  }, [slug]);

  const handleToggle = () => {
    // Sesuai aturan hibrida: menyimpan hafalan ke Flashcard mewajibkan login akun
    if (!user) {
      openAuthModal({
        reason:
          "Masuk atau daftar akun terlebih dahulu untuk menyimpan hafalan kata ke Flashcard Anda.",
        pendingBookmarkSlug: slug,
      });
      return;
    }

    const res = toggleBookmarkSlug(slug);
    setSaved(res.saved);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-pressed={saved}
      aria-label={saved ? "Hapus dari Flashcard tersimpan" : "Simpan ke Flashcard"}
      className={`${
        compact ? "min-h-[34px] px-2.5 py-1 text-xs" : "min-h-[40px] px-3.5 py-2 text-sm"
      } rounded-[6px] border transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer ${
        saved
          ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)]"
          : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-primary)]"
      }`}
    >
      <Bookmark
        className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`}
        strokeWidth={1.75}
        fill={saved ? "currentColor" : "none"}
      />
      <span>{saved ? "Tersimpan" : compact ? "Simpan" : "Simpan ke Flashcard"}</span>
    </button>
  );
}
