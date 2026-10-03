"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useGetFeaturesQuery, useGetCompanyFeaturesQuery, useSetCompanyFeaturesMutation } from "@/lib/services/roleApi";
import { useGetSubscriptionPlansQuery, useAssignPlanToCompanyMutation } from "@/lib/services/subscriptionApi";
import { featureIcon, featureLabel } from "@/utils/featureLabels";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { Company } from "@/types/company";
import type { SubscriptionPlan } from "@/types/subscription";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onDone: (companyName: string) => void;
}

// Popup « Rendre payante » : uniquement le choix de l'abonnement et la personnalisation des modules.
export default function MarkPaidModal({ isOpen, onClose, company, onDone }: Props) {
  const t = useTranslations("companies.markPaid");
  const { data: plans = [] } = useGetSubscriptionPlansQuery(undefined, { skip: !isOpen });
  const { data: allFeatures = [] } = useGetFeaturesQuery(undefined, { skip: !isOpen });
  const { data: companyFeatures = [] } = useGetCompanyFeaturesQuery(company?.id ?? "", { skip: !isOpen || !company?.id });
  const [assignPlan, { isLoading: isAssigning }] = useAssignPlanToCompanyMutation();
  const [setFeatures, { isLoading: isSaving }] = useSetCompanyFeaturesMutation();

  const activePlans = plans.filter((p: SubscriptionPlan) => p.is_active);
  const [planId, setPlanId] = useState("");
  const [featureIds, setFeatureIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPlanId(activePlans.length === 1 ? activePlans[0].id : "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setFeatureIds(new Set((companyFeatures as Array<{ id: string }>).map((f) => f.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, companyFeatures.length]);

  const toggleFeature = (id: string) =>
    setFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleConfirm = async () => {
    if (!company || !planId) {
      setError(t("choosePlan"));
      return;
    }
    setError(null);
    try {
      await assignPlan({ companyId: company.id, planId }).unwrap();
      await setFeatures({ companyId: company.id, featureIds: Array.from(featureIds) }).unwrap();
      onDone(company.name);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, t("error")));
    }
  };

  const busy = isAssigning || isSaving;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex-shrink-0 p-6 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("title", { name: company?.name ?? "" })}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm dark:bg-error-500/10 dark:border-error-500/30 dark:text-error-400">
            {error}
          </div>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t("plansTitle")}</h3>
          {activePlans.length === 0 ? (
            <p className="text-sm text-gray-400">{t("noPlans")}</p>
          ) : (
            <div className="space-y-2">
              {activePlans.map((p: SubscriptionPlan) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-2.5 ${
                    planId === p.id ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="plan" checked={planId === p.id} onChange={() => setPlanId(p.id)} />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">{Number(p.price).toFixed(2)} {p.currency || "MAD"}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("modulesTitle")}</h3>
            <span className="text-xs text-gray-400">{featureIds.size}/{allFeatures.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {allFeatures.map((f) => {
              const checked = featureIds.has(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                    checked ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20" : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleFeature(f.id)} />
                  <span>{featureIcon(f.name)}</span>
                  <span className="text-gray-700 dark:text-gray-300">{featureLabel(f)}</span>
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={busy}>{t("cancel")}</Button>
        <Button onClick={handleConfirm} disabled={busy || !planId}>
          {busy ? t("saving") : t("confirm")}
        </Button>
      </div>
    </Modal>
  );
}
