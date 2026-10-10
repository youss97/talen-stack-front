"use client";
import { useMemo, useState } from "react";

type SortOrder = "ASC" | "DESC";

interface SortableColumn<T> {
  key: keyof T | string;
  sortable?: boolean;
  sortKey?: string;
}

/**
 * Tri des colonnes : côté serveur si la page fournit `onSort`, sinon côté client sur les lignes
 * affichées. Une colonne est triable par défaut, sauf si elle est marquée `sortable: false`.
 */
export function useTableSort<T>(
  columns: SortableColumn<T>[],
  data: T[],
  { sortBy, sortOrder, onSort }: { sortBy?: string; sortOrder?: SortOrder; onSort?: (key: string) => void },
) {
  const isServerSorted = !!onSort;
  const [localSort, setLocalSort] = useState<{ key: string; order: SortOrder } | null>(null);

  const effectiveSortKey = isServerSorted ? sortBy : localSort?.key;
  const effectiveSortOrder = isServerSorted ? sortOrder : localSort?.order;

  const isSortable = (column: SortableColumn<T>) => column.sortable ?? !isServerSorted;

  const handleSort = (columnSortKey: string) => {
    if (onSort) return onSort(columnSortKey);
    setLocalSort((prev) =>
      prev && prev.key === columnSortKey
        ? { key: columnSortKey, order: prev.order === "ASC" ? "DESC" : "ASC" }
        : { key: columnSortKey, order: "ASC" },
    );
  };

  const sortedData = useMemo(() => {
    if (isServerSorted || !localSort) return data;
    const column = columns.find((c) => (c.sortKey ?? String(c.key)) === localSort.key);
    if (!column) return data;
    const key = String(column.key);
    const direction = localSort.order === "ASC" ? 1 : -1;

    const getValue = (row: T): unknown => {
      let value: unknown = row;
      for (const k of key.split(".")) value = (value as Record<string, unknown>)?.[k];
      return value;
    };
    const isEmpty = (v: unknown) => v === null || v === undefined || v === "";
    const compare = (a: unknown, b: unknown): number => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
      const isoDate = /^\d{4}-\d{2}-\d{2}/;
      if (typeof a === "string" && typeof b === "string" && isoDate.test(a) && isoDate.test(b)) {
        return Date.parse(a) - Date.parse(b);
      }
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    };

    return [...data].sort((x, y) => {
      const a = getValue(x);
      const b = getValue(y);
      // Les valeurs vides restent en fin de liste, quel que soit le sens du tri
      if (isEmpty(a) || isEmpty(b)) {
        if (isEmpty(a) && isEmpty(b)) return 0;
        return isEmpty(a) ? 1 : -1;
      }
      return direction * compare(a, b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, columns, localSort, isServerSorted]);

  return { sortedData, effectiveSortKey, effectiveSortOrder, handleSort, isSortable, isServerSorted };
}
