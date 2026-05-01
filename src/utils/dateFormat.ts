/**
 * Formate une date de manière sûre.
 * Retourne un texte par défaut si la date est nulle ou invalide.
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
  defaultText: string = "-"
): string {
  if (!date) return defaultText;

  try {
    // Normaliser les dates de type "YYYY-MM-DD" en ajoutant T00:00:00
    // pour éviter les décalages liés aux fuseaux horaires
    const raw =
      typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date + "T00:00:00"
        : date;

    const dateObj = typeof raw === "string" ? new Date(raw) : raw;

    if (isNaN(dateObj.getTime())) return defaultText;

    return dateObj.toLocaleDateString("fr-FR", options);
  } catch {
    return defaultText;
  }
}

/**
 * Formate une date avec l'heure de manière sûre
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  defaultText: string = "-"
): string {
  if (!date) return defaultText;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return defaultText;
    }

    return dateObj.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return defaultText;
  }
}
