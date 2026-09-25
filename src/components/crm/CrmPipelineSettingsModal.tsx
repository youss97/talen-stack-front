"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useGetCrmPipelineStagesQuery, useUpdateCrmPipelineStagesMutation } from "@/lib/services/crmApi";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { CrmPipelineStage } from "@/types/crm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrmPipelineSettingsModal({ isOpen, onClose }: Props) {
  const t = useTranslations("crm.pipelineSettings");
  const tc = useTranslations("common");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const { data, isLoading } = useGetCrmPipelineStagesQuery(undefined, { skip: !isOpen });
  const [updateStages, { isLoading: isSaving }] = useUpdateCrmPipelineStagesMutation();

  useEffect(() => {
    if (data) setStages([...data].sort((a, b) => a.order - b.order));
  }, [data]);

  const addStage = () => setStages((prev) => [...prev, { name: "", order: prev.length }]);
  const updateName = (i: number, name: string) => setStages((prev) => prev.map((s, idx) => (idx === i ? { ...s, name } : s)));
  const removeStage = (i: number) => setStages((prev) => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx })));
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= stages.length) return;
    setStages((prev) => {
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const handleSave = async () => {
    try {
      await updateStages(stages.filter((s) => s.name.trim())).unwrap();
      addToast("success", t("saved"));
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("saveError")));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t("title")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t("subtitle")}</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                  {i + 1}
                </span>
                <input
                  value={stage.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={t("stageNamePlaceholder")}
                  className="h-10 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === stages.length - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">↓</button>
                <button type="button" onClick={() => removeStage(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10">×</button>
              </div>
            ))}
            <button type="button" onClick={addStage} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              {t("addStage")}
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>{tc("actions.cancel")}</Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>{t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}
