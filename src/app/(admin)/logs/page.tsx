"use client";
import { useState } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { useGetLogsQuery } from "@/lib/services/logApi";
import type { Log } from "@/types/log";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [tableNameFilter, setTableNameFilter] = useState<string>("");

  const { data, isLoading, isFetching } = useGetLogsQuery({
    page,
    limit: 5,
    action: actionFilter || undefined,
    tableName: tableNameFilter || undefined,
  });

  const getActionColor = (action?: string) => {
    switch (action?.toUpperCase()) {
      case "CREATE":
        return "success";
      case "UPDATE":
        return "info";
      case "DELETE":
        return "error";
      case "READ":
        return "warning";
      default:
        return "light";
    }
  };

  const getCompanyName = (log: Log): string => {
    // Try to get company name from new_values
    if (log.new_values && typeof log.new_values === "object") {
      const newValues = log.new_values as Record<string, unknown>;
      if (newValues.company && typeof newValues.company === "object") {
        const company = newValues.company as { name?: string };
        if (company.name) return company.name;
      }
    }
    // Try to get from user
    if (log.user?.company?.name) {
      return log.user.company.name;
    }
    return "-";
  };

  const getUserName = (log: Log): string => {
    if (log.user) {
      const fullName = `${log.user.first_name} ${log.user.last_name}`.trim();
      return fullName || log.user.email || "Utilisateur inconnu";
    }
    
    // Si pas d'utilisateur, essayer d'extraire des informations depuis new_values
    if (log.new_values && typeof log.new_values === 'object') {
      const newValues = log.new_values as Record<string, unknown>;
      
      // Si c'est une création d'utilisateur, utiliser les données créées
      if (log.table_name === 'users' && log.action === 'CREATE') {
        const firstName = newValues.first_name as string;
        const lastName = newValues.last_name as string;
        const email = newValues.email as string;
        
        if (firstName && lastName) {
          return `${firstName} ${lastName}`;
        } else if (email) {
          return email;
        }
      }
    }
    
    return "Système";
  };

  const columns: Column<Log>[] = [
    {
      key: "action",
      header: "Action",
      render: (value) => (
        <Badge
          color={getActionColor(value as string) as "success" | "error" | "info" | "warning" | "light"}
          variant="light"
          size="sm"
        >
          {(value as string) || "-"}
        </Badge>
      ),
    },
    {
      key: "table_name",
      header: "Table",
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "user",
      header: "Utilisateur",
      render: (_, row) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {getUserName(row)}
          </div>
          {row.user?.email && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.user.email}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "new_values",
      header: "Entreprise",
      render: (_, row) => (
        <span className="text-sm">{getCompanyName(row)}</span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value as string);
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Logs d'audit
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Consultez les logs système
            </p>
          </div>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                Action
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Toutes les actions</option>
                <option value="CREATE">CREATE</option>
                <option value="READ">READ</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                Table
              </label>
              <input
                type="text"
                placeholder="Filtrer par table..."
                value={tableNameFilter}
                onChange={(e) => {
                  setTableNameFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          emptyMessage="Aucun log trouvé"
        />

        {data && data.pagination && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
