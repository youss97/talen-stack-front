"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ClipboardCheck, Copy, Check, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import PrepareTestModal from "@/components/testQuestions/PrepareTestModal";
import TestSessionDetailModal from "@/components/testQuestions/TestSessionDetailModal";
import { useGetTestSessionsQuery, useDeleteTestSessionMutation } from "@/lib/services/testSessionApi";
import { useLimitPreference } from "@/hooks/useLimitPreference";
import { useActions } from "@/hooks/useActions";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { TestSession, TestSessionStatus, TestSessionType } from "@/types/testSession";

const STATUS_COLORS: Record<TestSessionStatus, "info" | "warning" | "success" | "error"> = {
  pending: "info",
  in_progress: "warning",
  completed: "success",
  expired: "error",
};

export default function TestSessionsPage() {
  const t = useTranslations("tests.sessions");
  const tc = useTranslations("common");
  const { canCreate, canDelete } = useActions("/test-sessions");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("test-sessions", 20);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; session: TestSession | null }>({ isOpen: false, session: null });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [detailSessionId, setDetailSessionId] = useState<string | null>(null);

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((tt) => tt.id !== id));

  const { data, isLoading, isFetching } = useGetTestSessionsQuery({
    page,
    limit,
    search: search || undefined,
    status: (statusFilter || undefined) as TestSessionStatus | undefined,
    type: (typeFilter || undefined) as TestSessionType | undefined,
  });
  const [deleteSession, { isLoading: isDeleting }] = useDeleteTestSessionMutation();

  const handleCopyLink = (session: TestSession) => {
    navigator.clipboard.writeText(session.publicLink);
    setCopiedId(session.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.session) return;
    try {
      await deleteSession(confirmModal.session.id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
      setConfirmModal({ isOpen: false, session: null });
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

  const columns: Column<TestSession>[] = [
    {
      key: "candidate_first_name",
      header: t("columns.candidate"),
      render: (_v, row) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-white">{row.candidate_first_name} {row.candidate_last_name}</p>
          <p className="text-xs text-gray-400">{row.candidate_email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: t("columns.type"),
      render: (value) => <span className="text-sm">{t(`types.${value as string}`)}</span>,
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (value) => (
        <Badge color={STATUS_COLORS[value as TestSessionStatus]} variant="light" size="sm">
          {t(`statuses.${value as string}`)}
        </Badge>
      ),
    },
    {
      key: "score",
      header: t("columns.score"),
      render: (value, row) => (
        <span className="inline-flex items-center gap-1.5">
          {value != null ? <span className="font-semibold">{value as number}%</span> : <span className="text-gray-400">—</span>}
          {row.cheating_detected && (
            <span title={t("cheatingDetected")}>
              <AlertTriangle size={14} className="text-error-500" />
            </span>
          )}
        </span>
      ),
    },
    {
      key: "publicLink",
      header: t("columns.link"),
      render: (_v, row) => (
        <button
          type="button"
          onClick={() => handleCopyLink(row)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          {copiedId === row.id ? <Check size={14} /> : <Copy size={14} />}
          {copiedId === row.id ? t("copied") : t("copyLink")}
        </button>
      ),
    },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        icon={<ClipboardCheck size={20} strokeWidth={1.8} />}
        actions={
          canCreate && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus size={16} className="me-1.5" /> {t("addButton")}
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-11 flex-1 min-w-[220px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("allStatuses")}</option>
          <option value="pending">{t("statuses.pending")}</option>
          <option value="in_progress">{t("statuses.in_progress")}</option>
          <option value="completed">{t("statuses.completed")}</option>
          <option value="expired">{t("statuses.expired")}</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("allTypes")}</option>
          <option value="both">{t("types.both")}</option>
          <option value="technique">{t("types.technique")}</option>
          <option value="psychotechnique">{t("types.psychotechnique")}</option>
        </select>
      </div>

      <DataTable<TestSession>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        onView={(row) => setDetailSessionId(row.id)}
        onDelete={canDelete ? (row) => setConfirmModal({ isOpen: true, session: row }) : undefined}
        emptyMessage={t("emptyState")}
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

      <PrepareTestModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <TestSessionDetailModal
        isOpen={!!detailSessionId}
        onClose={() => setDetailSessionId(null)}
        sessionId={detailSessionId}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, session: null })}
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
