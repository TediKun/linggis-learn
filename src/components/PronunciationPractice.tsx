"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, CheckCircle2, AlertCircle } from "lucide-react";
import {
  getSpeechRecognitionConstructor,
  scorePronunciationMatch,
} from "@/lib/speech";
import { AudioPlayButton } from "@/components/AudioPlayButton";

interface PronunciationPracticeProps {
  targetText: string;
  hintText?: string | null;
  title?: string;
}

export function PronunciationPractice({
  targetText,
  hintText,
  title = "Latihan Pelafalan (Speaking)",
}: PronunciationPracticeProps) {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
    setSupported(Boolean(getSpeechRecognitionConstructor()));
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  useEffect(() => {
    setTranscript(null);
    setErrorMsg(null);
    setListening(false);
  }, [targetText]);

  const handleToggleMic = () => {
    if (listening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      setSupported(false);
      return;
    }

    setErrorMsg(null);
    setTranscript(null);

    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onresult = (event) => {
        const result = event.results?.[0]?.[0]?.transcript ?? "";
        setTranscript(result);
        setListening(false);
      };

      rec.onerror = (event) => {
        if (event.error === "not-allowed") {
          setErrorMsg(
            "Izin mikrofon ditolak browser. Aktifkan izin mikrofon di pengaturan situs jika ingin mencoba lagi."
          );
        } else if (event.error === "no-speech") {
          setErrorMsg(
            "Suara belum terdeteksi. Coba klik Rekam lalu ucapkan dengan jelas."
          );
        } else {
          setErrorMsg("Pengenalan suara terhenti. Silakan coba lagi.");
        }
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setErrorMsg("Tidak dapat memulai mikrofon di peramban ini.");
      setListening(false);
    }
  };

  const matchResult =
    transcript !== null ? scorePronunciationMatch(targetText, transcript) : null;

  return (
    <section className="p-6 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--ink-primary)]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
            Dengarkan contoh suara lalu ucapkan keras untuk mengecek kejelasan pelafalan Anda.
          </p>
        </div>
        <AudioPlayButton text={targetText} label="Contoh Suara" compact />
      </div>

      <div className="p-4 rounded-[8px] border border-[var(--border-hairline)] bg-[var(--bg-paper)] space-y-1">
        <div className="font-display text-lg font-semibold text-[var(--ink-primary)] break-words">
          &ldquo;{targetText}&rdquo;
        </div>
        {hintText && (
          <div className="text-xs font-mono-ipa text-[var(--ink-muted)]">
            panduan baca: {hintText}
          </div>
        )}
      </div>

      {!mounted ? (
        <div className="text-xs text-[var(--ink-muted)]">
          Memeriksa dukungan mikrofon...
        </div>
      ) : !supported ? (
        <div className="p-3.5 rounded-[6px] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-xs sm:text-sm text-[var(--ink-secondary)]">
          Pengenalan suara otomatis (<span className="font-mono-ipa">SpeechRecognition</span>) tidak tersedia di browser ini. Anda tetap bisa menekan <strong>Contoh Suara</strong> dan menirukannya secara langsung.
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`min-h-[42px] px-4 py-2 rounded-[6px] text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
              listening
                ? "bg-[var(--state-wrong)] text-white"
                : "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white"
            }`}
          >
            {listening ? (
              <>
                <Square className="w-4 h-4" strokeWidth={1.75} />
                Mendengarkan... (Klik untuk berhenti)
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" strokeWidth={1.75} />
                Mulai Rekam &amp; Cek Pelafalan
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 rounded-[6px] border border-[var(--accent-warm)] bg-[var(--accent-warm-tint)] text-xs sm:text-sm text-[var(--ink-primary)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[var(--accent-warm)] shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          {matchResult && (
            <div
              className={`p-4 rounded-[8px] border space-y-2 ${
                matchResult.score >= 75
                  ? "border-[var(--state-correct)] bg-[var(--accent-primary-tint)]/40"
                  : "border-[var(--accent-warm)] bg-[var(--accent-warm-tint)]/55"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--ink-primary)] inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      matchResult.score >= 75
                        ? "text-[var(--state-correct)]"
                        : "text-[var(--accent-warm)]"
                    }`}
                    strokeWidth={1.75}
                  />
                  Kecocokan Pelafalan: {matchResult.score}%
                </span>
                <span className="text-xs font-mono-ipa text-[var(--ink-secondary)]">
                  Terucap: &ldquo;{transcript}&rdquo;
                </span>
              </div>

              {matchResult.missingWords.length > 0 && (
                <p className="text-xs sm:text-sm text-[var(--ink-secondary)]">
                  Kata yang perlu diperjelas:{" "}
                  <span className="font-mono-ipa font-medium text-[var(--ink-primary)]">
                    {matchResult.missingWords.join(", ")}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

