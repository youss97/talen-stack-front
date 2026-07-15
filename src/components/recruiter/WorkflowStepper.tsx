"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";

interface WorkflowStep {
  name: string;
  order: number;
}

interface Props {
  steps: WorkflowStep[];
  currentStep?: string | null;
  canEdit?: boolean;
  isSaving?: boolean;
  /** Change l'étape courante (+ feedback optionnel) */
  onChangeStep: (step: string, feedbackDescription?: string) => Promise<void> | void;
  /** Ajoute un feedback à une étape SANS changer l'étape courante */
  onAddFeedback?: (step: string, description: string) => Promise<void> | void;
  isAddingFeedback?: boolean;
}

const TERMINAL = ["Accepté", "KO", "Désistement"];
const REQUIRE_REASON = ["KO", "Désistement"];
const DEFAULT_STEPS: WorkflowStep[] = [
  { name: "Proposé", order: 0 },
  { name: "Entretien RH", order: 1 },
  { name: "Entretien client", order: 2 },
  { name: "Offre", order: 3 },
];

export default function WorkflowStepper({
  steps, currentStep, canEdit = false, isSaving = false,
  onChangeStep, onAddFeedback, isAddingFeedback = false,
}: Props) {
  const t = useTranslations("recruiterModals");
  const tc = useTranslations("common");
  const provided = [...(steps || [])].filter((s) => s && s.name).sort((a, b) => a.order - b.order);
  const sorted = provided.length ? provided : DEFAULT_STEPS;
  const allOptions = [...sorted.map((s) => s.name), ...TERMINAL];

  // Changer d'étape
  const [targetStep, setTargetStep] = useState("");
  const [moveFeedback, setMoveFeedback] = useState("");
  const [moveError, setMoveError] = useState(false);

  // Clôture (KO / Désistement) — motif inline
  const [closureTarget, setClosureTarget] = useState<string | null>(null);
  const [closureReason, setClosureReason] = useState("");
  const [closureError, setClosureError] = useState(false);

  // Feedback sans changement d'étape
  const [fbStep, setFbStep] = useState("");
  const [fbText, setFbText] = useState("");
  const [fbError, setFbError] = useState(false);

  const currentIndex = sorted.findIndex((s) => s.name === currentStep);

  const submitMove = async () => {
    if (!targetStep) return;
    if (REQUIRE_REASON.includes(targetStep) && !moveFeedback.trim()) { setMoveError(true); return; }
    setMoveError(false);
    await onChangeStep(targetStep, moveFeedback.trim() || undefined);
    setMoveFeedback(""); setTargetStep("");
  };

  const clickClosure = async (terminal: string) => {
    if (REQUIRE_REASON.includes(terminal)) {
      setClosureTarget(terminal); setClosureReason(""); setClosureError(false);
    } else {
      // Accepté : pas de motif
      await onChangeStep(terminal);
    }
  };

  const confirmClosure = async () => {
    if (!closureTarget) return;
    if (!closureReason.trim()) { setClosureError(true); return; }
    await onChangeStep(closureTarget, closureReason.trim());
    setClosureTarget(null); setClosureReason("");
  };

  const submitFeedback = async () => {
    if (!onAddFeedback) return;
    if (!fbStep) { setFbError(true); return; }
    if (!fbText.trim()) { setFbError(true); return; }
    setFbError(false);
    await onAddFeedback(fbStep, fbText.trim());
    setFbText(""); setFbStep("");
  };

  return (
    <div className="space-y-4">
      {/* Stepper visuel */}
      <div className="flex flex-wrap items-center gap-2">
        {sorted.map((step, i) => {
          const isCurrent = step.name === currentStep;
          const isPast = currentIndex >= 0 && i < currentIndex;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300 dark:text-gray-600 inline-block rtl:rotate-180">→</span>}
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                isCurrent ? "bg-brand-500 text-white border-brand-500"
                : isPast ? "bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/30"
                : "bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              }`}>
                {step.name}
              </span>
            </span>
          );
        })}
        {TERMINAL.includes(currentStep || "") && (
          <span className="flex items-center gap-2">
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium text-white ${
              currentStep === "Accepté" ? "bg-green-500" : currentStep === "KO" ? "bg-red-500" : "bg-amber-500"
            }`}>{currentStep}</span>
          </span>
        )}
      </div>

      {canEdit && (
        <>
          {/* Changer d'étape */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("workflowStepper.changeStepTitle")}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={targetStep}
                onChange={(e) => setTargetStep(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              >
                <option value="">{t("workflowStepper.selectStepPlaceholder")}</option>
                {sorted.map((s) => (
                  <option key={s.name} value={s.name} disabled={s.name === currentStep}>{s.name}</option>
                ))}
              </select>
              <Button onClick={submitMove} disabled={isSaving || !targetStep}>
                {isSaving ? t("workflowStepper.updating") : t("workflowStepper.updateButton")}
              </Button>
            </div>
            <textarea
              value={moveFeedback}
              onChange={(e) => { setMoveFeedback(e.target.value); if (e.target.value.trim()) setMoveError(false); }}
              rows={2}
              placeholder={t("workflowStepper.feedbackPlaceholder")}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${moveError ? "border-error-500" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
            />
            {moveError && <p className="text-xs text-error-500">{t("workflowStepper.reasonRequired")}</p>}
          </div>

          {/* Clôture : Accepté / KO / Désistement */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("workflowStepper.closeApplicationTitle")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => clickClosure("Accepté")} disabled={isSaving || currentStep === "Accepté"}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">✓ {t("workflowStepper.accepted")}</button>
              <button type="button" onClick={() => clickClosure("KO")} disabled={isSaving || currentStep === "KO"}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">✕ {t("workflowStepper.ko")}</button>
              <button type="button" onClick={() => clickClosure("Désistement")} disabled={isSaving || currentStep === "Désistement"}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">⊘ {t("workflowStepper.withdrawal")}</button>
            </div>
            {closureTarget && (
              <div className="space-y-2 pt-1">
                <textarea
                  value={closureReason}
                  onChange={(e) => { setClosureReason(e.target.value); if (e.target.value.trim()) setClosureError(false); }}
                  rows={2}
                  placeholder={t("workflowStepper.reasonPlaceholder", { step: closureTarget })}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${closureError ? "border-error-500" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
                />
                {closureError && <p className="text-xs text-error-500">{t("workflowStepper.reasonRequiredShort")}</p>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setClosureTarget(null); setClosureReason(""); setClosureError(false); }} disabled={isSaving}>{tc("actions.cancel")}</Button>
                  <Button onClick={confirmClosure} disabled={isSaving}>{isSaving ? t("workflowStepper.updating") : t("workflowStepper.confirmButton", { step: closureTarget })}</Button>
                </div>
              </div>
            )}
          </div>

          {/* Ajouter un feedback à une étape (sans changer l'étape) */}
          {onAddFeedback && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t("workflowStepper.addFeedbackTitle")}</p>
              <select
                value={fbStep}
                onChange={(e) => { setFbStep(e.target.value); setFbError(false); }}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              >
                <option value="">{t("workflowStepper.chooseStepPlaceholder")}</option>
                {allOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <textarea
                value={fbText}
                onChange={(e) => { setFbText(e.target.value); if (e.target.value.trim()) setFbError(false); }}
                rows={2}
                placeholder={t("workflowStepper.feedbackForStepPlaceholder")}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${fbError ? "border-error-500" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
              />
              {fbError && <p className="text-xs text-error-500">{t("workflowStepper.chooseStepAndFeedback")}</p>}
              <div className="flex justify-end">
                <Button onClick={submitFeedback} disabled={isAddingFeedback || !fbStep || !fbText.trim()}>
                  {isAddingFeedback ? t("workflowStepper.adding") : t("workflowStepper.addFeedbackButton")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
