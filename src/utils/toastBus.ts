/**
 * Bus d'événements simple pour déclencher des toasts depuis n'importe où
 * (middleware Redux, utilitaires non-React, etc.) vers le <GlobalToaster /> React.
 */

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastEvent {
  variant: ToastVariant;
  title: string;
  message: string;
  duration?: number;
}

type Listener = (e: ToastEvent) => void;

const listeners = new Set<Listener>();

export function onToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToast(e: ToastEvent): void {
  listeners.forEach((l) => l(e));
}

/** Raccourci pour émettre un toast d'erreur. */
export function emitErrorToast(message: string, title = "Erreur"): void {
  emitToast({ variant: "error", title, message });
}
