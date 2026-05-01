"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
} from "@/lib/services/subscriptionApi";
import type { Feature } from "@/types/role";
import type { SubscriptionPlan } from "@/types/subscription";

const FEATURE_ICONS: Record<string, string> = {
  Recrutement: "📋", Candidatures: "👥", Clients: "🏢", Managers: "👤",
  Utilisateurs: "🔑", Intégrations: "🔗", Agenda: "📅", Entretiens: "🗣️",
  "Vivier de talents": "💎", "Offres Publiques": "📢", Emails: "✉️",
  Logs: "📊", Rôles: "🛡️", Entreprises: "🏭",
};

// Features réservées au super admin — non proposées dans les abonnements
const SYSTEM_FEATURE_NAMES = new Set(["Entreprises", "Logs", "Activity Management", "Company Management"]);

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
  allFeatures: Feature[];
  onSaved?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export default function SubscriptionPlanModal({
  isOpen,
  onClose,
  plan,
  allFeatures,
  onSaved,
  onError,
}: SubscriptionPlanModalProps) {
  const isEditing = !!plan;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("0");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual" | "one_time">("monthly");
  const [isActive, setIsActive] = useState(true);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());

  const [createPlan, { isLoading: isCreating }] = useCreateSubscriptionPlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSubscriptionPlanMutation();
  const isSaving = isCreating || isUpdating;

  // Features disponibles pour les abonnements (exclure system-only)
  const availableFeatures = allFeatures.filter((f) => !SYSTEM_FEATURE_NAMES.has(f.name));

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description || "");
      setPrice(String(plan.price ?? 0));
      setBillingCycle((plan.billing_cycle as "monthly" | "annual" | "one_time") || "monthly");
      setIsActive(plan.is_active ?? true);
      const ids = plan.planFeatures?.map((pf) => pf.feature_id || pf.feature?.id).filter(Boolean) as string[];
      setSelectedFeatureIds(new Set(ids));
    } else {
      setName(""); setDescription(""); setPrice("0");
      setBillingCycle("monthly"); setIsActive(true);
      setSelectedFeatureIds(new Set());
    }
  }, [plan, isOpen]);

  const toggle = (id: string) => {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedFeatureIds(
      selectedFeatureIds.size === availableFeatures.length
        ? new Set()
        : new Set(availableFeatures.map((f) => f.id))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { onError?.("Le nom du plan est requis"); return; }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price) || 0,
      billing_cycle: billingCycle,
      is_active: isActive,
      featureIds: Array.from(selectedFeatureIds),
    };

    try {
      if (isEditing && plan) {
        await updatePlan({ id: plan.id, data }).unwrap();
        onSaved?.(`Plan "${name}" mis à jour avec succès`);
      } else {
        await createPlan(data).unwrap();
        onSaved?.(`Plan "${name}" créé avec succès`);
      }
      onClose();
    } catch {
      onError?.(`Erreur lors de ${isEditing ? "la modification" : "la création"} du plan`);
    }
  };

  const inputClass = "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white dark:border-gray-700";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span>📦</span>
          {isEditing ? "Modifier le plan" : "Nouveau plan d'abonnement"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Définissez les modules inclus et le tarif
        </p>
      </div>

      <div className="max-h-[65vh] overflow-y-auto px-6 py-5 space-y-5">
        {/* Informations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
            Informations
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nom du plan <span className="text-error-500">*</span></Label>
              <Input
                placeholder="Ex: Starter, Pro, Enterprise..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <textarea
                placeholder="Décrivez ce plan en quelques mots..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={`${inputClass} h-auto resize-none py-2`}
              />
            </div>
            <div>
              <Label>Prix (MAD)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label>Facturation</Label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as "monthly" | "annual" | "one_time")}
                className={inputClass}
              >
                <option value="monthly">Mensuel</option>
                <option value="annual">Annuel</option>
                <option value="one_time">Paiement unique</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Plan actif</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modules inclus */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
              Modules inclus
              <span className="normal-case inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                {selectedFeatureIds.size}/{availableFeatures.length}
              </span>
            </h3>
            <button type="button" onClick={toggleAll} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
              {selectedFeatureIds.size === availableFeatures.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableFeatures.map((feature) => {
              const checked = selectedFeatureIds.has(feature.id);
              const icon = FEATURE_ICONS[feature.name] || "⚙️";
              return (
                <label
                  key={feature.id}
                  className={`flex items-center gap-2.5 rounded-xl border-2 p-3 cursor-pointer transition-all select-none ${
                    checked
                      ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20"
                      : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-gray-600"
                  }`}
                >
                  <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    checked ? "bg-brand-500 border-brand-500" : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {checked && (
                      <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
                        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={checked} onChange={() => toggle(feature.id)} className="sr-only" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{icon}</span>
                      <span className={`text-xs font-medium truncate ${checked ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                        {feature.name}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            * Les modules Entreprises et Logs sont réservés au Super Admin et non disponibles dans les abonnements.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Sauvegarde..." : isEditing ? "Modifier" : "Créer le plan"}
        </Button>
      </div>
    </Modal>
  );
}
