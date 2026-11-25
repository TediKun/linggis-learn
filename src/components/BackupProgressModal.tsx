"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, RotateCcw, X, Check, AlertCircle } from "lucide-react";
import {
  getTodayIsoDate,
  importProgressJson,
  loadProgress,
  resetAllProgress,
} from "@/lib/progress";
import type { LinggisProgress } from "@/types/linggis";

interface BackupProgressModalProps {
  open: boolean;
  onClose: () => void;
}

export function BackupProgressModal({ open, onClose }: BackupProgressModalProps) {
  const [progress, setProgress] = useState<LinggisProgress | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmReset(false);
      setStatusMessage(null);
      return;
    }
    const { progress: current, storageBlocked: blocked } = loadProgress();
    setProgress(current);
    setStorageBlocked(blocked);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleExport = () => {
    const { progress: latest } = loadProgress();
    const json = JSON.stringify(latest, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linggis-backup-${getTodayIsoDate()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatusMessage({
      type: "success",
      text: "File backup berhasil diunduh ke perangkat Anda.",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = importProgressJson(text);
      if (!result.ok || !result.progress) {
        setStatusMessage({
          type: "error",
          text: result.error ?? "Gagal membaca file backup.",
        });
        return;
      }
      setProgress(result.progress);
      setStatusMessage({
        type: "success",
        text: "Progres belajar berhasil dipulihkan dari file backup.",
      });
    } catch {
      setStatusMessage({
        type: "error",
        text: "File tidak dapat dibaca. Pastikan file berformat .json yang valid.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmReset = () => {
    const cleared = resetAllProgress();
    setProgress(cleared);
    setConfirmReset(false);
    setStatusMessage({
      type: "success",
      text: "Semua progres lokal telah dihapus dan diatur ulang.",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h2
              id="backup-modal-title"
              className="font-display text-xl font-semibold text-[var(--ink-primary)]"
            >
              Backup &amp; Kelola Progres
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              Cadangkan, pulihkan, atau atur ulang data progres belajar Anda secara manual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela backup"
            className="p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {storageBlocked && (
          <div className="mt-4 p-3 rounded-[6px] border border-[var(--accent-warm)] bg-[var(--accent-warm-tint)] text-xs text-[var(--ink-primary)]">
            Penyimpanan browser sedang dibatasi (mode privat). Progres hanya bertahan selama tab ini terbuka—sebaiknya unduh backup secara berkala.
          </div>
        )}

        {progress && (
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm">
            <div className="p-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)]">
              <div className="text-xs text-[var(--ink-muted)]">Kata Tersimpan</div>
              <div className="font-display text-xl font-semibold text-[var(--ink-primary)] mt-0.5">
                {progress.bookmarks.length}
              </div>
            </div>
            <div className="p-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)]">
              <div className="text-xs text-[var(--ink-muted)]">Modul Selesai</div>
              <div className="font-display text-xl font-semibold text-[var(--ink-primary)] mt-0.5">
                {progress.completedModules.length}
              </div>
            </div>
            <div className="p-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)]">
              <div className="text-xs text-[var(--ink-muted)]">Bacaan Selesai</div>
              <div className="font-display text-xl font-semibold text-[var(--ink-primary)] mt-0.5">
                {progress.completedReadings.length}
              </div>
            </div>
            <div className="p-3 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)]">
              <div className="text-xs text-[var(--ink-muted)]">Riwayat Latihan</div>
              <div className="font-display text-xl font-semibold text-[var(--ink-primary)] mt-0.5">
                {progress.quizHistory.length}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" strokeWidth={1.75} />
            Unduh Backup (.json)
          </button>

          <input
            ref={fileInputRef}
            id="linggis-backup-file"
            name="backupFile"
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-primary)] text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" strokeWidth={1.75} />
            Pulihkan dari File (.json)
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full min-h-[42px] px-4 py-2 rounded-[6px] border border-[var(--border-hairline)] text-[var(--state-wrong)] hover:bg-red-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
              Reset Semua Progres
            </button>
          ) : (
            <div className="p-3 rounded-[8px] border border-[var(--state-wrong)] bg-red-50 space-y-2">
              <p className="text-xs text-[var(--ink-primary)] font-medium">
                Konfirmasi: semua kata tersimpan, kartu flashcard, dan progres modul akan dihapus permanen.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex-1 min-h-[38px] px-3 rounded-[6px] bg-[var(--state-wrong)] text-white text-xs font-medium cursor-pointer"
                >
                  Ya, Hapus Semua
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 min-h-[38px] px-3 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-primary)] text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-[6px] border text-xs flex items-start gap-2 ${
              statusMessage.type === "success"
                ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)] text-[var(--ink-primary)]"
                : "border-[var(--state-wrong)] bg-red-50 text-[var(--state-wrong)]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 shrink-0 text-[var(--state-correct)]" strokeWidth={1.75} />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

