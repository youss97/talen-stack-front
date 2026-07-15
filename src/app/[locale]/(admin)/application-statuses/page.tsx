"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import ApplicationStatusFormModal from "@/components/applicationStatus/ApplicationStatusFormModal";
import ApplicationStatusDetailModal from "@/components/applicationStatus/ApplicationStatusDetailModal";
import {
  useGetApplicationStatusesQuery,
  useLazyGetApplicationStatusByIdQuery,
  useCreateApplicationStatusMutation,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationStatusMutation,
} from "@/lib/services/applicationStatusApi";
import { useActions } from "@/hooks/useActions";
import type { ApplicationStatus } from "@/types/applicationStatus";
import type { ApplicationStatusFormData } from "@/validations/applicationStatusValidation";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function ApplicationStatusesPage() {
  const t = useTranslations("settings.applicationStatusesPage");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/application-statuses");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [detailStatus, setDetailStatus] = useState<ApplicationStatus | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: ApplicationStatus | null;
  }>({ isOpen: false, status: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message?: string
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const { data, isLoading, isFetching } = useGetApplicationStatusesQuery({
    page,
    limit: 5,
    search: search || undefined,
  });

  const [getApplicationStatusById, { isLoading: isLoadingDetail }] =
    useLazyGetApplicationStatusByIdQuery();
  const [createApplicationStatus, { isLoading: isCreating }] = useCreateApplicationStatusMutation();
  const [updateApplicationStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
  const [deleteApplicationStatus] = useDeleteApplicationStatusMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const columns: Column<ApplicationStatus>[] = [
    {
      key: "name",
      header: t("columns.name"),
      className: "font-medium",
    },
    {
      key: "description",
      header: t("columns.description"),
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "color",
      header: t("columns.color"),
      render: (value) => (
        value ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-700"
              style={{ backgroundColor: String(value) }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
          </div>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">-</span>
        )
      ),
    },
    {
      key: "display_order",
      header: t("columns.order"),
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value ?? "-"}
        </span>
      ),
    },
  ];

  const handleRowClick = async (status: ApplicationStatus) => {
    setIsDetailModalOpen(true);
    setDetailStatus(null);
    try {
      const result = await getApplicationStatusById(status.id).unwrap();
      setDetailStatus(result);
    } catch (error) {
      console.error("Error fetching application status details:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedStatus(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (status: ApplicationStatus) => {
    setIsFormModalOpen(true);
    setSelectedStatus(null);
    try {
      const result = await getApplicationStatusById(status.id).unwrap();
      setSelectedStatus(result);
    } catch (error) {
      console.error("Error fetching application status details:", error);
      addToast("error", tc("status.error"), t("toasts.loadDetailError"));
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteClick = (status: ApplicationStatus) => {
    setConfirmModal({ isOpen: true, status });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.status) return;

    setIsDeleting(true);
    try {
      await deleteApplicationStatus(confirmModal.status.id).unwrap();
      addToast("success", tc("status.success"), t("toasts.deleted"));
      setConfirmModal({ isOpen: false, status: null });
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.deleteError")));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: ApplicationStatusFormData) => {
    try {
      if (selectedStatus) {
        await updateApplicationStatus({
          id: selectedStatus.id,
          data,
        }).unwrap();
        addToast("success", tc("status.success"), t("toasts.updated"));
      } else {
        await createApplicationStatus(data).unwrap();
        addToast("success", tc("status.success"), t("toasts.created"));
      }
      setIsFormModalOpen(false);
      setSelectedStatus(null);
    } catch (error) {
      const defaultMsg = selectedStatus
        ? t("toasts.updateError")
        : t("toasts.createError");
      addToast("error", tc("status.error"), getErrorMessage(error, defaultMsg));
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              {t("addButton")}
            </Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          emptyMessage={t("emptyMessage")}
        />

        {data && data.pagination && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
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

      <ApplicationStatusFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStatus(null);
        }}
        onSubmit={handleFormSubmit}
        applicationStatus={selectedStatus}
        isLoading={isCreating || isUpdating || isLoadingDetail}
      />

      <ApplicationStatusDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailStatus(null);
        }}
        applicationStatus={detailStatus}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        message={t("deleteModal.message", { name: confirmModal.status?.name || "" })}
        confirmText={t("deleteModal.confirmText")}
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4.16667V15.8333M4.16667 10H15.8333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
