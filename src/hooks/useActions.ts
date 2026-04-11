"use client";

import { usePermissions } from "./usePermissions";

/**
 * Hook pour vérifier les actions disponibles sur une page
 * Similaire à l'ancien projet React
 */
export function useActions(path: string) {
  const { getActionsForPath, canDoAction } = usePermissions();
  
  const actions = getActionsForPath(path);
  const actionCodes = actions.map((action) => action.code);

  return {
    canCreate: actionCodes.some((code) => code.toLowerCase().includes("create")),
    canRead: actionCodes.some((code) => code.toLowerCase().includes("read")),
    canUpdate: actionCodes.some((code) => code.toLowerCase().includes("update")),
    canDelete: actionCodes.some((code) => code.toLowerCase().includes("delete")),
    canDoAction,
    actions,
    actionCodes,
  };
}
