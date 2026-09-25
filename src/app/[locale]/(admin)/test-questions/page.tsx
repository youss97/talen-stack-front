"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, ClipboardList } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import TestQuestionFormModal from "@/components/testQuestions/TestQuestionFormModal";
import {
  useGetTestQuestionsQuery,
  useGetTestQuestionCategoriesQuery,
  useCreateTestQuestionMutation,
  useUpdateTestQuestionMutation,
  useDeleteTestQuestionMutation,
} from "@/lib/services/testQuestionApi";
import { useLimitPreference } from "@/hooks/useLimitPreference";
import { useActions } from "@/hooks/useActions";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { TestQuestion, CreateTestQuestionRequest, TestQuestionType } from "@/types/testQuestion";

const TYPE_COLORS: Record<TestQuestionType, "info" | "success"> = {
  technique: "info",
  psychotechnique: "success",
};

export default function TestQuestionsPage() {
  const t = useTranslations("tests");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/test-questions");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("test-questions", 20);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; question: TestQuestion | null }>({ isOpen: false, question: null });

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((tt) => tt.id !== id));

  const { data, isLoading, isFetching } = useGetTestQuestionsQuery({
    page,
    limit,
    search: search || undefined,
    type: (typeFilter || undefined) as TestQuestionType | undefined,
    category: categoryFilter || undefined,
  });
  const { data: categories = [] } = useGetTestQuestionCategoriesQuery();
  const [createQuestion, { isLoading: isCreating }] = useCreateTestQuestionMutation();
  const [updateQuestion, { isLoading: isUpdating }] = useUpdateTestQuestionMutation();
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteTestQuestionMutation();

  const availableCategories = Array.from(new Set(categories.filter((c) => !typeFilter || c.type === typeFilter).map((c) => c.category))).sort();

  const handleSubmit = async (formData: CreateTestQuestionRequest) => {
    try {
      if (editingQuestion) {
        await updateQuestion({ id: editingQuestion.id, data: formData }).unwrap();
        addToast("success", t("toasts.updateSuccess"));
      } else {
        await createQuestion(formData).unwrap();
        addToast("success", t("toasts.createSuccess"));
      }
      setIsFormOpen(false);
      setEditingQuestion(null);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.saveError")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.question) return;
    try {
      await deleteQuestion(confirmModal.question.id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
      setConfirmModal({ isOpen: false, question: null });
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

  const columns: Column<TestQuestion>[] = [
    {
      key: "type",
      header: t("columns.type"),
      render: (value) => (
        <Badge color={TYPE_COLORS[value as TestQuestionType]} variant="light" size="sm">
          {t(`types.${value as string}`)}
        </Badge>
      ),
    },
    { key: "category", header: t("columns.category") },
    {
      key: "question",
      header: t("columns.question"),
      render: (value) => <span className="line-clamp-1 max-w-md">{value as string}</span>,
    },
    {
      key: "difficulty",
      header: t("columns.difficulty"),
      render: (value) => <span className="text-sm text-gray-500">{t(`difficulties.${value as string}`)}</span>,
    },
    {
      key: "is_active",
      header: t("columns.status"),
      render: (value) => (
        <Badge color={value ? "success" : "error"} variant="light" size="sm">
          {value ? t("status.active") : t("status.inactive")}
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
        icon={<ClipboardList size={20} strokeWidth={1.8} />}
        actions={
          canCreate && (
            <Button onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }}>
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
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCategoryFilter(""); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("page.allTypes")}</option>
          <option value="technique">{t("types.technique")}</option>
          <option value="psychotechnique">{t("types.psychotechnique")}</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        >
          <option value="">{t("page.allCategories")}</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <DataTable<TestQuestion>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading || isFetching}
        onEdit={canUpdate ? (row) => { setEditingQuestion(row); setIsFormOpen(true); } : undefined}
        onDelete={canDelete ? (row) => setConfirmModal({ isOpen: true, question: row }) : undefined}
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

      <TestQuestionFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingQuestion(null); }}
        onSubmit={handleSubmit}
        question={editingQuestion}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, question: null })}
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
