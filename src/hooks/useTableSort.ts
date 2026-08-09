import { useState, useCallback } from "react";

export type SortOrder = "ASC" | "DESC";

interface SortState {
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * Cycle de tri par colonne : ASC -> DESC -> annulé (retour au tri par défaut du backend)
 * à chaque clic sur la même colonne ; repart à ASC si on clique une autre colonne.
 */
export function useTableSort() {
  const [{ sortBy, sortOrder }, setState] = useState<SortState>({});

  const handleSort = useCallback((key: string) => {
    setState((prev) => {
      if (prev.sortBy !== key) return { sortBy: key, sortOrder: "ASC" };
      if (prev.sortOrder === "ASC") return { sortBy: key, sortOrder: "DESC" };
      return {};
    });
  }, []);

  return { sortBy, sortOrder, handleSort };
}
