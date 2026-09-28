"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useLimitPreference } from "@/hooks/useLimitPreference";
import { useGetAllPlatformClientsQuery } from "@/lib/services/clientApi";
import { useGetCompaniesInfiniteInfiniteQuery } from "@/lib/services/companyApi";
import type { Client } from "@/types/client";
import type { Company } from "@/types/company";
import { formatDate } from "@/utils/dateFormat";

// Vue plateforme (Super Admin) : tous les clients, toutes sociétés RH confondues, avec la
// société RH propriétaire de chaque client en évidence — cf. talent-backend GET /clients/platform.
export default function PlatformClientsPage() {
  const t = useTranslations("clients");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("platform-clients", 20);
  const [search, setSearch] = useState("");
  const [ownerCompanyId, setOwnerCompanyId] = useState("");

  const { data, isLoading, isFetching } = useGetAllPlatformClientsQuery({
    page,
    limit,
    search: search || undefined,
    ownerCompanyId: ownerCompanyId || undefined,
  });

  // Stable (mémorisé) pour éviter de relancer la requête infinie à chaque rendu
  const companyQueryArg = useMemo(() => ({ excludeClientCompanies: true }), []);

  const columns: Column<Client>[] = [
    { key: "name", header: t("platformList.columns.name"), className: "font-medium" },
    {
      key: "owner_company_name",
      header: t("platformList.columns.ownerCompany"),
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {(value as string) || "-"}
        </span>
      ),
    },
    { key: "contact_email", header: t("platformList.columns.email"), render: (v) => (v as string) || "-" },
    { key: "contact_phone", header: t("platformList.columns.phone"), render: (v) => (v as string) || "-" },
    { key: "ice", header: t("platformList.columns.ice"), render: (v) => (v as string) || "-" },
    { key: "address", header: t("platformList.columns.address"), render: (v) => (v as string) || "-" },
    { key: "city", header: t("platformList.columns.city"), render: (v) => (v as string) || "-" },
    { key: "country", header: t("platformList.columns.country"), render: (v) => (v as string) || "-" },
    { key: "industry", header: t("platformList.columns.industry"), render: (v) => (v as string) || "-" },
    { key: "source", header: t("platformList.columns.source"), render: (v) => (v as string) || "-" },
    {
      key: "status",
      header: t("platformList.columns.status"),
      render: (value) => {
        const map: Record<string, { label: string; color: "success" | "error" | "warning" }> = {
          active: { label: t("list.status.active"), color: "success" },
          inactive: { label: t("list.status.inactive"), color: "error" },
          deleted: { label: t("list.status.deleted"), color: "error" },
        };
        const { label, color } = map[value as string] ?? { label: String(value), color: "error" };
        return <Badge color={color} variant="light" size="sm">{label}</Badge>;
      },
    },
    {
      key: "created_at",
      header: t("platformList.columns.createdAt"),
      render: (v) => <span className="text-sm">{v ? formatDate(v as string) : "-"}</span>,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("platformList.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("platformList.subtitle")}</p>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder={t("platformList.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
          <InfiniteSelect<Company & Record<string, unknown>>
            label={null}
            value={ownerCompanyId}
            onChange={(value) => { setOwnerCompanyId(value); setPage(1); }}
            useInfiniteQuery={useGetCompaniesInfiniteInfiniteQuery}
            queryArg={companyQueryArg}
            itemLabelKey="name"
            itemValueKey="id"
            placeholder={t("platformList.filters.allCompanies")}
            emptyMessage={t("platformList.filters.noCompanyFound")}
          />
        </div>
      </div>

      <DataTable columns={columns} data={data?.data || []} isLoading={isLoading || isFetching} emptyMessage={t("platformList.emptyState")} />

      {data?.pagination && (
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
  );
}
