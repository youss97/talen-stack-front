"use client";
import React, { useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  variant,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const variantClasses = {
    success: {
      container: "border-success-500 bg-white dark:bg-gray-900",
      icon: "text-success-500",
      bar: "bg-success-500",
    },
    error: {
      container: "border-error-500 bg-white dark:bg-gray-900",
      icon: "text-error-500",
      bar: "bg-error-500",
    },
    warning: {
      container: "border-warning-500 bg-white dark:bg-gray-900",
      icon: "text-warning-500",
      bar: "bg-warning-500",
    },
    info: {
      container: "border-blue-500 bg-white dark:bg-gray-900",
      icon: "text-blue-500",
      bar: "bg-blue-500",
    },
  };

  const icons = {
    success: <CheckCircle2 size={20} strokeWidth={1.8} className="icon-glow" />,
    error: <XCircle size={20} strokeWidth={1.8} className="icon-glow" />,
    warning: <AlertTriangle size={20} strokeWidth={1.8} className="icon-glow" />,
    info: <Info size={20} strokeWidth={1.8} className="icon-glow" />,
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border shadow-lg ${variantClasses[variant].container} animate-slide-in-right min-w-[320px] max-w-[400px]`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${variantClasses[variant].icon}`}>
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          {message && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} strokeWidth={1.8} className="icon-glow" />
        </button>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 ${variantClasses[variant].bar} animate-shrink`} style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};

export interface ToastItem {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-9999999 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default Toast;
