"use client";

import { Cloud, CheckCircle2, RefreshCw, AlertCircle, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export function AccountSyncBanner() {
  const { user, authReady, syncStatus, openAuthModal } = useAuth();

  if (!authReady) return null;

  if (user) {
    return (
      <div className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--accent-primary-tint)]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-[var(--ink-primary)] min-w-0">
          <Cloud
            className="w-4 h-4 text-[var(--accent-primary)] shrink-0"
            strokeWidth={1.75}
          />
          <span className="truncate">
            Tersimpan permanen di akun{" "}
            <strong className="font-mono-ipa font-medium">{user.email}</strong>
          </span>
        </div>

        <div className="text-xs font-mono-ipa shrink-0 flex items-center gap-1.5">
          {syncStatus === "syncing" ? (
            <span className="text-[var(--ink-secondary)] inline-flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
              Menyinkronkan...
            </span>
          ) : syncStatus === "error" ? (
            <span className="text-[var(--accent-warm)] inline-flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
              Tersimpan lokal (gagal sinkron cloud)
            </span>
          ) : (
            <span className="text-[var(--state-correct)] inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              Tersinkronisasi
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
      <p className="text-[var(--ink-secondary)]">
        Progres belajar Anda saat ini tersimpan sementara di browser perangkat ini.{" "}
        <strong className="text-[var(--ink-primary)] font-medium">
          Masuk ke akun
        </strong>{" "}
        jika ingin menyimpannya secara permanen.
      </p>
      <button
        type="button"
        onClick={() =>
          openAuthModal({
            reason:
              "Masuk atau daftar akun agar seluruh progres modul, latihan, dan hafalan Anda tersimpan permanen di cloud.",
          })
        }
        className="min-h-[36px] px-3.5 py-1.5 rounded-[6px] border border-[var(--accent-primary)] bg-[var(--bg-surface)] hover:bg-[var(--accent-primary-tint)] text-[var(--accent-primary)] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} />
        Simpan Permanen
      </button>
    </div>
  );
}

