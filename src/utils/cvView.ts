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
    // Révoquer avec un délai : le faire immédiatement après click() peut invalider l'URL avant
    // que le navigateur ait fini de lire le blob (surtout fichiers volumineux/connexion lente),
    // ce qui fait échouer le téléchargement de façon intermittente.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch {
    preOpenedWindow?.close();
    return false;
  }
}

/** Sections (et ordre) par défaut du CV anonymisé de l'entreprise + liste des sections disponibles */
export async function fetchAnonymizedSections(): Promise<{ available: string[]; sections: string[] } | null> {
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/settings/anonymized-sections`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export interface AnonymizedCvPayload {
  sections: string[];
  overrides: {
    profileTitle?: string;
    summary?: string;
    skills?: string[];
    quickFacts?: string;
    experiences?: Array<{ title?: string; company?: string; location?: string; start_date?: string; end_date?: string; description?: string }>;
    formations?: Array<{ degree?: string; field?: string; institution?: string; start_date?: string; end_date?: string }>;
    customBlocks?: Array<{ title?: string; text?: string }>;
  };
}

/** Génère le CV anonymisé personnalisé (aperçu) → URL blob à révoquer après usage, ou null en cas d'échec. */
export async function fetchCustomAnonymizedCvBlobUrl(
  cvId: string,
  payload: AnonymizedCvPayload,
): Promise<{ url: string; filename: string } | null> {
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/${cvId}/anonymized`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    // Nom fourni par le serveur : cv-anonymise-<code du CV>.pdf
    const match = (res.headers.get("Content-Disposition") || "").match(/filename="?([^"]+)"?/);
    return { url: URL.createObjectURL(await res.blob()), filename: match?.[1] || "cv-anonymise.pdf" };
  } catch {
    return null;
  }
}

export async function saveAnonymizedSections(sections: string[]): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/cvs/settings/anonymized-sections`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ sections }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ouvre le CV ANONYMISÉ (PDF généré à la volée, sans coordonnées ni nom du candidat) dans un
 * nouvel onglet — jamais de téléchargement, même logique de fenêtre pré-ouverte que
 * openCvInNewTab pour ne pas se faire bloquer par le navigateur.
 */
export async function openAnonymizedCvInNewTab(cvId: string, sections?: string[]): Promise<boolean> {
  const preOpenedWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;
  try {
    const token = getToken();
    const query = sections && sections.length ? `?sections=${encodeURIComponent(sections.join(","))}` : "";
    const res = await fetch(`${getApiUrl()}/cvs/${cvId}/anonymized${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      preOpenedWindow?.close();
      return false;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (preOpenedWindow) {
      preOpenedWindow.location.href = url;
    } else {
      window.open(url, "_blank");
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch {
    preOpenedWindow?.close();
    return false;
  }
}
