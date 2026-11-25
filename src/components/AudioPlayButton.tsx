"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { speakEnglish } from "@/lib/speech";

interface AudioPlayButtonProps {
  text: string;
  audioUrl?: string | null;
  label?: string;
  showAccentToggle?: boolean;
  compact?: boolean;
}

export function AudioPlayButton({
  text,
  audioUrl,
  label = "Dengarkan",
  showAccentToggle = false,
  compact = false,
}: AudioPlayButtonProps) {
  const [playing, setPlaying] = useState(false);
  const [accent, setAccent] = useState<"en-US" | "en-GB">("en-US");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePlay = () => {
    setErrorMsg(null);
    speakEnglish(text, {
      audioUrl: accent === "en-US" ? audioUrl : null,
      accent,
      onStart: () => setPlaying(true),
      onEnd: () => setPlaying(false),
      onError: (msg) => {
        setPlaying(false);
        setErrorMsg(msg);
      },
    });
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Putar pengucapan untuk ${text}`}
          className={`${
            compact
              ? "min-h-[34px] px-2.5 py-1 text-xs"
              : "min-h-[40px] px-3.5 py-2 text-sm"
          } rounded-[6px] border transition-colors inline-flex items-center gap-1.5 font-medium cursor-pointer ${
            playing
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary-tint)] text-[var(--accent-primary)]"
              : "border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--ink-primary)]"
          }`}
        >
          <Volume2
            className={`${compact ? "w-3.5 h-3.5" : "w-4 h-4"} ${
              playing
                ? "text-[var(--accent-primary)]"
                : "text-[var(--ink-secondary)]"
            }`}
            strokeWidth={1.75}
          />
          <span>{playing ? "Memutar..." : label}</span>
        </button>

        {showAccentToggle && (
          <div
            className="inline-flex rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0.5"
            role="group"
            aria-label="Pilih aksen pelafalan"
          >
            {(["en-US", "en-GB"] as const).map((opt) => {
              const active = accent === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAccent(opt)}
                  className={`px-2 py-1 text-xs font-mono-ipa rounded-[4px] transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--accent-primary)] text-white"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {opt === "en-US" ? "US" : "UK"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {errorMsg && (
        <span className="text-[11px] text-[var(--state-wrong)]">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
