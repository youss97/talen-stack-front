"use client";
import React, { useState, useCallback } from "react";
import { Eye, Pencil, Trash2, Mail, CalendarDays, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
  id?: string;
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
  /** Colonne triable en cliquant sur son en-tête */
  sortable?: boolean;
  /** Clé envoyée au backend pour le tri, si différente de `key` */
  sortKey?: string;
}

export interface DataTableWithSelectionProps<T> {
  columns: Column<T>[];
  data: T[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (row: T) => void;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  }>;
  actions?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  useActionsMenu?: boolean; // Nouvelle prop pour forcer l'utilisation du menu
  enableViewToggle?: boolean;
  defaultView?: "table" | "cards";
  /** Tri par colonne (clé actuellement triée) */
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  /** Appelé avec `column.sortKey ?? column.key` au clic sur un en-tête triable */
  onSort?: (key: string) => void;
}

function DataTableWithSelection<T extends { id: string }>({
  columns,
  data,
  selectedItems,
  onSelectionChange,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  customActions,
  actions,
  isLoading = false,
  emptyMessage = "Aucune donnée disponible",
  useActionsMenu = true, // Par défaut, utiliser le menu d'actions
  enableViewToggle = true,
  defaultView = "table",
  sortBy,
  sortOrder,
  onSort,
}: DataTableWithSelectionProps<T>) {
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
      menuActions.push(...customActions.map(action => ({
        ...action,
        onClick: () => action.onClick(row),
      })));
    }

    if (onDelete) {
      menuActions.push({
        label: "Supprimer",
        icon: <TrashIcon />,
        onClick: () => onDelete(row),
        color: 'error' as const,
      });
    }

    return menuActions;
  }, [onView, onEdit, onDelete, customActions]);

  const getValue = (row: T, key: string): T[keyof T] => {
    const keys = key.split(".");
    let value: unknown = row;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return value as T[keyof T];
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };
  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length;

  const renderActions = (row: T) => (
    <div onClick={(e) => e.stopPropagation()}>
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
        <button onClick={() => setView("table")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "table" ? "bg-[var(--surface)] text-[var(--brand-deep)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}>Tableau</button>
        <button onClick={() => setView("cards")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === "cards" ? "bg-[var(--surface)] text-[var(--brand-deep)] shadow-sm" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}>Cartes</button>
      </div>
    </div>
  ) : null;

  if (isLoading) {
    return (
      <>
        {ViewToggle}
        <TableSkeleton columns={Math.min((columns.length || 5) + 1, 6)} />
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
            const selected = selectedItems.includes(row.id);
            return (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`relative flex flex-col items-center rounded-2xl border p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${selected ? "border-brand-300 bg-brand-50 dark:bg-brand-900/10" : "border-[color:var(--border)] bg-[var(--surface)]"} ${onRowClick ? "cursor-pointer" : ""}`}
              >
                <div className="absolute left-3 top-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected} onChange={(e) => handleSelectItem(row.id, e.target.checked)} className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                </div>
                {(actions || hasActionHandlers) && <div className="absolute right-3 top-3">{renderActions(row)}</div>}
                <div className="flex flex-col items-center text-center text-sm text-gray-800 dark:text-gray-200">
                  {first && (first.render ? first.render(getValue(row, String(first.key)), row) : String(getValue(row, String(first.key)) ?? ""))}
                </div>
                <dl className="mt-4 w-full space-y-2 border-t border-[color:var(--border)] pt-4">
                  {rest.map((column) => {
                    const value = getValue(row, String(column.key));
                    return (
                      <div key={(column as { id?: string }).id ?? String(column.key)} className="flex items-start justify-between gap-3 text-sm">
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
            <TableCell
              isHeader
              className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-12"
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
            </TableCell>
            {columns.map((column) => {
              const columnSortKey = column.sortKey ?? String(column.key);
              const isSorted = column.sortable && sortBy === columnSortKey;
              return (
                <TableCell
                  key={column.id ?? String(column.key)}
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
                colSpan={columns.length + 2}
              >
                <EmptyState title={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={`border-b border-[color:var(--border)] ${
                  selectedItems.includes(row.id)
                    ? "bg-brand-50 dark:bg-brand-900/10"
                    : ""
                } ${
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className="px-5 py-4 w-12">
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(row.id)}
                      onChange={(e) => handleSelectItem(row.id, e.target.checked)}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </div>
                </TableCell>
                {columns.map((column) => {
                  const value = getValue(row, String(column.key));
                  const columnKey = (column as any).id || String(column.key);
                  return (
                    <TableCell
                      key={columnKey}
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
export default DataTableWithSelection;

// Icons
function ViewIcon() {
  return <Eye size={18} strokeWidth={1.8} className="icon-glow" />;
}

function EditIcon() {
  return <Pencil size={18} strokeWidth={1.8} className="icon-glow" />;
}

function TrashIcon() {
  return <Trash2 size={18} strokeWidth={1.8} className="icon-glow" />;
}

function EmailIcon() {
  return <Mail size={18} strokeWidth={1.8} className="icon-glow" />;
}

function CalendarIcon() {
  return <CalendarDays size={18} strokeWidth={1.8} className="icon-glow" />;
}

export { EmailIcon, CalendarIcon };