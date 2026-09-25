"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Code2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import CodingChallengeFormModal from "@/components/testQuestions/CodingChallengeFormModal";
import {
  useGetCodingChallengesQuery,
  useCreateCodingChallengeMutation,
  useUpdateCodingChallengeMutation,
  useDeleteCodingChallengeMutation,
} from "@/lib/services/codingChallengeApi";
import { useLimitPreference } from "@/hooks/useLimitPreference";
import { useActions } from "@/hooks/useActions";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { CodingChallenge, CreateCodingChallengeRequest, CodingDomain } from "@/types/codingChallenge";

const DOMAIN_COLORS: Record<CodingDomain, "info" | "success" | "warning" | "error"> = {
  frontend: "info",
  backend: "success",
  fullstack: "warning",
  devops: "error",
};

export default function CodingChallengesPage() {
  const t = useTranslations("tests.coding");
  const tRoot = useTranslations("tests");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/coding-challenges");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("coding-challenges", 20);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<CodingChallenge | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; challenge: CodingChallenge | null }>({ isOpen: false, challenge: null });

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((tt) => tt.id !== id));

  const { data, isLoading, isFetching } = useGetCodingChallengesQuery({
    page,
    limit,
    search: search || undefined,
    domain: (domainFilter || undefined) as CodingDomain | undefined,
    difficulty: (difficultyFilter || undefined) as "easy" | "medium" | "hard" | undefined,
  });
  const [createChallenge, { isLoading: isCreating }] = useCreateCodingChallengeMutation();
  const [updateChallenge, { isLoading: isUpdating }] = useUpdateCodingChallengeMutation();
  const [deleteChallenge, { isLoading: isDeleting }] = useDeleteCodingChallengeMutation();

  const handleSubmit = async (formData: CreateCodingChallengeRequest) => {
    try {
      if (editingChallenge) {
        await updateChallenge({ id: editingChallenge.id, data: formData }).unwrap();
        addToast("success", t("toasts.updateSuccess"));
      } else {
        await createChallenge(formData).unwrap();
        addToast("success", t("toasts.createSuccess"));
      }
      setIsFormOpen(false);
      setEditingChallenge(null);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.saveError")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.challenge) return;
    try {
      await deleteChallenge(confirmModal.challenge.id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
      setConfirmModal({ isOpen: false, challenge: null });
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

  const columns: Column<CodingChallenge>[] = [
    {
      key: "domain",
      header: t("columns.domain"),
      render: (value) => (
        <Badge color={DOMAIN_COLORS[value as CodingDomain]} variant="light" size="sm">
          {tRoot(`domains.${value as string}`)}
        </Badge>
      ),
    },
    { key: "title", header: t("columns.title") },
    {
      key: "difficulty",
      header: t("columns.difficulty"),
      render: (value) => <span className="text-sm text-gray-500">{tRoot(`difficulties.${value as string}`)}</span>,
    },
    {
      key: "test_cases",
      header: t("columns.testCases"),
      render: (value) => <span className="text-sm text-gray-500">{(value as unknown[]).length}</span>,
    },
    {
      key: "is_active",
      header: t("columns.status"),
      render: (value) => (
        <Badge color={value ? "success" : "error"} variant="light" size="sm">
          {value ? tRoot("status.active") : tRoot("status.inactive")}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title={t("page.title")}
        description={t("page.subtitle")}
        icon={<Code2 size={20} strokeWidth={1.8} />}
        actions={
          canCreate && (
            <Button onClick={() => { setEditingChallenge(null); setIsFormOpen(true); }}>
              <Plus size={16} className="me-1.5" /> {t("page.addButton")}
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <input
          type="text"
          placeholder={t("page.searchPlaceholder")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-11 flex-1 min-w-[220px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        />
        <select
          value={domainFilter}
          onChange={(e) => { setDomainFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("page.allDomains")}</option>
          <option value="frontend">{tRoot("domains.frontend")}</option>
          <option value="backend">{tRoot("domains.backend")}</option>
          <option value="fullstack">{tRoot("domains.fullstack")}</option>
          <option value="devops">{tRoot("domains.devops")}</option>
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("page.allDifficulties")}</option>
          <option value="easy">{tRoot("difficulties.easy")}</option>
          <option value="medium">{tRoot("difficulties.medium")}</option>
          <option value="hard">{tRoot("difficulties.hard")}</option>
        </select>
      </div>

      <DataTable<CodingChallenge>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        onEdit={canUpdate ? (row) => { setEditingChallenge(row); setIsFormOpen(true); } : undefined}
        onDelete={canDelete ? (row) => setConfirmModal({ isOpen: true, challenge: row }) : undefined}
        emptyMessage={t("page.emptyState")}
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

      <CodingChallengeFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingChallenge(null); }}
        onSubmit={handleSubmit}
        challenge={editingChallenge}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, challenge: null })}
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
