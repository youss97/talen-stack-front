"use client";
import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { notificationApi, type AppNotification } from "@/lib/services/notificationApi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
