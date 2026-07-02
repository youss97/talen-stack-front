"use client";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { notificationApi, type AppNotification } from "@/lib/services/notificationApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Petit son « ding-dong » de notification (Web Audio, aucun fichier requis). */
function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("notif_sound") === "off") return; // désactivable
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);
    });
    setTimeout(() => { try { ctx.close(); } catch { /* noop */ } }, 900);
  } catch { /* noop */ }
}

/**
 * Connexion WebSocket aux notifications temps réel.
 * À monter une fois dans le layout authentifié.
 */
export default function NotificationsSocket() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket: Socket = io(`${API_URL}/notifications`, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("notification", (notif: AppNotification) => {
      // Rafraîchir la liste + le compteur
      dispatch(notificationApi.util.invalidateTags(["Notification", "UnreadCount"]));
      // Son de notification
      playNotificationSound();
      // Petit toast natif (best-effort)
      try {
        window.dispatchEvent(new CustomEvent("app:toast", { detail: { variant: "info", title: notif.title, message: notif.message } }));
      } catch { /* noop */ }
    });

    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [dispatch]);

  return null;
}
