import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { getApiErrorMessage, shouldAutoToast } from "@/utils/errorMessages";
import { emitErrorToast } from "@/utils/toastBus";

/**
 * Middleware global : affiche automatiquement un toast d'erreur traduit (FR)
 * pour toute MUTATION RTK Query qui échoue.
 *
 * - Ne s'applique qu'aux mutations (les queries échouées sont souvent gérées
 *   par l'UI elle-même : skeleton, message inline, retry...).
 * - Ignore les 401 (gérés par le refresh token) et les annulations.
 */
export const errorToastMiddleware: Middleware = () => (next) => (action: any) => {
  if (isRejectedWithValue(action)) {
    const isMutation = action.meta?.arg?.type === "mutation";
    const error = action.payload;

    if (isMutation && shouldAutoToast(error)) {
      const message = getApiErrorMessage(error);
      emitErrorToast(message);
    }
  }
  return next(action);
};
