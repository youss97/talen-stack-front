"use client";
import React, { useState, useCallback } from "react";
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
                <div className="flex flex-col items-center text-center text-sm text-gray-800 dark:text-gray-200">
                  {first && (first.render ? first.render(getValue(row, String(first.key)), row) : String(getValue(row, String(first.key)) ?? ""))}
                </div>
                {/* Autres colonnes en dessous */}
                <dl className="mt-4 w-full space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {rest.map((column) => {
                    const value = getValue(row, String(column.key));
                    return (
                      <div key={column.header} className="flex items-start justify-between gap-3 text-sm">
                        <dt className="text-gray-400 dark:text-gray-500 shrink-0">{column.header}</dt>
                        <dd className="text-right text-gray-700 dark:text-gray-200 min-w-0">
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
            {columns.map((column) => (
              <TableCell
                key={column.header}
                isHeader
                className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
              >
                {column.header}
              </TableCell>
            ))}
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
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.5 7.5L10.5 4.5M2.25 15.75L4.78312 15.4656C5.07382 15.4328 5.21917 15.4164 5.35519 15.3723C5.47596 15.3331 5.59123 15.2783 5.69827 15.209C5.81894 15.1309 5.92443 15.0254 6.13541 14.8144L15 6C15.8284 5.17157 15.8284 3.82843 15 3C14.1716 2.17157 12.8284 2.17157 12 3L3.13562 11.8644C2.92464 12.0754 2.81915 12.1809 2.74101 12.3015C2.67171 12.4086 2.61692 12.5238 2.57767 12.6446C2.53359 12.7806 2.51719 12.926 2.48438 13.2167L2.25 15.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.3537 14.6138C13.1317 15.0088 12.794 15.3265 12.3861 15.5241C11.9211 15.75 11.328 15.75 10.1419 15.75H7.85811C6.67198 15.75 6.07892 15.75 5.61387 15.5241C5.20596 15.3265 4.86828 15.0088 4.64631 14.6138C4.39426 14.165 4.35485 13.5732 4.27602 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
