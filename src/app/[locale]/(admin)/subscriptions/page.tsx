"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import SubscriptionPlanModal from "@/components/subscription/SubscriptionPlanModal";
import {
  useGetSubscriptionPlansQuery,
  useDeleteSubscriptionPlanMutation,
} from "@/lib/services/subscriptionApi";
import { useGetFeaturesQuery } from "@/lib/services/roleApi";
import { featureIcon, featureLabel } from "@/utils/featureLabels";
import type { SubscriptionPlan } from "@/types/subscription";
import { useGetSubscriptionsStatsQuery } from "@/lib/services/statsApi";
import dynamic from "next/dynamic";

const SubscriptionCharts = dynamic(() => import("@/components/dashboard/SubscriptionCharts"), { ssr: false });

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionPlan | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { data: plans = [], isLoading } = useGetSubscriptionPlansQuery();
  const { data: allFeatures = [] } = useGetFeaturesQuery();
  const [deletePlan, { isLoading: isDeleting }] = useDeleteSubscriptionPlanMutation();
  const { data: subStats, isLoading: isLoadingStats } = useGetSubscriptionsStatsQuery();

  const addToast = useCallback((variant: "success" | "error", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deletePlan(confirmDelete.id).unwrap();
      addToast("success", t("toast.deletedTitle"), t("toast.deletedMessage", { name: confirmDelete.name }));
    } catch {
      addToast("error", t("toast.deleteErrorTitle"), t("toast.deleteErrorMessage"));
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="text-2xl">📦</span> {t("page.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("page.subtitle")}
          </p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }} startIcon={<PlusIcon />}>
          {t("page.newPlan")}
        </Button>
      </div>

      {/* ── Dashboard Abonnements ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: t("stats.availablePlans"), value: subStats?.totalPlans, icon: "📦", color: "bg-brand-50 dark:bg-brand-500/10" },
          { label: t("stats.subscribedCompanies"), value: subStats?.totalSubscribed, icon: "🏢", color: "bg-blue-50 dark:bg-blue-500/10" },
          { label: t("stats.activePlans"), value: subStats?.plansDistribution.filter(p => p.companyCount > 0).length, icon: "✅", color: "bg-green-50 dark:bg-green-500/10" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${card.color}`}>{card.icon}</div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {isLoadingStats ? <span className="inline-block w-10 h-6 bg-gray-200 rounded animate-pulse" /> : (card.value ?? 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts abonnements + consommation API */}
      {subStats && <SubscriptionCharts stats={subStats} />}

      {/* Plans list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{t("emptyState.title")}</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">{t("emptyState.subtitle")}</p>
          <Button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}>{t("emptyState.cta")}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => { setEditingPlan(plan); setIsModalOpen(true); }}
              onDelete={() => setConfirmDelete(plan)}
            />
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      <SubscriptionPlanModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPlan(null); }}
        plan={editingPlan}
        allFeatures={allFeatures}
        onSaved={(msg) => addToast("success", t("toast.savedTitle"), msg)}
        onError={(msg) => addToast("error", t("toast.deleteErrorTitle"), msg)}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={t("deleteModal.title")}
        message={t("deleteModal.message", { name: confirmDelete?.name || "" })}
        confirmText={tc("actions.delete")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("subscriptions");
  const tc = useTranslations("common");
  const features = plan.planFeatures?.map((pf) => pf.feature).filter(Boolean) || [];
  const billingLabels: Record<string, string> = {
    monthly: t("billing.monthly"),
    annual: t("billing.annual"),
    one_time: t("billing.one_time"),
  };

  return (
    <div className={`relative rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
      plan.is_active
        ? "border-brand-200 bg-white dark:border-brand-800 dark:bg-gray-900 shadow-sm"
        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30 opacity-70"
    }`}>
      {/* Badge statut */}
      <span className={`absolute top-4 end-4 text-xs font-medium px-2 py-0.5 rounded-full ${
        plan.is_active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}>
        {plan.is_active ? t("status.active") : t("status.inactive")}
      </span>

      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white pe-16">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{plan.description}</p>
        )}
      </div>

      {/* Prix */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {Number(plan.price).toFixed(2)}
        </span>
        <span className="text-sm text-gray-400">{plan.currency || "MAD"}</span>
        <span className="text-xs text-gray-400">/ {billingLabels[plan.billing_cycle] || plan.billing_cycle}</span>
      </div>

      {/* Features incluses */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {t("card.modules", { count: features.length })}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
              <span>{featureIcon(f.name)}</span>
              {featureLabel(f)}
            </span>
          ))}
          {features.length === 0 && (
            <span className="text-xs text-gray-400 italic">{t("card.noModuleSelected")}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg border border-brand-200 bg-brand-50 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400 transition-colors"
        >
          {tc("actions.edit")}
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 transition-colors"
        >
          {tc("actions.delete")}
        </button>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
