"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Mic, Square, Trash2 } from "lucide-react";

interface Props {
  value: Blob | null;
  onChange: (blob: Blob | null) => void;
  className?: string;
}

const MAX_SECONDS = 180;

/**
 * Enregistrement d'un message vocal (audio conservé tel quel, en plus ou à la place du texte).
 * Utilise MediaRecorder (Chrome, Edge, Firefox, Safari récents) ; le micro doit être autorisé.
 */
export default function VoiceNoteRecorder({ value, onChange, className = "" }: Props) {
  const t = useTranslations("common.voiceNote");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supported = typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const stop = () => {
    recorderRef.current?.stop();
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > 0) onChange(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) recorder.state === "recording" && recorder.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(t("permissionError"));
    }
  };

  if (!supported) return null;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={`space-y-2 ${className}`}>
      {previewUrl && !recording ? (
        <div className="flex items-center gap-2">
          <audio controls src={previewUrl} className="h-9 flex-1 min-w-0" />
          <button
            type="button"
            onClick={() => onChange(null)}
            title={t("remove")}
            aria-label={t("remove")}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Trash2 size={15} strokeWidth={1.8} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            recording
              ? "border-red-500 bg-red-500 text-white animate-pulse"
              : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          {recording ? <Square size={13} fill="currentColor" /> : <Mic size={14} strokeWidth={1.8} />}
          {recording ? t("stopRecording", { time: fmt(seconds) }) : t("record")}
        </button>
      )}
      {error && <p className="text-xs text-error-500">{error}</p>}
    </div>
  );
}
