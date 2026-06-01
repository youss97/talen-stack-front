"use client";
import { useEffect, useState, useCallback } from "react";
import { ToastContainer, type ToastItem } from "@/components/ui/toast/Toast";
import { onToast } from "@/utils/toastBus";

/**
 * Toaster global monté une seule fois à la racine de l'app.
 * Écoute le bus d'événements (toastBus) alimenté par le middleware Redux
 * de gestion d'erreurs, et affiche les toasts traduits.
 */
export default function GlobalToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = onToast((e) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        // Éviter les doublons rapprochés (même message affiché < 1.5s)
        const now = Date.now();
        const isDuplicate = prev.some(
          (t) => t.message === e.message && now - Number(String(t.id).split("-")[0]) < 1500,
        );
        if (isDuplicate) return prev;
        return [...prev, { id, variant: e.variant, title: e.title, message: e.message, duration: e.duration }];
      });
    });
    return unsubscribe;
  }, []);

  return <ToastContainer toasts={toasts} onRemove={remove} />;
}
