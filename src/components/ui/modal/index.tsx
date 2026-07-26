"use client";
import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; // New prop to control close button visibility
  isFullscreen?: boolean; // Default to false for backwards compatibility
  closeOnOutsideClick?: boolean; // 8.2 — par défaut false : la popup ne se ferme que via l'icône
  inline?: boolean; // 3.1 — rend le contenu en page (sans overlay/backdrop)
  bare?: boolean; // rend le contenu en pleine page SANS carte (ni fond blanc, ni arrondi)
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  showCloseButton = true, // Default to true for backwards compatibility
  isFullscreen = false,
  closeOnOutsideClick = false,
  inline = false,
  bare = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full rounded-3xl bg-white dark:bg-gray-900";

  // 3.1 — Mode "page" : rendu inline sans overlay ni backdrop
  if (inline) {
    return (
      <div className={`relative w-full ${bare ? "" : "rounded-2xl bg-white dark:bg-gray-900"} ${className || ""}`}>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <X size={22} strokeWidth={1.8} className="icon-glow" />
          </button>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-99999 p-2 sm:p-4">
      {!isFullscreen && (
        <div
          className="fixed inset-0 h-full w-full bg-black/30 backdrop-blur-sm"
          onClick={closeOnOutsideClick ? onClose : undefined}
        ></div>
      )}
      <div
        ref={modalRef}
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
          >
            <X size={24} strokeWidth={1.8} className="icon-glow" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
};
