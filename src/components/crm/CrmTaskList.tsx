"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Check } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { getApiErrorMessage } from "@/utils/errorMessages";
import {
  useGetCrmTasksQuery,
  useCreateCrmTaskMutation,
  useUpdateCrmTaskMutation,
  useDeleteCrmTaskMutation,
} from "@/lib/services/crmApi";

interface Props {
  crmCompanyId?: string;
  crmDealId?: string;
}

export default function CrmTaskList({ crmCompanyId, crmDealId }: Props) {
  const t = useTranslations("crm.tasks");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "" });

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((tt) => tt.id !== id));

  const { data: tasks, isLoading } = useGetCrmTasksQuery({ crm_company_id: crmCompanyId, crm_deal_id: crmDealId });
  const [createTask, { isLoading: isCreating }] = useCreateCrmTaskMutation();
  const [updateTask] = useUpdateCrmTaskMutation();
  const [deleteTask] = useDeleteCrmTaskMutation();

  const handleCreate = async () => {
    if (!form.title.trim() || !form.due_date) return;
    try {
      await createTask({ crm_company_id: crmCompanyId, crm_deal_id: crmDealId, title: form.title, due_date: form.due_date }).unwrap();
      addToast("success", t("toasts.createSuccess"));
      setForm({ title: "", due_date: "" });
      setShowForm(false);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.createError")));
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      await updateTask({ id, data: { status: "done" } }).unwrap();
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.updateError")));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("title")}</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          <Plus size={14} strokeWidth={1.8} />
          {t("addButton")}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
          <Input placeholder={t("fields.titlePlaceholder")} value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input type="date" value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{t("buttons.cancel")}</Button>
            <Button size="sm" onClick={handleCreate} disabled={isCreating || !form.title.trim() || !form.due_date}>{t("buttons.save")}</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (tasks || []).length === 0 ? (
        <p className="text-sm text-gray-400">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {(tasks || []).map((task) => {
            const isOverdue = task.status === "pending" && task.due_date < today;
            return (
              <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div>
                  <p className={`text-sm ${task.status === "done" ? "line-through text-gray-400" : "text-gray-800 dark:text-white/90"}`}>
                    {task.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${isOverdue ? "text-error-500" : "text-gray-400"}`}>
                    {task.due_date} {isOverdue && `· ${t("overdue")}`} {task.status !== "pending" && `· ${t(`status.${task.status}`)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {task.status === "pending" && (
                    <button type="button" onClick={() => handleMarkDone(task.id)} title={t("markDone")}>
                      <Check size={16} strokeWidth={1.8} className="text-gray-400 hover:text-success-500" />
                    </button>
                  )}
                  <button type="button" onClick={() => handleDelete(task.id)}>
                    <Trash2 size={14} strokeWidth={1.8} className="text-gray-400 hover:text-error-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
