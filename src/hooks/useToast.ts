import { useState, useCallback } from "react";
import type { ToastItem } from "@/components/ui/toast/Toast";

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message: string,
      duration?: number
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message: string = "") => {
      addToast("success", title, message);
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message: string = "") => {
      addToast("error", title, message);
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message: string = "") => {
      addToast("warning", title, message);
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message: string = "") => {
      addToast("info", title, message);
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
