"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslations, useLocale } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import { useGetLogsQuery } from "@/lib/services/logApi";
import type { RootState } from "@/lib/store";
import type { Log } from "@/types/log";

export default function LogsPage() {
  const t = useTranslations("logs");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [tableNameFilter, setTableNameFilter] = useState<string>("");

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const roleCode: string = (currentUser as any)?.role?.code || "";
  const isAdmin = roleCode === 'super_admin' || roleCode === 'admin';

  const { data, isLoading, isFetching } = useGetLogsQuery({
    page,
    limit,
    action: actionFilter || undefined,
    tableName: tableNameFilter || undefined,
    userId: isAdmin ? undefined : (currentUser?.id || undefined),
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
      return fullName || log.user.email || t("table.unknownUser");
    }
    return t("table.system");
  };

  const columns: Column<Log>[] = [
    {
      key: "action",
      header: t("table.columns.action"),
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
      header: t("table.columns.table"),
      render: (value) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "target_label",
      header: t("table.columns.target"),
      render: (value) => (
        <span className="text-sm text-gray-800 dark:text-gray-200">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "user",
      header: t("table.columns.user"),
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
      header: t("table.columns.company"),
      render: (_, row) => (
        <span className="text-sm">{getCompanyName(row)}</span>
      ),
    },
    {
      key: "created_at",
      header: t("table.columns.date"),
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value as string);
        return date.toLocaleDateString(locale, {
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
    <div>
      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("page.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("page.subtitle")}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                {t("filters.action")}
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">{t("filters.allActions")}</option>
                <option value="CREATE">CREATE</option>
                <option value="READ">READ</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                {t("filters.table")}
              </label>
              <input
                type="text"
                placeholder={t("filters.tablePlaceholder")}
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
          emptyMessage={t("table.emptyState")}
        />

        {data && data.pagination && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
              onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
