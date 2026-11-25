export type EnglishAccent = "en-US" | "en-GB";

let activeUtterance: SpeechSynthesisUtterance | null = null;
let speakTimer: number | null = null;

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function pickEnglishVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: EnglishAccent
): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang.toLowerCase() === targetLang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en"))
  );
}

async function tryFetchDictionaryAudioUrl(
  word: string
): Promise<string | null> {
  const clean = word.trim().toLowerCase();
  if (!/^[a-z-]{2,30}$/.test(clean)) return null;
  try {
    const res = await fetch(
      `/api/words/${encodeURIComponent(clean)}/enrich`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      word?: { audio_url?: string | null };
    };
    return data.word?.audio_url ?? null;
  } catch {
    return null;
  }
}

export function speakEnglish(
  text: string,
  options?: {
    audioUrl?: string | null;
    accent?: EnglishAccent;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (message: string) => void;
  }
): void {
  if (typeof window === "undefined") return;
  const clean = text.trim();
  if (!clean) return;

  const targetLang: EnglishAccent = options?.accent ?? "en-US";

  const playHtmlAudio = (url: string, onFail: () => void) => {
    try {
      const audio = new Audio(url);
      audio.onplay = () => options?.onStart?.();
      audio.onended = () => options?.onEnd?.();
      audio.onerror = () => onFail();
      audio.play().catch(() => onFail());
    } catch {
      onFail();
    }
  };

  const runSpeechSynthesis = () => {
    if (!isSpeechSynthesisSupported()) {
      options?.onError?.("Browser ini belum mendukung fitur suara (TTS).");
      options?.onEnd?.();
      return;
    }

    const doSpeak = () => {
      try {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          synth.resume();
        }

        const voices = synth.getVoices();
        const matched = pickEnglishVoice(voices, targetLang);

        // Jika OS/browser tidak punya voice TTS terpasang dan ini kata tunggal, utamakan MP3 kamus dulu
        if (voices.length === 0 && !options?.audioUrl && /^[a-zA-Z-]{2,30}$/.test(clean)) {
          void tryFetchDictionaryAudioUrl(clean).then((fetchedUrl) => {
            if (fetchedUrl) {
              playHtmlAudio(fetchedUrl, () => {
                options?.onError?.(
                  "Suara sistem browser tidak tersedia (tidak ada voice TTS terpasang di sistem)."
                );
                options?.onEnd?.();
              });
              return;
            }
            // Tetap coba synth sekali sebagai cadangan bila voices baru dimuat terlambat
            speakViaUtterance(synth, matched);
          });
          return;
        }

        speakViaUtterance(synth, matched);
      } catch {
        options?.onError?.("Gagal memutar suara pengucapan.");
        options?.onEnd?.();
      }
    };

    const speakViaUtterance = (
      synth: SpeechSynthesis,
      matched: SpeechSynthesisVoice | undefined
    ) => {
      let startedOrEnded = false;
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = targetLang;
      utterance.rate = options?.rate ?? 0.92;
      utterance.volume = 1;
      if (matched) {
        utterance.voice = matched;
      }

      // Simpan referensi di module scope agar tidak ter-GC Chrome di tengah ucapan
      activeUtterance = utterance;

      const watchdog = window.setTimeout(() => {
        if (!startedOrEnded && activeUtterance === utterance) {
          activeUtterance = null;
          options?.onEnd?.();
          options?.onError?.(
            "Suara sistem tidak merespons (cek izin audio atau voice TTS sistem)."
          );
        }
      }, 3000);

      utterance.onstart = () => {
        startedOrEnded = true;
        window.clearTimeout(watchdog);
        options?.onStart?.();
      };

      utterance.onend = () => {
        startedOrEnded = true;
        window.clearTimeout(watchdog);
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        options?.onEnd?.();
      };

      utterance.onerror = (ev) => {
        startedOrEnded = true;
        window.clearTimeout(watchdog);
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        if (ev.error === "canceled" || ev.error === "interrupted") {
          options?.onEnd?.();
          return;
        }

        if (!options?.audioUrl) {
          void tryFetchDictionaryAudioUrl(clean).then((fetchedUrl) => {
            if (fetchedUrl) {
              playHtmlAudio(fetchedUrl, () => {
                options?.onError?.(
                  "Suara sistem browser tidak tersedia. Pastikan suara TTS perangkat aktif."
                );
                options?.onEnd?.();
              });
            } else {
              options?.onError?.(
                "Suara sistem browser tidak tersedia (tidak ada voice Inggris terpasang di OS)."
              );
              options?.onEnd?.();
            }
          });
          return;
        }

        options?.onError?.("Gagal memutar suara pengucapan.");
        options?.onEnd?.();
      };

      options?.onStart?.();
      synth.speak(utterance);
    };

    try {
      const synth = window.speechSynthesis;
      if (speakTimer !== null) {
        window.clearTimeout(speakTimer);
        speakTimer = null;
      }

      // Di Chromium/Linux, memanggil cancel() tepat sebelum speak() secara sinkron
      // sering membungkam atau langsung membatalkan utterance baru. Beri jeda 60ms.
      if (synth.speaking || synth.pending) {
        synth.cancel();
        speakTimer = window.setTimeout(doSpeak, 60);
      } else {
        doSpeak();
      }
    } catch {
      options?.onError?.("Gagal memulai layanan suara browser.");
      options?.onEnd?.();
    }
  };

  if (options?.audioUrl) {
    playHtmlAudio(options.audioUrl, runSpeechSynthesis);
    return;
  }

  runSpeechSynthesis();
}

export interface SpeechRecognitionResultCompat {
  transcript: string;
  confidence: number;
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

export function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  try {
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
  } catch {
    return null;
  }
}

export function scorePronunciationMatch(
  target: string,
  spoken: string
): {
  score: number;
  matchedWords: string[];
  missingWords: string[];
} {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[^a-z0-9'\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

  const targetWords = normalize(target);
  const spokenSet = new Set(normalize(spoken));

  if (targetWords.length === 0) {
    return { score: 0, matchedWords: [], missingWords: [] };
  }

  const matchedWords: string[] = [];
  const missingWords: string[] = [];

  for (const w of targetWords) {
    if (spokenSet.has(w)) {
      matchedWords.push(w);
    } else {
      missingWords.push(w);
    }
  }

  const score = Math.round((matchedWords.length / targetWords.length) * 100);
  return { score, matchedWords, missingWords };
}
