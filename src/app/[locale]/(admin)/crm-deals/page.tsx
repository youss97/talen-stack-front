"use client";
import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, Settings } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CrmDealFormModal from "@/components/crm/CrmDealFormModal";
import CrmDealDetailModal from "@/components/crm/CrmDealDetailModal";
import CrmPipelineSettingsModal from "@/components/crm/CrmPipelineSettingsModal";
import {
  useGetCrmDealsQuery,
  useGetCrmPipelineStagesQuery,
  useCreateCrmDealMutation,
  useUpdateCrmDealMutation,
  useDeleteCrmDealMutation,
  useCheckCrmTaskRemindersMutation,
} from "@/lib/services/crmApi";
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useActions } from "@/hooks/useActions";
import type { CrmDeal, CreateCrmDealRequest } from "@/types/crm";
import type { User } from "@/types/user";
import { getApiErrorMessage } from "@/utils/errorMessages";

type UserRecord = User & Record<string, unknown>;

export default function CrmDealsPage() {
  const t = useTranslations("crm.deals");
  const tc = useTranslations("common");
  const { canCreate, canDelete } = useActions("/crm-deals");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; deal: CrmDeal | null }>({ isOpen: false, deal: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState("");

  const addToast = useCallback((variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  }, []);
  const removeToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const { data: deals = [], isLoading } = useGetCrmDealsQuery({ status: "open" });
  const { data: stages = [] } = useGetCrmPipelineStagesQuery();
  const [createDeal, { isLoading: isCreating }] = useCreateCrmDealMutation();
  const [updateDeal] = useUpdateCrmDealMutation();
  const [deleteDeal] = useDeleteCrmDealMutation();
  const [checkTaskReminders] = useCheckCrmTaskRemindersMutation();

  useEffect(() => {
    checkTaskReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const filteredDeals = deals.filter((deal) => {
    if (search && !`${deal.title} ${deal.crmCompany?.name || ""}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (responsibleFilter && !(deal.responsible_ids || []).includes(responsibleFilter)) {
      return false;
    }
    return true;
  });

  const getErrorMessage = (error: unknown, defaultMessage: string): string => getApiErrorMessage(error, defaultMessage);

  const handleCreate = async (data: CreateCrmDealRequest) => {
    try {
      await createDeal(data).unwrap();
      addToast("success", t("toasts.createSuccess"));
      setIsFormOpen(false);
    } catch (error) {
      addToast("error", getErrorMessage(error, t("toasts.createError")));
    }
  };

  const handleMoveStage = async (deal: CrmDeal, stageName: string) => {
    try {
      await updateDeal({ id: deal.id, data: { current_stage: stageName } }).unwrap();
    } catch (error) {
      addToast("error", getErrorMessage(error, t("toasts.updateError")));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.deal) return;
    setIsDeleting(true);
    try {
      await deleteDeal(confirmModal.deal.id).unwrap();
      addToast("success", t("toasts.deleteSuccess"));
      setConfirmModal({ isOpen: false, deal: null });
    } catch (error) {
      addToast("error", getErrorMessage(error, t("toasts.deleteError")));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("list.title")}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("list.subtitle")}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} startIcon={<Settings size={16} strokeWidth={1.8} className="icon-glow" />}>
            {t("list.settingsButton")}
          </Button>
          {canCreate && (
            <Button onClick={() => setIsFormOpen(true)} startIcon={<Plus size={16} strokeWidth={1.8} className="icon-glow" />}>
              {t("list.addButton")}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t("list.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
          <InfiniteSelect<UserRecord>
            label=""
            value={responsibleFilter}
            onChange={(value) => setResponsibleFilter(value)}
            useInfiniteQuery={useGetUsersForSelectInfiniteQuery}
            itemValueKey="id"
            placeholder={t("list.allResponsibles")}
            getOptionLabel={(item) => `${(item.first_name as string) || ""} ${(item.last_name as string) || ""}`.trim()}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedStages.map((stage) => {
            const stageDeals = filteredDeals.filter((d) => d.current_stage === stage.name);
            return (
              <div key={stage.name} className="flex-shrink-0 w-72 rounded-2xl border border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{stage.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">{stageDeals.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {stageDeals.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">{t("list.noDeals")}</p>
                  )}
                  {stageDeals.map((deal) => (
                    <button
                      key={deal.id}
                      type="button"
                      onClick={() => setSelectedDealId(deal.id)}
                      className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{deal.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deal.crmCompany?.name}</p>
                      {deal.estimated_value != null && (
                        <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-1">
                          {deal.estimated_value.toLocaleString()} {deal.currency}
                        </p>
                      )}
                      <select
                        value={deal.current_stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); handleMoveStage(deal, e.target.value); }}
                        className="mt-2 w-full h-8 text-xs rounded-md border border-gray-200 dark:border-gray-700 dark:bg-gray-800 px-2"
                      >
                        {sortedStages.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CrmDealFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />

      <CrmDealDetailModal
        dealId={selectedDealId}
        isOpen={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
        onDeleteRequest={(deal) => setConfirmModal({ isOpen: true, deal })}
        canDelete={canDelete}
      />

      <CrmPipelineSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, deal: null })}
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
