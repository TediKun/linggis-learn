"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArchiveRestore,
  ChevronDown,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  RefreshCw,
  UserRound,
} from "lucide-react";
import type { CloudSyncStatus } from "@/components/AuthProvider";

interface Props {
  email: string | null;
  syncStatus: CloudSyncStatus;
  onLogin: () => void;
  onLogout: () => void;
  onBackup: () => void;
}

export function AccountMenu({ email, syncStatus, onLogin, onLogout, onBackup }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = email ? email.split("@")[0] : "Tamu";
  const initial = email ? name.charAt(0).toUpperCase() : null;

  const item =
    "w-full min-h-[40px] px-3 py-2 rounded-[6px] text-sm text-left flex items-center gap-2.5 text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer";
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu akun"
        className="min-h-[38px] pl-1 pr-2 py-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
      >
        <span className="relative w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white grid place-items-center font-display text-base font-semibold">
          {initial ?? <UserRound className="w-4 h-4" strokeWidth={1.75} />}
          {email && syncStatus === "syncing" && (
            <RefreshCw
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 p-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--accent-primary)] animate-spin"
              strokeWidth={2}
            />
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--ink-secondary)] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-1.5 z-50"
        >
          <div className="px-3 py-2.5 border-b border-[var(--border-hairline)] mb-1">
            <p className="text-sm font-semibold text-[var(--ink-primary)] truncate">{name}</p>
            <p className="text-xs text-[var(--ink-secondary)] truncate">
              {email ?? "Progres tersimpan di browser ini"}
            </p>
            <p className="mt-1.5 text-xs inline-flex items-center gap-1.5 text-[var(--ink-tertiary)]">
              {email ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-[var(--accent-primary)]" strokeWidth={1.75} />
                  {syncStatus === "syncing"
                    ? "Menyinkronkan…"
                    : syncStatus === "error"
                      ? "Gagal sinkron"
                      : "Tersinkron ke cloud"}
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Belum tersimpan di cloud
                </>
              )}
            </p>
          </div>

          <Link href="/profil" role="menuitem" onClick={close} className={item}>
            <UserRound className="w-4 h-4 text-[var(--ink-secondary)]" strokeWidth={1.75} />
            Profil & progres
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              onBackup();
            }}
            className={item}
          >
            <ArchiveRestore className="w-4 h-4 text-[var(--ink-secondary)]" strokeWidth={1.75} />
            Backup & pulihkan
          </button>

          <div className="border-t border-[var(--border-hairline)] mt-1 pt-1">
            {email ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onLogout();
                }}
                className={`${item} text-[var(--state-wrong)]`}
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
                Keluar
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onLogin();
                }}
                className={`${item} text-[var(--accent-primary)] font-medium`}
              >
                <LogIn className="w-4 h-4" strokeWidth={1.75} />
                Masuk / Daftar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

