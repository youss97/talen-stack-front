"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import EmailFormModal from "@/components/email/EmailFormModal";
import EmailDetailModal from "@/components/email/EmailDetailModal";
import { useGetEmailsQuery, useDeleteEmailMutation, useSendEmailNowMutation, useCancelEmailScheduleMutation } from "@/lib/services/emailApi";
import { formatDateTime } from "@/utils/dateFormat";
import type { Email } from "@/types/email";
import { useModal } from "@/hooks/useModal";
import { useActions } from "@/hooks/useActions";
import { getApiErrorMessage } from "@/utils/errorMessages";

const EmailsPage = () => {
  const t = useTranslations("emails");
  const { canCreate, canDelete } = useActions("/emails");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    email: Email | null;
  }>({ isOpen: false, email: null });
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

  const { data, isLoading, refetch } = useGetEmailsQuery({
    page,
    limit,
    search,
    status: statusFilter,
  });

  const [deleteEmail] = useDeleteEmailMutation();
  const [sendEmailNow] = useSendEmailNowMutation();
  const [cancelEmailSchedule] = useCancelEmailScheduleMutation();

  const {
    isOpen: isFormOpen,
    openModal: openForm,
    closeModal: closeForm,
  } = useModal();

  const {
    isOpen: isDetailOpen,
    openModal: openDetail,
    closeModal: closeDetail,
  } = useModal();

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [editEmail, setEditEmail] = useState<Email | null>(null);

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleDelete = (email: Email) => {
    setConfirmModal({ isOpen: true, email });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.email) return;

    setIsDeleting(true);
    try {
      await deleteEmail(confirmModal.email.id).unwrap();
      addToast("success", t("toast.deleteSuccessTitle"), t("toast.deleteSuccessMessage"));
      setConfirmModal({ isOpen: false, email: null });
      refetch();
    } catch (error) {
      addToast("error", t("toast.deleteErrorTitle"), getErrorMessage(error, t("toast.deleteErrorMessage")));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    openDetail();
  };

  const handleEditEmail = (email: Email) => {
    setEditEmail(email);
    openForm();
  };

  const handleSendNow = async (email: Email) => {
    try {
      await sendEmailNow(email.id).unwrap();
      addToast("success", t("toast.sendSuccessTitle"), t("toast.sendSuccessMessage"));
      refetch();
    } catch (error) {
      addToast("error", t("toast.sendErrorTitle"), getErrorMessage(error, t("toast.sendErrorMessage")));
    }
  };

  const handleCancelSchedule = async (email: Email) => {
    try {
      await cancelEmailSchedule(email.id).unwrap();
      addToast("success", t("toast.cancelSuccessTitle"), t("toast.cancelSuccessMessage"));
      refetch();
    } catch (error) {
      addToast("error", t("toast.cancelErrorTitle"), getErrorMessage(error, t("toast.cancelErrorMessage")));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"; label: string }> = {
      draft: { color: "light", label: t("status.draft") },
      sent: { color: "success", label: t("status.sent") },
      failed: { color: "error", label: t("status.failed") },
      scheduled: { color: "warning", label: t("status.scheduled") },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const columns: Column<Email>[] = [
    {
      key: "sender",
      header: t("table.columns.sender"),
      render: (_, email) => (
        <div className="text-sm">
          <p className="font-medium">{email.sender.first_name} {email.sender.last_name}</p>
          <p className="text-gray-500 dark:text-gray-400">{email.sender.email}</p>
        </div>
      ),
    },
    {
      key: "recipients",
      header: t("table.columns.recipients"),
      render: (_, email) => (
        <div className="text-sm">
          <p className="font-medium">{t("table.recipientsCount", { count: email.total_recipients })}</p>
          <p className="text-gray-500 dark:text-gray-400">
            {t("table.sentFailedCount", { sent: email.sent_count, failed: email.failed_count })}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: t("table.columns.status"),
      render: (_, email) => getStatusBadge(email.status),
    },
    {
      key: "sent_at",
      header: t("table.columns.sentAt"),
      render: (_, email) => {
        if (email.status === "scheduled" && email.scheduled_at) {
          return (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              📅 {t("table.scheduledFor", { date: formatDateTime(email.scheduled_at) })}
            </span>
          );
        }
        if (email.status === "draft") {
          return <span className="text-sm text-gray-400">—</span>;
        }
        return <span className="text-sm">{formatDateTime(email.sent_at)}</span>;
      },
    },
    {
      key: "created_at",
      header: t("table.columns.createdAt"),
      render: (_, email) => (
        <span className="text-sm">
          {formatDateTime(email.created_at)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

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
          {canCreate && (
            <Button onClick={() => { setEditEmail(null); openForm(); }} startIcon={<PlusIcon />}>{t("page.newEmail")}</Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder={t("filters.searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">{t("filters.allStatuses")}</option>
                <option value="draft">{t("status.draft")}</option>
                <option value="sent">{t("status.sent")}</option>
                <option value="failed">{t("status.failed")}</option>
                <option value="scheduled">{t("status.scheduled")}</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onView={handleViewEmail}
          onDelete={canDelete ? handleDelete : undefined}
          customActions={[
            {
              label: t("actions.edit"),
              icon: <span>✏️</span>,
              color: "primary",
              onClick: handleEditEmail,
              hidden: (email) => email.status !== "draft",
            },
            {
              label: t("actions.sendNow"),
              icon: <span>📤</span>,
              color: "success",
              onClick: handleSendNow,
              hidden: (email) => email.status !== "draft" && email.status !== "scheduled",
            },
            {
              label: t("actions.cancelSchedule"),
              icon: <span>🚫</span>,
              color: "warning",
              onClick: handleCancelSchedule,
              hidden: (email) => email.status !== "scheduled",
            },
          ]}
          emptyMessage={t("table.emptyMessage")}
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

      <EmailFormModal
        isOpen={isFormOpen}
        editingEmail={editEmail}
        onClose={() => { closeForm(); setEditEmail(null); }}
        onSuccess={() => {
          refetch();
          closeForm();
          setEditEmail(null);
        }}
      />

      <EmailDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        email={selectedEmail}
      />


      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, email: null })}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        message={t("deleteModal.message", { subject: confirmModal.email?.subject || "" })}
        confirmText={t("deleteModal.confirmText")}
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

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

export default EmailsPage;
