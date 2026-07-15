"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CompanyFormModal from "@/components/company/CompanyFormModal";
import CompanyDetailModal from "@/components/company/CompanyDetailModal";
import {
  useGetCompaniesQuery,
  useLazyGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from "@/lib/services/companyApi";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useSetCompanyFeaturesMutation } from "@/lib/services/roleApi";
import { useAssignPlanToCompanyMutation, useRemoveCompanyPlanMutation } from "@/lib/services/subscriptionApi";
import { useActions } from "@/hooks/useActions";
import type { Company } from "@/types/company";
import type { CreateCompanyFormData } from "@/validations/companyValidation";
import { getApiErrorMessage } from "@/utils/errorMessages";

function RefreshIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

export default function CompaniesPage() {
  const t = useTranslations("companies");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/companies");
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; company: Company | null }>({
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
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const { data, isLoading, isFetching } = useGetCompaniesQuery({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [getCompanyById, { isLoading: isLoadingDetail }] = useLazyGetCompanyByIdQuery();
  const [createCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [isReactivating, setIsReactivating] = useState(false);
  const [quickTogglingId, setQuickTogglingId] = useState<string | null>(null);
  const [setCompanyFeatures] = useSetCompanyFeaturesMutation();
  const [assignPlanToCompany] = useAssignPlanToCompanyMutation();
  const [removeCompanyPlan] = useRemoveCompanyPlanMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const toggleCompanyStatus = async (company: Company) => {
    setQuickTogglingId(company.id);
    try {
      const formData = new FormData();
      const newStatus = company.status === "active" ? "inactive" : "active";
      formData.append("status", newStatus);
      await updateCompany({ id: company.id, data: formData }).unwrap();
      const msg = newStatus === "active"
        ? t("toasts.companyActivatedMessage", { name: company.name })
        : t("toasts.companyDeactivatedMessage", { name: company.name });
      addToast("success", newStatus === "active" ? t("toasts.companyActivatedTitle") : t("toasts.companyDeactivatedTitle"), msg);
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.statusUpdateError")));
    } finally {
      setQuickTogglingId(null);
    }
  };

  const handleReactivate = async (company: Company) => {
    setIsReactivating(true);
    try {
      const formData = new FormData();
      formData.append("status", "active");
      await updateCompany({ id: company.id, data: formData }).unwrap();
      addToast("success", t("toasts.reactivatedTitle"), t("toasts.reactivatedMessage", { name: company.name }));
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.reactivateError")));
    } finally {
      setIsReactivating(false);
    }
  };

  const columns: Column<Company>[] = [
    { key: "name", header: t("list.columns.name"), className: "font-medium" },
    { key: "siret", header: t("list.columns.siret") },
    { key: "city", header: t("list.columns.city") },
    { key: "email", header: t("list.columns.email") },
    { key: "phone", header: t("list.columns.phone") },
    {
      key: "status",
      header: t("list.columns.status"),
      render: (value) => {
        const statusMap: Record<string, { label: string; color: "success" | "error" | "warning" }> = {
          active: { label: t("list.status.active"), color: "success" },
          inactive: { label: t("list.status.inactive"), color: "error" },
          deleted: { label: t("list.status.deleted"), color: "error" },
        };
        const { label, color } = statusMap[value as string] ?? { label: String(value), color: "error" };
        return <Badge color={color} variant="light" size="sm">{label}</Badge>;
      },
    },
  ];

  const handleViewClick = async (company: Company) => {
    setIsViewModalOpen(true);
    setViewCompany(null);
    try {
      const result = await getCompanyById(company.id).unwrap();
      setViewCompany(result);
    } catch {
      console.error("Error fetching company details");
    }
  };

  const handleAddClick = () => {
    setSelectedCompany(null);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (company: Company) => {
    setFormError(null);
    setIsFormModalOpen(true);
    setSelectedCompany(null);
    try {
      const result = await getCompanyById(company.id).unwrap();
      setSelectedCompany(result);
    } catch {
      addToast("error", tc("status.error"), t("toasts.loadDetailError"));
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteClick = (company: Company) => {
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

  const handleFormSubmit = async (
    data: CreateCompanyFormData & { featureIds?: string[]; planId?: string }
  ) => {
    const { featureIds, planId, ...companyFormData } = data as typeof data & {
      featureIds?: string[];
      planId?: string;
    };

    try {
      if (selectedCompany) {
        // Mise à jour
        const { adminEmail, adminPassword, adminFirstName, adminLastName, adminPhoto, ...companyData } =
          companyFormData as typeof companyFormData & {
            adminEmail?: string; adminPassword?: string;
            adminFirstName?: string; adminLastName?: string; adminPhoto?: unknown;
          };

        const formData = new FormData();
        Object.keys(companyData).forEach((key) => {
          const value = (companyData as Record<string, unknown>)[key];
          if (value !== undefined && value !== null && value !== "") {
            if (key === "logo" && value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === "string" && key === "logo" && value.startsWith("http")) {
              formData.append("logo_url", value);
            } else if (typeof value !== "object") {
              formData.append(key, String(value));
            }
          }
        });

        await updateCompany({ id: selectedCompany.id, data: formData }).unwrap();

        // Plan ou features manuelles
        if (planId) {
          await assignPlanToCompany({ companyId: selectedCompany.id, planId }).unwrap();
        } else if (planId === "") {
          // Plan retiré explicitement — supprimer le plan et appliquer les features manuelles
          await removeCompanyPlan(selectedCompany.id).unwrap();
          if (featureIds !== undefined) {
            await setCompanyFeatures({ companyId: selectedCompany.id, featureIds }).unwrap();
          }
        } else if (featureIds !== undefined) {
          await setCompanyFeatures({ companyId: selectedCompany.id, featureIds }).unwrap();
        }

        addToast("success", tc("status.success"), t("toasts.updateSuccess"));
      } else {
        // Création
        const formData = new FormData();
        Object.keys(companyFormData).forEach((key) => {
          const value = (companyFormData as Record<string, unknown>)[key];
          if (value !== undefined && value !== null) {
            if ((key === "logo" || key === "adminPhoto") && value instanceof File) {
              formData.append(key, value);
            } else if (
              typeof value === "string" &&
              (key === "logo" || key === "adminPhoto") &&
              value.startsWith("http")
            ) {
              formData.append(`${key}_url`, value);
            } else if (typeof value !== "object") {
              formData.append(key, String(value));
            }
          }
        });

        const result = await createCompany(formData).unwrap();
        const companyId =
          (result as { company?: { id: string }; id?: string })?.company?.id ||
          (result as { id?: string })?.id;

        if (companyId) {
          if (planId) {
            // Assigner le plan → auto-sync des features
            await assignPlanToCompany({ companyId, planId }).unwrap();
          } else if (featureIds && featureIds.length > 0) {
            // Sélection manuelle
            await setCompanyFeatures({ companyId, featureIds }).unwrap();
          }
        }

        addToast("success", tc("status.success"), t("toasts.createSuccess"));
      }

      setIsFormModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      const defaultMsg = selectedCompany
        ? t("toasts.updateError")
        : t("toasts.createError");
      const msg = getErrorMessage(error, defaultMsg);
      setFormError(msg);
      addToast("error", tc("status.error"), msg);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("list.title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("list.subtitle")}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              {t("list.addButton")}
            </Button>
          )}
        </div>

        {/* Filtres */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder={t("list.searchPlaceholder")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            >
              <option value="">{t("list.allStatuses")}</option>
              <option value="active">{t("list.status.active")}</option>
              <option value="inactive">{t("list.status.inactive")}</option>
              <option value="deleted">{t("list.status.deleted")}</option>
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
          canDeleteRow={(row) => row.status === "active"}
          customActions={[
            {
              label: t("list.rowActions.deactivate"),
              icon: <LockIcon />,
              color: "warning",
              onClick: (row) => toggleCompanyStatus(row),
              hidden: (row) => row.status !== "active",
            },
            {
              label: t("list.rowActions.activate"),
              icon: <UnlockIcon />,
              color: "success",
              onClick: (row) => toggleCompanyStatus(row),
              hidden: (row) => row.status === "active",
            },
          ]}
          emptyMessage={t("list.emptyState")}
        />

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

      <CompanyFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setSelectedCompany(null); setFormError(null); }}
        onSubmit={handleFormSubmit}
        company={selectedCompany}
        isLoading={isCreating || isUpdating || isLoadingDetail}
        serverError={formError}
      />

      <CompanyDetailModal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setViewCompany(null); }}
        company={viewCompany}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, company: null })}
        onConfirm={handleConfirmDelete}
        title={t("list.deactivateModal.title")}
        message={t("list.deactivateModal.message", { name: confirmModal.company?.name || "" })}
        confirmText={t("list.deactivateModal.confirm")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}
