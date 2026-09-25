"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import { useLimitPreference } from "@/hooks/useLimitPreference";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CrmCompanyFormModal from "@/components/crm/CrmCompanyFormModal";
import CrmCompanyDetailModal from "@/components/crm/CrmCompanyDetailModal";
import {
  useGetCrmCompaniesQuery,
  useCreateCrmCompanyMutation,
  useUpdateCrmCompanyMutation,
  useDeleteCrmCompanyMutation,
} from "@/lib/services/crmApi";
import { useGetCrmIndustriesQuery } from "@/lib/services/crmIndustryApi";
import { useGetCrmLocationSuggestionsQuery } from "@/lib/services/crmApi";
import { LEAD_STATUSES, PIPELINE_STAGES, PRIORITIES } from "@/constants/crmProspecting";
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useActions } from "@/hooks/useActions";
import type { CrmCompany, CreateCrmCompanyRequest } from "@/types/crm";
import type { User } from "@/types/user";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { formatDate } from "@/utils/dateFormat";

type UserRecord = User & Record<string, unknown>;

const STAGE_COLORS: Record<string, "info" | "success" | "error"> = {
  prospect: "info",
  client: "success",
  perdu: "error",
};

const LEAD_STATUS_COLORS: Record<string, "info" | "success" | "error" | "warning"> = {
  Nouveau: "info",
  "À contacter": "warning",
  Contacté: "info",
  Qualifié: "warning",
  "RDV planifié": "warning",
  "Proposition envoyée": "warning",
  Gagné: "success",
  Perdu: "error",
};

const PRIORITY_COLORS: Record<string, "error" | "warning" | "info"> = {
  Haute: "error",
  Moyenne: "warning",
  Basse: "info",
};

export default function CrmCompaniesPage() {
  const t = useTranslations("crm.companies");
  const tc = useTranslations("common");
  const tp = useTranslations("crm.prospecting");
  const { canCreate, canUpdate, canDelete } = useActions("/crm-companies");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("crm-companies", 20);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [poleFilter, setPoleFilter] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<CrmCompany | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; company: CrmCompany | null }>({
    isOpen: false,
    company: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = useCallback(
    (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const { data, isLoading, isFetching } = useGetCrmCompaniesQuery({
    page,
    limit,
    search: search || undefined,
    stage: stageFilter || undefined,
    industry: industryFilter || undefined,
    responsible_id: responsibleFilter || undefined,
    lead_status: leadStatusFilter || undefined,
    priority: priorityFilter || undefined,
    pole: poleFilter || undefined,
  });
  const { data: locations } = useGetCrmLocationSuggestionsQuery();
  const { data: industriesData } = useGetCrmIndustriesQuery({ is_active: true, limit: 100 });

  const [createCompany, { isLoading: isCreating }] = useCreateCrmCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCrmCompanyMutation();
  const [deleteCompany] = useDeleteCrmCompanyMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleAddClick = () => {
    setEditingCompany(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (company: CrmCompany) => {
    setEditingCompany(company);
    setIsFormModalOpen(true);
  };

  const handleViewClick = (company: CrmCompany) => {
    setSelectedId(company.id);
    setIsDetailModalOpen(true);
  };

  const handleDeleteClick = (company: CrmCompany) => {
    setConfirmModal({ isOpen: true, company });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.company) return;
    setIsDeleting(true);
    try {
      await deleteCompany(confirmModal.company.id).unwrap();
      addToast("success", tc("status.success"), t("toasts.deleteSuccess"));
      setConfirmModal({ isOpen: false, company: null });
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.deleteError")));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData: CreateCrmCompanyRequest) => {
    try {
      if (editingCompany) {
        await updateCompany({ id: editingCompany.id, data: formData }).unwrap();
        addToast("success", tc("status.success"), t("toasts.updateSuccess"));
      } else {
        await createCompany(formData).unwrap();
        addToast("success", tc("status.success"), t("toasts.createSuccess"));
      }
      setIsFormModalOpen(false);
      setEditingCompany(null);
    } catch (error) {
      addToast(
        "error",
        tc("status.error"),
        getErrorMessage(error, editingCompany ? t("toasts.updateError") : t("toasts.createError"))
      );
    }
  };

  const columns: Column<CrmCompany>[] = [
    { key: "name", header: t("list.columns.name"), className: "font-medium" },
    { key: "industry", header: t("list.columns.industry"), render: (v) => (v as string) || "-" },
    { key: "pole", header: tp("matrix.pole"), render: (v) => (v as string) || "-" },
    {
      key: "lead_status",
      header: tp("fields.leadStatus"),
      render: (v) => {
        const item = LEAD_STATUSES.find((s) => s.value === v);
        return (
          <Badge color={LEAD_STATUS_COLORS[v as string] || "info"} variant="light" size="sm">
            {item ? tp(`leadStatus.${item.key}`) : (v as string) || "-"}
          </Badge>
        );
      },
    },
    {
      key: "pipeline_stage",
      header: tp("fields.pipelineStage"),
      render: (v) => {
        const item = PIPELINE_STAGES.find((s) => s.value === v);
        return <span className="text-sm">{item ? tp(`pipelineStage.${item.key}`) : (v as string) || "-"}</span>;
      },
    },
    {
      key: "priority",
      header: tp("fields.priority"),
      render: (v) => {
        const item = PRIORITIES.find((p) => p.value === v);
        return item ? (
          <Badge color={PRIORITY_COLORS[item.value]} variant="light" size="sm">{tp(`priority.${item.key}`)}</Badge>
        ) : <span>-</span>;
      },
    },
    {
      key: "next_action",
      header: tp("fields.nextAction"),
      render: (v, row) => {
        const action = v as string;
        const date = row.next_action_date as string | null | undefined;
        if (!action && !date) return <span>-</span>;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {action}{date ? ` · ${formatDate(date)}` : ""}
          </span>
        );
      },
    },
    {
      key: "stage",
      header: t("list.columns.stage"),
      render: (v) => (
        <Badge color={STAGE_COLORS[v as string] || "info"} variant="light" size="sm">
          {t(`list.stage.${v as string}`)}
        </Badge>
      ),
    },
    {
      key: "responsible",
      header: t("list.columns.responsible"),
      render: (_v, row) => {
        const r = row.responsible;
        return <span className="text-sm text-gray-700 dark:text-gray-300">{r ? `${r.first_name || ""} ${r.last_name || ""}`.trim() : "-"}</span>;
      },
    },
    {
      key: "creator",
      header: t("list.columns.createdBy"),
      render: (_v, row) => {
        const c = row.creator;
        return <span className="text-sm text-gray-700 dark:text-gray-300">{c ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : "-"}</span>;
      },
    },
    {
      key: "created_at",
      header: t("list.columns.createdAt"),
      render: (v) => <span className="text-sm">{v ? formatDate(v as string) : "-"}</span>,
    },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("list.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("list.subtitle")}</p>
        </div>
        {canCreate && (
          <Button onClick={handleAddClick} startIcon={<Plus size={16} strokeWidth={1.8} className="icon-glow" />}>
            {t("list.addButton")}
          </Button>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            <option value="">{t("list.allStages")}</option>
            <option value="prospect">{t("list.stage.prospect")}</option>
            <option value="client">{t("list.stage.client")}</option>
            <option value="perdu">{t("list.stage.perdu")}</option>
          </select>
          <select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            <option value="">{t("list.allIndustries")}</option>
            {(industriesData?.data || []).map((industry) => (
              <option key={industry.id} value={industry.name}>{industry.name}</option>
            ))}
          </select>
          <InfiniteSelect<UserRecord>
            label=""
            value={responsibleFilter}
            onChange={(value) => { setResponsibleFilter(value); setPage(1); }}
            useInfiniteQuery={useGetUsersForSelectInfiniteQuery}
            itemValueKey="id"
            placeholder={t("list.allResponsibles")}
            getOptionLabel={(item) => `${(item.first_name as string) || ""} ${(item.last_name as string) || ""}`.trim()}
          />
          <select
            value={leadStatusFilter}
            onChange={(e) => { setLeadStatusFilter(e.target.value); setPage(1); }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            <option value="">{tp("filters.allLeadStatuses")}</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{tp(`leadStatus.${s.key}`)}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            <option value="">{tp("filters.allPriorities")}</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{tp(`priority.${p.key}`)}</option>
            ))}
          </select>
          <select
            value={poleFilter}
            onChange={(e) => { setPoleFilter(e.target.value); setPage(1); }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            <option value="">{tp("filters.allPoles")}</option>
            {(locations?.poles || []).map((pole) => (
              <option key={pole} value={pole}>{pole}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        onView={handleViewClick}
        onEdit={canUpdate ? handleEditClick : undefined}
        onDelete={canDelete ? handleDeleteClick : undefined}
      />

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-5">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
            itemsPerPage={limit}
            onItemsPerPageChange={setLimit}
            totalItems={data.pagination.total}
          />
        </div>
      )}

      <CrmCompanyFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingCompany(null); }}
        onSubmit={handleFormSubmit}
        company={editingCompany}
        isLoading={isCreating || isUpdating}
      />

      <CrmCompanyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); setSelectedId(null); }}
        crmCompanyId={selectedId}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, company: null })}
        onConfirm={handleConfirmDelete}
        title={t("deleteConfirm.title")}
        message={t("deleteConfirm.message")}
        confirmText={tc("actions.delete")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
