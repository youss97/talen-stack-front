"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, Mail, Users, StickyNote, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { getApiErrorMessage } from "@/utils/errorMessages";
import {
  useGetCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useDeleteCrmActivityMutation,
} from "@/lib/services/crmApi";
import type { CrmActivityType } from "@/types/crm";

interface Props {
  crmCompanyId: string;
  crmDealId?: string;
}

const TYPE_ICONS: Record<CrmActivityType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
};

export default function CrmActivityTimeline({ crmCompanyId, crmDealId }: Props) {
  const t = useTranslations("crm.activities");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ type: CrmActivityType; summary: string; outcome: string }>({
    type: "call",
    summary: "",
    outcome: "",
  });

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((tt) => tt.id !== id));

  const { data: activities, isLoading } = useGetCrmActivitiesQuery({ crm_company_id: crmCompanyId, crm_deal_id: crmDealId });
  const [createActivity, { isLoading: isCreating }] = useCreateCrmActivityMutation();
  const [deleteActivity] = useDeleteCrmActivityMutation();

  const handleCreate = async () => {
    if (!form.summary.trim()) return;
    try {
      await createActivity({
        crm_company_id: crmCompanyId,
        crm_deal_id: crmDealId,
        type: form.type,
        summary: form.summary,
        outcome: form.outcome || undefined,
      }).unwrap();
      addToast("success", t("toasts.createSuccess"));
      setForm({ type: "call", summary: "", outcome: "" });
      setShowForm(false);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.createError")));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteActivity(id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

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
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CrmActivityType }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          >
            {(["call", "email", "meeting", "note"] as CrmActivityType[]).map((tp) => (
              <option key={tp} value={tp}>{t(`types.${tp}`)}</option>
            ))}
          </select>
          <textarea
            value={form.summary}
            onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            rows={2}
            placeholder={t("fields.summaryPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
          <textarea
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            rows={1}
            placeholder={t("fields.outcomePlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>{t("buttons.cancel")}</Button>
            <Button size="sm" onClick={handleCreate} disabled={isCreating || !form.summary.trim()}>{t("buttons.save")}</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (activities || []).length === 0 ? (
        <p className="text-sm text-gray-400">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {(activities || []).map((activity) => {
            const Icon = TYPE_ICONS[activity.type];
            return (
              <div key={activity.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-start gap-2.5">
                  <Icon size={15} strokeWidth={1.8} className="mt-0.5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-white/90">{activity.summary}</p>
                    {activity.outcome && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.outcome}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {t(`types.${activity.type}`)} · {new Date(activity.occurred_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDelete(activity.id)} className="shrink-0">
                  <Trash2 size={14} strokeWidth={1.8} className="text-gray-400 hover:text-error-500" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
