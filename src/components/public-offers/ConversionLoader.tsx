"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ConversionLoaderProps {
  /** Affiche l'overlay quand true */
  active: boolean;
  /** true = terminé avec succès (coche verte sur toutes les étapes avant fermeture) */
  done?: boolean;
}

const STEP_ICONS = ["📄", "🗂️", "✅"];
const STEP_KEYS = ["extract", "save", "create"] as const;

/**
 * Overlay explicatif pendant la transformation d'une candidature publique.
 * Le backend fait le tout en une transaction ; on égrène les étapes visuellement
 * pour que l'utilisateur comprenne ce qui se passe (vivier -> candidature).
 */
export default function ConversionLoader({ active, done }: ConversionLoaderProps) {
  const t = useTranslations("publicOffers.conversion");
  const [current, setCurrent] = useState(0);
  const STEPS = STEP_KEYS.map((key, i) => ({ icon: STEP_ICONS[i], label: t(`steps.${key}`) }));

  useEffect(() => {
    if (!active) {
      setCurrent(0);
      return;
    }
    if (done) {
      setCurrent(STEPS.length); // toutes les étapes validées
      return;
    }
    // Avance étape par étape tant que la requête est en cours (boucle sur la dernière)
    const timer = setInterval(() => {
      setCurrent((c) => (c < STEPS.length - 1 ? c + 1 : c));
    }, 900);
    return () => clearInterval(timer);
  }, [active, done]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="gw-card w-full max-w-md p-6" style={{ background: "var(--surface)" }}>
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text)" }}>
          {t("title")}
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-2)" }}>
          {t("subtitle")}
        </p>

        <ul className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone = done ? true : i < current;
            const isActive = !done && i === current;
            return (
              <li key={i} className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{
                    background: isDone
                      ? "var(--brand-soft)"
                      : isActive
                        ? "var(--surface-2)"
                        : "var(--surface-2)",
                    border: `1px solid ${isDone ? "var(--brand)" : "var(--border)"}`,
                  }}
                >
                  {isDone ? (
                    <span style={{ color: "var(--brand-strong)" }}>✓</span>
                  ) : isActive ? (
                    <span className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: "var(--brand)", borderTopColor: "transparent" }} />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </span>
                <span
                  className="text-sm"
                  style={{
                    color: isDone || isActive ? "var(--text)" : "var(--text-3)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
