"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BackupProgressModal } from "@/components/BackupProgressModal";
import { useAuth } from "@/components/AuthProvider";
import { AccountMenu } from "@/components/AccountMenu";

const NAV_ITEMS = [
  { href: "/", label: "Kamus", matchPrefix: "/kamus" },
  { href: "/roadmap", label: "Roadmap", matchPrefix: "/roadmap" },
  { href: "/bacaan", label: "Bacaan", matchPrefix: "/bacaan" },
  { href: "/latihan", label: "Latihan", matchPrefix: "/latihan" },
  { href: "/flashcard", label: "Flashcard", matchPrefix: "/flashcard" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const { user, syncStatus, openAuthModal, signOut } = useAuth();

  const isActive = (href: string, prefix: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/kamus");
    }
    return pathname === href || pathname.startsWith(prefix);
  };


  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-[var(--border-hairline)] bg-[var(--bg-paper)]">
        <div className="max-w-[1040px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className="font-display text-2xl font-semibold tracking-tight text-[var(--ink-primary)] shrink-0"
            >
              Linggis
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi utama">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.matchPrefix);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 text-sm rounded-[6px] transition-colors ${
                      active
                        ? "text-[var(--accent-primary)] font-semibold bg-[var(--accent-primary-tint)]"
                        : "text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AccountMenu
              email={user?.email ?? null}
              syncStatus={syncStatus}
              onLogin={() => openAuthModal()}
              onLogout={() => void signOut()}
              onBackup={() => setBackupOpen(true)}
            />

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileOpen}
              className="md:hidden p-2 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--ink-primary)]"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 space-y-2">
            <nav className="flex flex-col gap-1" aria-label="Navigasi seluler">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.matchPrefix);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`min-h-[44px] px-3 py-2.5 rounded-[6px] text-sm flex items-center ${
                      active
                        ? "text-[var(--accent-primary)] font-semibold bg-[var(--accent-primary-tint)]"
                        : "text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

          </div>
        )}
      </header>

      <BackupProgressModal open={backupOpen} onClose={() => setBackupOpen(false)} />
    </>
  );
}
