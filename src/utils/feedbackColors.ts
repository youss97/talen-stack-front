/** Couleur de carte feedback selon le rôle de l'auteur — même code couleur partout (RH et espace client). */
export function getFeedbackCardColor(feedback: { created_by?: { role?: { code?: string } } } | null | undefined): string {
  const roleCode = feedback?.created_by?.role?.code;

  if (roleCode?.startsWith("CLIENT_MANAGER_")) {
    return "bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600";
  } else if (roleCode === "rh" || roleCode === "admin") {
    return "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600";
  } else {
    return "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600";
  }
}
