"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface VoiceInputButtonProps {
  /** Appelé avec le texte transcrit final à chaque segment reconnu (à concaténer côté appelant). */
  onResult: (transcript: string) => void;
  className?: string;
}

const LOCALE_TO_LANG: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-SA",
};

/**
 * Bouton micro de dictée vocale (transcription en texte) basé sur la Web Speech API du
 * navigateur (gratuit, sans backend). Non supporté par tous les navigateurs (Chrome/Edge oui,
 * Firefox non, Safari partiel) : le bouton est alors grisé avec une infobulle explicative.
 */
export default function VoiceInputButton({ onResult, className = "" }: VoiceInputButtonProps) {
  const locale = useLocale();
  const t = useTranslations("common.voiceInput");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LOCALE_TO_LANG[locale] || "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Navigateur sans reconnaissance vocale (ex. Firefox) : bouton grisé avec explication plutôt qu'invisible
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title={t("notSupported")}
        aria-label={t("notSupported")}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed flex-shrink-0 dark:border-gray-800 dark:text-gray-600 ${className}`}
      >
        <Mic size={16} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? t("stop") : t("start")}
      aria-label={isListening ? t("stop") : t("start")}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors flex-shrink-0 ${
        isListening
          ? "bg-red-500 border-red-500 text-white animate-pulse"
          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
      } ${className}`}
    >
      {isListening ? <Square size={14} strokeWidth={1.8} fill="currentColor" /> : <Mic size={16} strokeWidth={1.8} className="icon-glow" />}
    </button>
  );
}
