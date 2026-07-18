"use client";
import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

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
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (nextLocale: string) => {
    setIsOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t("language")}
        style={{ borderColor: "var(--border-strong)" }}
        className="relative flex items-center justify-center transition-colors border rounded-full h-11 w-11 text-gray-600 hover:text-gray-900 hover:bg-[var(--brand-soft)] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
            stroke="currentColor" strokeWidth="1.5"
          />
          <path d="M3 12H21M12 3C14.5 5.5 15.5 8.5 15.5 12C15.5 15.5 14.5 18.5 12 21C9.5 18.5 8.5 15.5 8.5 12C8.5 8.5 9.5 5.5 12 3Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute end-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50 dark:border-gray-800 dark:bg-gray-900">
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
        </div>
      )}
    </div>
  );
}
