"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
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
}: DataTableWithSelectionProps<T>) {
  const hasActionHandlers = onView || onEdit || onDelete || customActions;
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chargement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="border-collapse">
        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
          <TableRow>
            <TableCell
              isHeader
              className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 w-12"
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
            {columns.map((column) => (
              <TableCell
                key={String(column.key)}
                isHeader
                className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {column.header}
              </TableCell>
            ))}
            {(actions || hasActionHandlers) && (
              <TableCell
                isHeader
                className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
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
                className="px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                colSpan={columns.length + 2}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.id}
                className={`border-b border-gray-100 dark:border-gray-800 ${
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
                  return (
                    <TableCell
                      key={String(column.key)}
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
                    <div onClick={(e) => e.stopPropagation()}>
                      {actions ? (
                        actions(row)
                      ) : (
                        <div className="flex items-center gap-1">
                          {onView && (
                            <button
                              onClick={() => onView(row)}
                              className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <ViewIcon />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-2 text-gray-500 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <EditIcon />
                            </button>
                          )}
                          {customActions && customActions.map((action, index) => {
                            const colorClasses = {
                              default: "text-gray-500 hover:text-brand-500",
                              primary: "text-blue-500 hover:text-blue-600",
                              success: "text-green-500 hover:text-green-600",
                              warning: "text-orange-500 hover:text-orange-600",
                              error: "text-red-500 hover:text-red-600",
                            };
                            return (
                              <button
                                key={index}
                                onClick={() => action.onClick(row)}
                                className={`p-2 ${colorClasses[action.color || 'default']} hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors`}
                                title={action.label}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-2 text-gray-500 hover:text-error-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
export default DataTableWithSelection;

// Icons
function ViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.5 9C1.5 9 3.75 3.75 9 3.75C14.25 3.75 16.5 9 16.5 9C16.5 9 14.25 14.25 9 14.25C3.75 14.25 1.5 9 1.5 9Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.5 7.5L10.5 4.5M2.25 15.75L4.78312 15.4656C5.07382 15.4328 5.21917 15.4164 5.35519 15.3723C5.47596 15.3331 5.59123 15.2783 5.69827 15.209C5.81894 15.1309 5.92443 15.0254 6.13541 14.8144L15 6C15.8284 5.17157 15.8284 3.82843 15 3C14.1716 2.17157 12.8284 2.17157 12 3L3.13562 11.8644C2.92464 12.0754 2.81915 12.1809 2.74101 12.3015C2.67171 12.4086 2.61692 12.5238 2.57767 12.6446C2.53359 12.7806 2.51719 12.926 2.48438 13.2167L2.25 15.75Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.3537 14.6138C13.1317 15.0088 12.794 15.3265 12.3861 15.5241C11.9211 15.75 11.328 15.75 10.1419 15.75H7.85811C6.67198 15.75 6.07892 15.75 5.61387 15.5241C5.20596 15.3265 4.86828 15.0088 4.64631 14.6138C4.39426 14.165 4.35485 13.5732 4.27602 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3.75H15C15.8284 3.75 16.5 4.42157 16.5 5.25V12.75C16.5 13.5784 15.8284 14.25 15 14.25H3C2.17157 14.25 1.5 13.5784 1.5 12.75V5.25C1.5 4.42157 2.17157 3.75 3 3.75Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M16.5 5.25L9 10.125L1.5 5.25"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.25 3H3.75C2.92157 3 2.25 3.67157 2.25 4.5V15C2.25 15.8284 2.92157 16.5 3.75 16.5H14.25C15.0784 16.5 15.75 15.8284 15.75 15V4.5C15.75 3.67157 15.0784 3 14.25 3Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M12 1.5V4.5M6 1.5V4.5M2.25 7.5H15.75"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export { EmailIcon, CalendarIcon };