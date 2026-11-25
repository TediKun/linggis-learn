"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { LinggisProgressSchema, type LinggisProgress } from "@/types/linggis";
import {
  getTodayIsoDate,
  loadProgress,
  mergeProgress,
  saveSyncedProgressFromCloud,
} from "@/lib/progress";
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";
import { AuthModal } from "@/components/AuthModal";

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error";

interface OpenAuthModalOptions {
  reason?: string;
  pendingBookmarkSlug?: string;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  supabaseConfigured: boolean;
  syncStatus: CloudSyncStatus;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authReady: false,
  supabaseConfigured: false,
  syncStatus: "idle",
  openAuthModal: () => {},
  signOut: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

function applyPendingBookmark(
  base: LinggisProgress,
  slug: string | null
): LinggisProgress {
  if (!slug) return base;
  if (base.bookmarks.includes(slug)) return base;
  const flashcards = { ...base.flashcards };
  if (!flashcards[slug]) {
    flashcards[slug] = {
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: getTodayIsoDate(),
    };
  }
  return {
    ...base,
    bookmarks: [...base.bookmarks, slug],
    flashcards,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalReason, setModalReason] = useState<string | null>(null);
  const [pendingSlugState, setPendingSlugState] = useState<string | null>(null);

  const pendingBookmarkRef = useRef<string | null>(null);
  const syncingUserIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const supabaseConfigured = isSupabaseBrowserConfigured();

  const pushToCloud = useCallback(
    async (targetUser: User, progress: LinggisProgress) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      setSyncStatus("syncing");
      try {
        const { error } = await supabase.from("user_progress").upsert(
          {
            user_id: targetUser.id,
            email: targetUser.email ?? null,
            progress_data: progress,
            bookmarks_count: progress.bookmarks.length,
            completed_modules_count: progress.completedModules.length,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        setSyncStatus(error ? "error" : "synced");
      } catch {
        setSyncStatus("error");
      }
    },
    []
  );

  const pullAndMergeUserProgress = useCallback(
    async (targetUser: User) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      if (syncingUserIdRef.current === targetUser.id) return;
      syncingUserIdRef.current = targetUser.id;
      setSyncStatus("syncing");

      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("progress_data")
          .eq("user_id", targetUser.id)
          .maybeSingle();

        if (error) {
          setSyncStatus("error");
          return;
        }

        const { progress: localProgress } = loadProgress();
        let merged = localProgress;

        if (data?.progress_data) {
          const parsed = LinggisProgressSchema.safeParse(data.progress_data);
          if (parsed.success) {
            merged = mergeProgress(localProgress, parsed.data);
          }
        }

        // Terapkan kata yang diklik tepat sebelum login (jika ada)
        const pendingSlug = pendingBookmarkRef.current;
        if (pendingSlug) {
          merged = applyPendingBookmark(merged, pendingSlug);
          pendingBookmarkRef.current = null;
          setPendingSlugState(null);
        }

        saveSyncedProgressFromCloud(merged);
        await pushToCloud(targetUser, merged);
      } catch {
        setSyncStatus("error");
      } finally {
        syncingUserIdRef.current = null;
      }
    },
    [pushToCloud]
  );

  // Inisialisasi sesi Supabase Auth
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const currentUser = data.session?.user ?? null;
        setUser(currentUser);
        setAuthReady(true);
        if (currentUser) {
          void pullAndMergeUserProgress(currentUser);
        }
      })
      .catch(() => {
        setAuthReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        setModalOpen(false);
        void pullAndMergeUserProgress(nextUser);
      } else {
        setSyncStatus("idle");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pullAndMergeUserProgress]);

  // Sinkronisasi otomatis ke cloud setiap kali progres lokal berubah saat sudah login
  useEffect(() => {
    if (!user) return;

    const handleLocalUpdate = () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      setSyncStatus("syncing");
      debounceTimerRef.current = window.setTimeout(() => {
        const { progress } = loadProgress();
        void pushToCloud(user, progress);
      }, 500);
    };

    window.addEventListener("linggis-progress-updated", handleLocalUpdate);
    return () => {
      window.removeEventListener("linggis-progress-updated", handleLocalUpdate);
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user, pushToCloud]);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    setModalReason(options?.reason ?? null);
    const slug = options?.pendingBookmarkSlug ?? null;
    pendingBookmarkRef.current = slug;
    setPendingSlugState(slug);
    setModalOpen(true);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSyncStatus("idle");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        supabaseConfigured,
        syncStatus,
        openAuthModal,
        signOut,
      }}
    >
      {children}
      <AuthModal
        open={modalOpen}
        reason={modalReason}
        pendingBookmarkSlug={pendingSlugState}
        onClose={() => {
          setModalOpen(false);
          pendingBookmarkRef.current = null;
          setPendingSlugState(null);
        }}
      />
    </AuthContext.Provider>
  );
}

