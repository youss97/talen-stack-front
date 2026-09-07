"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useClampedDropdownPosition } from "@/hooks/useClampedDropdownPosition";

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
};

export default function LanguageSwitcher() {
  const t = useTranslations("layout.header");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pos = useClampedDropdownPosition(buttonRef, dropdownRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (nextLocale: string) => {
    setIsOpen(false);
    // Conserver les paramètres de requête (ex: ?preview=1 sur le site vitrine) — sans ça,
    // changer de langue les perd silencieusement et peut déclencher des effets de bord
    // (ex: redirection automatique hors de la page pour un utilisateur déjà connecté).
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { locale: nextLocale });
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t("language")}
        style={{ borderColor: "var(--border-strong)" }}
        className="relative flex items-center justify-center transition-colors border rounded-full h-11 w-11 text-gray-600 hover:text-gray-900 hover:bg-[var(--brand-soft)] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
      >
        <Globe size={20} strokeWidth={1.6} className="icon-glow" />
      </button>
      {isOpen && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-[9999] w-40 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className={`flex w-full items-center px-4 py-2 text-sm text-start hover:bg-gray-50 dark:hover:bg-white/5 ${
                loc === locale ? "font-semibold text-brand-500" : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {LOCALE_LABELS[loc] || loc}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
