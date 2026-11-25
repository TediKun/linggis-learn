"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { loadProgress } from "@/lib/progress";

export function StorageNoticeBanner() {
  const [blocked, setBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const { storageBlocked } = loadProgress();
    if (storageBlocked) {
      setBlocked(true);
    }
  }, []);

  if (!blocked || dismissed) return null;

  return (
    <div
      role="status"
      className="border-b border-[var(--accent-warm)]/40 bg-[var(--accent-warm-tint)] px-4 sm:px-6 py-2.5"
    >
      <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm text-[var(--ink-primary)]">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle
            className="w-4 h-4 text-[var(--accent-warm)] shrink-0"
            strokeWidth={1.75}
          />
          <span>
            Mode privat ketat terdeteksi: penyimpanan lokal dibatasi, sehingga progres hanya tersimpan sementara di memori tab ini. Gunakan <strong>Backup Progres</strong> di kanan atas untuk mengunduh cadangan JSON.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Tutup pemberitahuan mode privat"
          className="p-1 rounded hover:bg-black/5 text-[var(--ink-secondary)] shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

