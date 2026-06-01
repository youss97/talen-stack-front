/**
 * Gestion centralisée et traduction des erreurs API.
 *
 * Toute erreur (RTK Query, fetch, exception) passe par `getApiErrorMessage()`
 * qui renvoie TOUJOURS un message en français clair, jamais de jargon technique.
 */

// Codes applicatifs renvoyés par le filtre global backend → message FR
const CODE_MESSAGES: Record<string, string> = {
  DUPLICATE_ENTRY: "Cette valeur existe déjà. Veuillez en choisir une autre.",
  FOREIGN_KEY: "Cette opération est impossible car l'élément est lié à d'autres données.",
  REQUIRED_FIELD: "Un champ obligatoire est manquant.",
  CHECK_VIOLATION: "Une des valeurs saisies n'est pas valide.",
  INVALID_FORMAT: "Une des valeurs saisies a un format invalide.",
  NUMERIC_OVERFLOW: "Une valeur numérique saisie est trop grande.",
  VALUE_TOO_LONG: "Un texte saisi est trop long.",
  DB_ERROR: "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
  UNAUTHORIZED: "Votre session a expiré. Veuillez vous reconnecter.",
  FORBIDDEN: "Vous n'avez pas les droits nécessaires pour cette action.",
  NOT_FOUND: "L'élément demandé est introuvable.",
  CONFLICT: "Cette opération entre en conflit avec des données existantes.",
  TOO_MANY_REQUESTS: "Trop de requêtes. Veuillez patienter un instant.",
  INTERNAL_ERROR: "Une erreur inattendue est survenue. Veuillez réessayer.",
};

// Messages par statut HTTP (fallback si pas de code applicatif)
const STATUS_MESSAGES: Record<number, string> = {
  400: "La requête contient des données invalides.",
  401: "Votre session a expiré. Veuillez vous reconnecter.",
  403: "Vous n'avez pas les droits nécessaires pour cette action.",
  404: "L'élément demandé est introuvable.",
  409: "Cette opération entre en conflit avec des données existantes.",
  422: "Certains champs sont invalides ou manquants.",
  429: "Trop de requêtes. Veuillez patienter un instant.",
  500: "Une erreur serveur est survenue. Veuillez réessayer plus tard.",
  502: "Service temporairement indisponible. Veuillez réessayer.",
  503: "Service temporairement indisponible. Veuillez réessayer plus tard.",
  504: "Le serveur met trop de temps à répondre. Veuillez réessayer.",
};

// Motifs techniques (SQL/anglais/réseau) → remplacement FR
const PATTERN_TRANSLATIONS: { test: RegExp; message: string }[] = [
  { test: /duplicate key|already exists|unique constraint|UQ_/i, message: "Cette valeur existe déjà. Veuillez en choisir une autre." },
  { test: /foreign key|violates foreign/i, message: "Cette opération est impossible car l'élément est lié à d'autres données." },
  { test: /null value|not-null|violates not-null/i, message: "Un champ obligatoire est manquant." },
  { test: /numeric field overflow|out of range/i, message: "Une valeur numérique saisie est trop grande." },
  { test: /invalid input value for enum|invalid input syntax/i, message: "Une des valeurs saisies a un format invalide." },
  { test: /value too long/i, message: "Un texte saisi est trop long." },
  { test: /failed to fetch|network ?error|networkerror/i, message: "Connexion impossible. Vérifiez votre connexion internet." },
  { test: /timeout|timed out/i, message: "La requête a expiré. Veuillez réessayer." },
  { test: /cloudinary|upload failed/i, message: "Échec de l'envoi du fichier. Veuillez réessayer." },
  { test: /econnrefused|connect/i, message: "Service temporairement indisponible. Veuillez réessayer plus tard." },
  { test: /internal server error/i, message: "Une erreur serveur est survenue. Veuillez réessayer plus tard." },
  { test: /character varying = uuid|operator does not exist/i, message: "Une erreur technique est survenue. Veuillez réessayer." },
];

function isFrenchAndClean(msg: string): boolean {
  // Un message considéré "déjà bon" : assez court, sans jargon technique évident
  if (!msg || msg.length > 250) return false;
  const technical = /(QueryFailedError|undefined|null pointer|stack|at \w+\.|TypeError|\bSQL\b|relation ".*"|column ".*"|constraint|::|0x[0-9a-f]|\b[0-9a-f]{8}-[0-9a-f]{4}-)/i;
  return !technical.test(msg);
}

/**
 * Extrait et traduit un message d'erreur à partir de n'importe quel objet d'erreur :
 * - RTK Query error : { status, data: { message, code } }
 * - fetch/axios : { response: { status, data } }
 * - Error JS : { message }
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer.",
): string {
  if (!error) return fallback;

  // Erreur en string brute
  if (typeof error === "string") {
    return translateRaw(error) ?? (isFrenchAndClean(error) ? error : fallback);
  }

  const err = error as any;

  // RTK Query : status peut être un code HTTP, "FETCH_ERROR", "PARSING_ERROR", "TIMEOUT_ERROR"
  const rtkStatus = err.status ?? err.originalStatus;
  if (rtkStatus === "FETCH_ERROR")
    return "Connexion impossible. Vérifiez votre connexion internet.";
  if (rtkStatus === "TIMEOUT_ERROR")
    return "La requête a expiré. Veuillez réessayer.";
  if (rtkStatus === "PARSING_ERROR")
    return "Réponse inattendue du serveur. Veuillez réessayer.";

  // Données de l'erreur (data peut venir de RTK ou d'axios response.data)
  const data = err.data ?? err.response?.data ?? err;
  const httpStatus: number | undefined =
    typeof rtkStatus === "number"
      ? rtkStatus
      : err.response?.status ?? data?.statusCode;

  // 1. Code applicatif structuré (notre filtre backend)
  if (data?.code && CODE_MESSAGES[data.code]) {
    return CODE_MESSAGES[data.code];
  }

  // 2. Message renvoyé par le backend (déjà FR via le filtre global)
  const backendMsg: string | string[] | undefined = data?.message ?? err.message;
  if (backendMsg) {
    const msg = Array.isArray(backendMsg) ? backendMsg.join(". ") : backendMsg;
    // Le message du backend peut contenir un terme technique → tenter une traduction par motif
    const translated = translateRaw(msg);
    if (translated) return translated;
    if (isFrenchAndClean(msg)) return msg;
  }

  // 3. Fallback sur le statut HTTP
  if (httpStatus && STATUS_MESSAGES[httpStatus]) {
    return STATUS_MESSAGES[httpStatus];
  }

  return fallback;
}

/** Traduit un message brut s'il matche un motif technique connu. */
function translateRaw(msg: string): string | null {
  for (const { test, message } of PATTERN_TRANSLATIONS) {
    if (test.test(msg)) return message;
  }
  return null;
}

/**
 * Indique si une erreur RTK Query doit déclencher un toast automatique.
 * On ignore les 401 (gérés par le refresh token) et les annulations.
 */
export function shouldAutoToast(error: unknown): boolean {
  if (!error) return false;
  const err = error as any;
  const status = err.status ?? err.originalStatus;
  if (status === 401) return false; // géré par le refresh
  if (status === "FETCH_ERROR" && err.error?.name === "AbortError") return false;
  return true;
}
