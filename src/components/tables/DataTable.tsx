"use client";
import React, { useState, useCallback } from "react";
import { Eye, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import ActionsMenu from "./ActionsMenu";
import TableSkeleton from "@/components/common/TableSkeleton";
import EmptyState from "@/components/common/EmptyState";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
  /** Colonne triable en cliquant sur son en-tête */
  sortable?: boolean;
  /** Clé envoyée au backend pour le tri, si différente de `key` (ex: colonne affichant
   * une valeur imbriquée mais triable via une clé plate côté API) */
  sortKey?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  canDeleteRow?: (row: T) => boolean;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (row: T) => void;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    hidden?: (row: T) => boolean;
  }>;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  useActionsMenu?: boolean;
  /** Affiche la bascule Tableau / Cartes (défaut: true) */
  enableViewToggle?: boolean;
  /** Vue par défaut */
  defaultView?: "table" | "cards";
  /** Tri par colonne (clé actuellement triée) */
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  /** Appelé avec `column.sortKey ?? column.key` au clic sur un en-tête triable */
  onSort?: (key: string) => void;
}

function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  canDeleteRow,
  customActions,
  actions,
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  useActionsMenu = true,
  enableViewToggle = true,
  defaultView = "table",
  sortBy,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const hasActionHandlers = onView || onEdit || onDelete || customActions;
  const [view, setView] = useState<"table" | "cards">(defaultView);

  // Construire les actions pour le menu
  const buildActionsMenu = useCallback((row: T) => {
    const menuActions = [];

    if (onView) {
      menuActions.push({
        label: "Voir les détails",
        icon: <ViewIcon />,
        onClick: () => onView(row),
        color: 'default' as const,
      });
    }

    if (onEdit) {
      menuActions.push({
        label: "Modifier",
        icon: <EditIcon />,
        onClick: () => onEdit(row),
        color: 'default' as const,
      });
    }

    if (customActions) {
      menuActions.push(...customActions
        .filter(action => !action.hidden || !action.hidden(row))
        .map(action => ({
          label: action.label,
          icon: action.icon,
          color: action.color,
          onClick: () => action.onClick(row),
        })));
    }

    if (onDelete && (!canDeleteRow || canDeleteRow(row))) {
      menuActions.push({
        label: "Supprimer",
        icon: <TrashIcon />,
        onClick: () => onDelete(row),
        color: 'error' as const,
      });
    }

    return menuActions;
  }, [onView, onEdit, onDelete, canDeleteRow, customActions]);

  // Infobulle native sur les cellules texte tronquées : affiche la valeur brute complète au survol.
  const cellTitle = (value: unknown): string | undefined => {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
    return undefined;
  };

  const getValue = (row: T, key: string): T[keyof T] => {
    const keys = key.split(".");
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value as T[keyof T];
  };

  const renderActions = (row: T) => (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      {actions ? (
        actions(row)
      ) : useActionsMenu ? (
        <ActionsMenu actions={buildActionsMenu(row)} />
      ) : (
        <div className="flex items-center gap-1">
          {onView && (
            <button onClick={() => onView(row)} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Voir les détails"><ViewIcon /></button>
          )}
          {onEdit && (
            <button onClick={() => onEdit(row)} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Modifier"><EditIcon /></button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(row)} className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Supprimer"><TrashIcon /></button>
          )}
        </div>
      )}
    </div>
  );

  const ViewToggle = enableViewToggle ? (
    <div className="mb-3 flex justify-end">
      <div className="inline-flex rounded-lg border border-[color:var(--border)] p-0.5 bg-[var(--surface-2)]">
        <button
          onClick={() => setView("table")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "table" ? "bg-[var(--surface)] text-[var(--brand-deep)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
        >
          Tableau
        </button>
        <button
          onClick={() => setView("cards")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "cards" ? "bg-[var(--surface)] text-[var(--brand-deep)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
        >
          Cartes
        </button>
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <>
        {ViewToggle}
        <TableSkeleton columns={Math.min(columns.length || 5, 6)} />
      </>
    );
  }

  return (
    <>
    {ViewToggle}
    {view === "cards" ? (
      data.length === 0 ? (
        <div className="gw-card">
          <EmptyState title={emptyMessage} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.map((row) => {
            const [first, ...rest] = columns;
            return (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`relative flex flex-col items-center gw-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {(actions || hasActionHandlers) && (
                  <div className="absolute right-3 top-3">{renderActions(row)}</div>
                )}
                {/* 1ère colonne (photo/avatar + nom) en haut, centrée */}
                <div
                  className="flex flex-col items-center text-center text-sm text-gray-800 dark:text-gray-200"
                  title={first ? cellTitle(getValue(row, String(first.key))) : undefined}
                >
                  {first && (first.render ? first.render(getValue(row, String(first.key)), row) : String(getValue(row, String(first.key)) ?? ""))}
                </div>
                {/* Autres colonnes en dessous */}
                <dl className="mt-4 w-full space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {rest.map((column) => {
                    const value = getValue(row, String(column.key));
                    return (
                      <div key={column.header} className="flex items-start justify-between gap-3 text-sm">
                        <dt className="text-gray-400 dark:text-gray-500 shrink-0">{column.header}</dt>
                        <dd className="text-right text-gray-700 dark:text-gray-200 min-w-0" title={cellTitle(value)}>
                          {column.render ? column.render(value, row) : String(value ?? "")}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            );
          })}
        </div>
      )
    ) : (
    <div className="w-full overflow-x-auto gw-card">
    <div className="inline-block min-w-full align-middle">
      <Table className="border-collapse min-w-full">
        <TableHeader className="border-b border-[color:var(--border)] bg-[var(--surface-2)]">
          <TableRow>
            {columns.map((column) => {
              const columnSortKey = column.sortKey ?? String(column.key);
              const isSorted = column.sortable && sortBy === columnSortKey;
              return (
                <TableCell
                  key={column.header}
                  isHeader
                  className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${
                    column.sortable ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200" : ""
                  }`}
                  onClick={column.sortable ? () => onSort?.(columnSortKey) : undefined}
                >
                  {column.sortable ? (
                    <span className="inline-flex items-center gap-1">
                      {column.header}
                      {isSorted && sortOrder === "ASC" ? (
                        <ArrowUp size={14} strokeWidth={1.8} />
                      ) : isSorted && sortOrder === "DESC" ? (
                        <ArrowDown size={14} strokeWidth={1.8} />
                      ) : (
                        <ArrowUpDown size={14} strokeWidth={1.8} className="opacity-40" />
                      )}
                    </span>
                  ) : (
                    column.header
                  )}
                </TableCell>
              );
            })}
            {(actions || hasActionHandlers) && (
              <TableCell
                isHeader
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-5 py-4"
                colSpan={columns.length + (actions || hasActionHandlers ? 1 : 0)}
              >
                <EmptyState title={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={`border-b border-[color:var(--border)] ${
                  onRowClick
                    ? "cursor-pointer hover:bg-[var(--brand-soft)]/50 transition-colors"
                    : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => {
                  const value = getValue(row, String(column.key));
                  return (
                    <TableCell
                      key={column.header}
                      title={cellTitle(value)}
                      className={`px-5 py-4 text-sm text-gray-800 dark:text-gray-200 ${
                        column.className || ""
                      }`}
                    >
                      {column.render ? column.render(value, row) : String(value ?? "")}
                    </TableCell>
                  );
                })}
                {(actions || hasActionHandlers) && (
                  <TableCell className="px-5 py-4">
                    {renderActions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    </div>
    )}
    </>
  );
}

export default DataTable;

function ViewIcon() {
  return <Eye size={18} strokeWidth={1.8} className="icon-glow" />;
}

function EditIcon() {
  return <Pencil size={18} strokeWidth={1.8} className="icon-glow" />;
}

function TrashIcon() {
  return <Trash2 size={18} strokeWidth={1.8} className="icon-glow" />;
}
