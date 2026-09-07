import { useEffect, useState } from "react";

const STORAGE_PREFIX = "talentstack:limit:";

/**
 * Nombre de lignes par page mémorisé par tableau — même pattern que ThemeContext.tsx
 * (lecture localStorage au montage avec garde `isInitialized` pour éviter un mismatch
 * SSR/hydration, écriture à chaque changement). Une clé par page : changer la valeur sur
 * un tableau ne doit pas affecter les autres.
 */
export function useLimitPreference(pageKey: string, defaultValue: number) {
  const [limit, setLimitState] = useState(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${pageKey}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? parseInt(saved, 10) : NaN;
      if (!isNaN(parsed) && parsed > 0) {
        setLimitState(parsed);
      }
    } catch {
      // localStorage indisponible (navigation privée, etc.) — reste sur la valeur par défaut
    }
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setLimit = (value: number) => {
    setLimitState(value);
    if (isInitialized) {
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {
        // ignore — mémorisation best-effort uniquement
      }
    }
  };

  return [limit, setLimit] as const;
}
