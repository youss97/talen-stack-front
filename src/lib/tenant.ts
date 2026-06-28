/**
 * Multi-tenant par sous-domaine (9) — CODE SEULEMENT (sans config DNS/hébergement).
 * Détecte le sous-domaine côté client pour adapter branding / portail public.
 */
const RESERVED = new Set(["www", "app", "api", "admin", "localhost"]);

export function getTenantSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;
  const parts = hostname.split(".");
  if (parts.length < 3) return null; // ex: entreprise.monats.com
  const sub = parts[0];
  if (RESERVED.has(sub)) return null;
  return sub;
}

/** True si l'app est servie sur un sous-domaine entreprise. */
export function isTenantSubdomain(): boolean {
  return getTenantSubdomain() !== null;
}
