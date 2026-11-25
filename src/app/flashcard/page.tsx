import type { Metadata } from "next";
import { FlashcardDeck } from "@/components/FlashcardDeck";

export const metadata: Metadata = {
  title: "Flashcard Pengulangan Berjarak (SM-2)",
  description:
    "Ulang hafalan kosakata dan frasa bahasa Inggris menggunakan algoritma pengulangan berjarak SM-2 tanpa akun login.",
};

export default function FlashcardPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <FlashcardDeck />
    </div>
  );
}

