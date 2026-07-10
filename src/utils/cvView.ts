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

/** Types que le navigateur sait afficher nativement dans un onglet (PDF, images). */
const isPreviewableMime = (mime: string) => mime === "application/pdf" || mime.startsWith("image/");

/**
 * Ouvre le CV dans un nouvel onglet si le navigateur peut l'afficher nativement (PDF, image).
 * Sinon (Word, etc. — aucun navigateur n'embarque de moteur de rendu Office), bascule sur un
 * téléchargement propre : un `window.open()` sur un blob non-PDF déclenche sinon un onglet vide
 * ou un téléchargement silencieux/déguisé selon le navigateur.
 */
export async function openCvInNewTab(cvId: string): Promise<boolean> {
  // Ouvrir l'onglet DE FAÇON SYNCHRONE, dans le même tick que le clic — un window.open()
  // appelé après un `await fetch(...)` a perdu son lien avec le geste utilisateur et se fait
  // silencieusement bloquer par le navigateur (onglet qui ne s'ouvre jamais, ou reste vide).
  // On navigue cette fenêtre déjà ouverte vers le blob une fois le fichier récupéré.
  const preOpenedWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/${cvId}/view`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      preOpenedWindow?.close();
      return false;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    if (isPreviewableMime(blob.type)) {
      if (preOpenedWindow) {
        preOpenedWindow.location.href = url;
      } else {
        // Popup bloqué même à l'ouverture synchrone (rare) : dernier recours
        window.open(url, "_blank");
      }
      // Révoquer plus tard (laisser le temps à l'onglet de charger le blob)
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    }

    // Pas de rendu navigateur possible pour ce format : téléchargement, pas de fenêtre à garder
    preOpenedWindow?.close();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const a = document.createElement("a");
    a.href = url;
    a.download = match?.[1] || "CV";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    preOpenedWindow?.close();
    return false;
  }
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
