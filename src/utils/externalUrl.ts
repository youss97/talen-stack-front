/**
 * Rend un lien externe absolu : sans protocole, le navigateur le traite comme un chemin relatif
 * (ex. "linkedin.com/in/x" ouvrait le domaine de la plateforme).
 */
export function toExternalUrl(raw?: string | null): string | null {
  const value = (raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}
