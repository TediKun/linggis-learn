"use client";

import { useEffect, useState } from "react";
import { X, LogIn, UserPlus, Check, AlertCircle, Bookmark, Loader2 } from "lucide-react";
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";

interface AuthModalProps {
  open: boolean;
  reason?: string | null;
  pendingBookmarkSlug?: string | null;
  onClose: () => void;
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email atau kata sandi belum sesuai. Periksa kembali atau daftar akun baru.";
  }
  if (lower.includes("user already registered")) {
    return "Email ini sudah terdaftar. Silakan beralih ke tab Masuk.";
  }
  if (lower.includes("password should be at least")) {
    return "Kata sandi minimal terdiri dari 6 karakter.";
  }
  if (lower.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Cek kotak masuk email Anda atau matikan opsi Confirm Email di pengaturan Supabase.";
  }
  return message;
}

export function AuthModal({
  open,
  reason,
  pendingBookmarkSlug,
  onClose,
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const configured = isSupabaseBrowserConfigured();

  useEffect(() => {
    if (!open) {
      setFeedback(null);
      setSubmitting(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFeedback({
        type: "error",
        text: "Koneksi Supabase belum diisi pada file .env.local.",
      });
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || password.length < 6) {
      setFeedback({
        type: "error",
        text: "Masukkan alamat email yang valid dan kata sandi minimal 6 karakter.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          setFeedback({
            type: "error",
            text: translateAuthError(error.message),
          });
          return;
        }
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });
        if (error) {
          setFeedback({
            type: "error",
            text: translateAuthError(error.message),
          });
          return;
        }
        if (data.session) {
          onClose();
        } else {
          setFeedback({
            type: "success",
            text: "Akun berhasil dibuat! Silakan cek email Anda bila verifikasi diaktifkan, atau langsung masuk di tab Masuk.",
          });
          setTab("login");
        }
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Gagal menghubungi server autentikasi. Pastikan internet aktif dan konfigurasi Supabase benar.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-2xl font-semibold text-[var(--ink-primary)]"
            >
              {tab === "login" ? "Masuk ke Akun Linggis" : "Buat Akun Baru"}
            </h2>
            <p className="text-sm text-[var(--ink-secondary)] mt-1">
              {reason ??
                "Simpan daftar hafalan Flashcard dan sinkronkan progres belajar Anda secara permanen."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela masuk"
            className="p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {pendingBookmarkSlug && (
          <div className="p-3 rounded-[6px] border border-[var(--accent-primary)]/30 bg-[var(--accent-primary-tint)] text-xs text-[var(--ink-primary)] flex items-center gap-2">
            <Bookmark
              className="w-4 h-4 text-[var(--accent-primary)] shrink-0"
              strokeWidth={1.75}
            />
            <span>
              Kata <strong>&ldquo;{pendingBookmarkSlug.replace(/-/g, " ")}&rdquo;</strong> akan otomatis tersimpan ke akun begitu Anda selesai masuk.
            </span>
          </div>
        )}

        {!configured && (
          <div className="p-3.5 rounded-[6px] border border-[var(--accent-warm)] bg-[var(--accent-warm-tint)] text-xs text-[var(--ink-primary)] space-y-1">
            <p className="font-semibold">Konfigurasi Supabase belum diisi</p>
            <p>
              Isi <code className="font-mono-ipa">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
              <code className="font-mono-ipa">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di{" "}
              <code className="font-mono-ipa">.env.local</code> serta jalankan migrasi SQL untuk mengaktifkan penyimpanan akun permanen.
            </p>
          </div>
        )}

        {/* Tab Masuk / Daftar */}
        <div
          className="grid grid-cols-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] p-1"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => {
              setTab("login");
              setFeedback(null);
            }}
            className={`min-h-[36px] text-sm font-medium rounded-[4px] transition-colors cursor-pointer ${
              tab === "login"
                ? "bg-[var(--bg-surface)] text-[var(--ink-primary)] border border-[var(--border-hairline)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            onClick={() => {
              setTab("register");
              setFeedback(null);
            }}
            className={`min-h-[36px] text-sm font-medium rounded-[4px] transition-colors cursor-pointer ${
              tab === "register"
                ? "bg-[var(--bg-surface)] text-[var(--ink-primary)] border border-[var(--border-hairline)]"
                : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Form Email + Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email-input"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]"
            >
              Alamat Email
            </label>
            <input
              id="auth-email-input"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="auth-password-input"
              className="block text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]"
            >
              Kata Sandi
            </label>
            <input
              id="auth-password-input"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !configured}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] disabled:opacity-50 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                Memproses...
              </>
            ) : tab === "login" ? (
              <>
                <LogIn className="w-4 h-4" strokeWidth={1.75} />
                Masuk &amp; Sinkronkan Progres
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                Daftar &amp; Simpan Permanen
              </>
            )}
          </button>
        </form>

        {feedback && (
          <div
            className={`p-3 rounded-[6px] border text-xs flex items-start gap-2 ${
              feedback.type === "success"
                ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)] text-[var(--ink-primary)]"
                : "border-[var(--state-wrong)] bg-red-50 text-[var(--state-wrong)]"
            }`}
          >
            {feedback.type === "success" ? (
              <Check
                className="w-4 h-4 shrink-0 text-[var(--state-correct)]"
                strokeWidth={1.75}
              />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <p className="text-xs text-[var(--ink-muted)] text-center">
          Tanpa login, progres modul dan latihan tetap tersimpan sementara di browser perangkat ini.
        </p>
      </div>
    </div>
  );
}

