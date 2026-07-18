"use client";
import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useGetApplicationStatusesQuery, useCreateApplicationStatusMutation, useUpdateApplicationStatusMutation, useDeleteApplicationStatusMutation } from "@/lib/services/applicationStatusApi";
import DataTable from "@/components/tables/DataTable";
import type { Column } from "@/components/tables/DataTable";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { Modal } from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Pagination from "@/components/tables/Pagination";

interface ApplicationStatus {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function ApplicationStatusesPage() {
  const t = useTranslations("settings.applicationStatuses");
  const tc = useTranslations("common");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; status: ApplicationStatus | null }>({
    isOpen: false,
    status: null,
  });

  const { data, isLoading, refetch } = useGetApplicationStatusesQuery({ page, limit, search });
  const [createStatus, { isLoading: isCreating }] = useCreateApplicationStatusMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
  const [deleteStatus, { isLoading: isDeleting }] = useDeleteApplicationStatusMutation();

  const addToast = useCallback((variant: "success" | "error" | "warning" | "info", title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    is_active: true,
  });

  const handleOpenCreate = () => {
    setSelectedStatus(null);
    setFormData({ name: "", is_active: true });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (status: ApplicationStatus) => {
    setSelectedStatus(status);
    setFormData({
      name: status.name,
      is_active: status.is_active,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStatus) {
        await updateStatus({ id: selectedStatus.id, data: formData }).unwrap();
        addToast("success", tc("status.success"), t("toasts.updated"));
      } else {
        await createStatus(formData).unwrap();
        addToast("success", tc("status.success"), t("toasts.created"));
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error: any) {
      addToast("error", tc("status.error"), error?.data?.message || t("toasts.genericError"));
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.status) return;
    try {
      await deleteStatus(confirmModal.status.id).unwrap();
      addToast("success", tc("status.success"), t("toasts.deleted"));
      setConfirmModal({ isOpen: false, status: null });
      refetch();
    } catch (error: any) {
      addToast("error", tc("status.error"), error?.data?.message || t("toasts.deleteError"));
    }
  };

  const columns: Column<ApplicationStatus>[] = [
    {
      key: "name",
      header: t("columns.name"),
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "is_active",
      header: t("columns.status"),
      render: (value) => (
        <Badge variant="solid" color={value ? "success" : "light"}>
          {value ? t("active") : t("inactive")}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
          </div>
          <Button onClick={handleOpenCreate}>
            {t("createButton")}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(row) => setConfirmModal({ isOpen: true, status: row })}
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

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            {selectedStatus ? t("modal.editTitle") : t("modal.createTitle")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("modal.nameLabel")}</Label>
              <InputField
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                {t("modal.activeLabel")}
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)} type="button">
                {t("modal.cancel")}
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? t("modal.saving") : t("modal.save")}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={handleDelete}
        title={t("deleteModal.title")}
        message={t("deleteModal.message", { name: confirmModal.status?.name || "" })}
        confirmText={t("deleteModal.confirmText")}
        isLoading={isDeleting}
      />
    </>
  );
}
