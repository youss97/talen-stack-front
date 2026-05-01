"use client";
import { useState, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import SubscriptionPlanModal from "@/components/subscription/SubscriptionPlanModal";
import {
  useGetSubscriptionPlansQuery,
  useDeleteSubscriptionPlanMutation,
} from "@/lib/services/subscriptionApi";
import { useGetFeaturesQuery } from "@/lib/services/roleApi";
import type { SubscriptionPlan } from "@/types/subscription";

const BILLING_LABELS: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  one_time: "Unique",
};

const FEATURE_ICONS: Record<string, string> = {
  Recrutement: "📋", Candidatures: "👥", Clients: "🏢", Managers: "👤",
  Utilisateurs: "🔑", Intégrations: "🔗", Agenda: "📅", Entretiens: "🗣️",
  "Vivier de talents": "💎", "Offres Publiques": "📢", Emails: "✉️",
  Logs: "📊", Rôles: "🛡️", Entreprises: "🏭",
};

export default function SubscriptionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SubscriptionPlan | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const { data: plans = [], isLoading } = useGetSubscriptionPlansQuery();
  const { data: allFeatures = [] } = useGetFeaturesQuery();
  const [deletePlan, { isLoading: isDeleting }] = useDeleteSubscriptionPlanMutation();

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
      addToast("success", "Supprimé", `Le plan "${confirmDelete.name}" a été supprimé`);
    } catch {
      addToast("error", "Erreur", "Impossible de supprimer ce plan");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="text-2xl">📦</span> Abonnements
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Créez des plans d&apos;abonnement et assignez-les aux entreprises pour contrôler leurs accès
          </p>
        </div>
        <Button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }} startIcon={<PlusIcon />}>
          Nouveau plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Plans actifs" value={plans.filter((p) => p.is_active).length} icon="✅" color="green" />
        <StatCard label="Plans inactifs" value={plans.filter((p) => !p.is_active).length} icon="⏸️" color="gray" />
        <StatCard label="Total plans" value={plans.length} icon="📦" color="blue" />
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Aucun plan créé</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Créez votre premier plan d&apos;abonnement</p>
          <Button onClick={() => { setEditingPlan(null); setIsModalOpen(true); }}>Créer un plan</Button>
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
        onSaved={(msg) => addToast("success", "Succès", msg)}
        onError={(msg) => addToast("error", "Erreur", msg)}
      />

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Supprimer le plan"
        message={`Êtes-vous sûr de vouloir supprimer le plan "${confirmDelete?.name}" ? Les entreprises qui l'utilisent perdront leurs accès actuels.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800",
    gray: "bg-gray-50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-700",
    blue: "bg-brand-50 border-brand-100 dark:bg-brand-900/20 dark:border-brand-800",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.gray}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}

const FEATURE_ICONS_LOCAL = FEATURE_ICONS;

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const features = plan.planFeatures?.map((pf) => pf.feature).filter(Boolean) || [];

  return (
    <div className={`relative rounded-2xl border-2 p-5 flex flex-col gap-4 transition-all ${
      plan.is_active
        ? "border-brand-200 bg-white dark:border-brand-800 dark:bg-gray-900 shadow-sm"
        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30 opacity-70"
    }`}>
      {/* Badge statut */}
      <span className={`absolute top-4 right-4 text-xs font-medium px-2 py-0.5 rounded-full ${
        plan.is_active
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
      }`}>
        {plan.is_active ? "Actif" : "Inactif"}
      </span>

      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white pr-16">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{plan.description}</p>
        )}
      </div>

      {/* Prix */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
          {Number(plan.price).toFixed(2)}
        </span>
        <span className="text-sm text-gray-400">MAD</span>
        <span className="text-xs text-gray-400">/ {BILLING_LABELS[plan.billing_cycle] || plan.billing_cycle}</span>
      </div>

      {/* Features incluses */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          {features.length} module{features.length !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
              <span>{FEATURE_ICONS_LOCAL[f.name] || "⚙️"}</span>
              {f.name}
            </span>
          ))}
          {features.length === 0 && (
            <span className="text-xs text-gray-400 italic">Aucun module sélectionné</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onEdit}
          className="flex-1 rounded-lg border border-brand-200 bg-brand-50 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-400 transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 transition-colors"
        >
          Supprimer
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
