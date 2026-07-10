/**
 * Traduction de secours pour les codes de statut internes (anglais) qui ne correspondent à
 * aucun statut configuré par la société (table application_statuses) — évite qu'un statut
 * brut type "in_progress"/"pending" s'affiche tel quel dans l'UI si la société n'a pas
 * (encore) configuré de statut portant exactement ce nom.
 */
const FALLBACK_STATUS_LABELS: Record<string, string> = {
  proposed: "Proposé",
  pending: "En attente",
  in_progress: "En cours",
  interview: "Entretien",
  qualified: "Qualifié",
  accepted: "Accepté",
  rejected: "Refusé",
  withdrawn: "Désisté",
  draft: "Brouillon",
  active: "Actif",
  archived: "Archivé",
  new: "Nouveau",
  reviewed: "Examiné",
  shortlisted: "Présélectionné",
  interviewed: "Interviewé",
  hired: "Embauché",
};

/**
 * Résout le libellé affichable d'un statut : priorité au nom configuré par la société
 * (liste `configuredStatuses`, matché par `name`), sinon la table de traduction de secours,
 * sinon la valeur brute telle quelle.
 */
export function resolveStatusLabel(
  status: string | undefined | null,
  configuredStatuses: Array<{ name: string }> = []
): string {
  if (!status) return "-";
  const configured = configuredStatuses.find((s) => s.name === status);
  if (configured) return configured.name;
  const key = status.toLowerCase().trim().replace(/\s+/g, "_");
  return FALLBACK_STATUS_LABELS[key] || status;
}
