/**
 * Ouverture / visualisation d'un CV DANS la plateforme sans le télécharger.
 *
 * Problème résolu : les fichiers Cloudinary `raw` (ou chemins locaux) servis avec
 * une URL brute déclenchent un TÉLÉCHARGEMENT binaire (icône « disque », sans extension).
 * L'endpoint backend `/cvs/:id/view` renvoie le fichier en `Content-Disposition: inline`
 * avec le bon Content-Type ; on le récupère en blob authentifié puis on l'affiche.
 */

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

/** Récupère le CV (inline) sous forme d'object URL blob. À révoquer après usage. */
export async function fetchCvBlobUrl(cvId: string): Promise<string | null> {
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/${cvId}/view`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

/** Ouvre le CV dans un nouvel onglet (affichage inline, jamais de téléchargement). */
export async function openCvInNewTab(cvId: string): Promise<boolean> {
  const url = await fetchCvBlobUrl(cvId);
  if (!url) return false;
  window.open(url, "_blank");
  // Révoquer plus tard (laisser le temps à l'onglet de charger le blob)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

/** Télécharge le CV avec un nom formaté (via l'endpoint `/download`). */
export async function downloadCvFile(cvId: string, fallbackName = "CV.pdf"): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/${cvId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
