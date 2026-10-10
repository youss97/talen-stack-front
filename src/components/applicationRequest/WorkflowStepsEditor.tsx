"use client";
import { useTranslations } from "next-intl";
import Label from "@/components/form/Label";
import { Lock } from "lucide-react";

export interface WorkflowStep {
  name: string;
  order: number;
}

interface Props {
  value: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

export default function WorkflowStepsEditor({ value, onChange }: Props) {
  const t = useTranslations("recruitmentRequests.workflowStepsEditor");
  // "Proposé" n'est pas proposé ici : c'est toujours l'étape implicite de départ, appliquée
  // automatiquement dès qu'un candidat est proposé — inutile (et source de confusion) de la
  // faire configurer/déplacer manuellement dans ce workflow.
  const DEFAULT_SUGGESTIONS = [
    t("suggestions.hrInterview"),
    t("suggestions.clientInterview"),
    t("suggestions.offer"),
    t("suggestions.recruited"),
  ];
  const steps = [...(value || [])].sort((a, b) => a.order - b.order);
  // La première étape ("Proposé") est fixe : nom non modifiable, ni déplaçable, ni supprimable,
  // et aucune autre étape ne peut passer avant elle.
  const LOCKED_INDEX = 0;

  const commit = (next: WorkflowStep[]) => {
    onChange(next.map((s, i) => ({ name: s.name, order: i })));
  };

  const addStep = (name = "") => commit([...steps, { name, order: steps.length }]);
  const updateName = (index: number, name: string) => {
    if (index === LOCKED_INDEX) return;
    const next = [...steps];
    next[index] = { ...next[index], name };
    commit(next);
  };
  const removeStep = (index: number) => {
    if (index === LOCKED_INDEX) return;
    commit(steps.filter((_, i) => i !== index));
  };
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (index === LOCKED_INDEX || target <= LOCKED_INDEX || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <div>
      <Label>{t("label")}</Label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {t("help")}
      </p>

      {steps.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {DEFAULT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addStep(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step, i) => {
          const locked = i === LOCKED_INDEX;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                {i + 1}
              </span>
              {locked ? (
                <span className="h-10 flex-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
                  <Lock size={13} strokeWidth={1.8} className="icon-glow" />
                  {step.name}
                </span>
              ) : (
                <input
                  value={step.name}
                  onChange={(e) => updateName(i, e.target.value)}
                  placeholder={t("stepPlaceholder", { index: i + 1 })}
                  className="h-10 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
              )}
              {!locked && (
                <>
                  <button type="button" onClick={() => move(i, -1)} disabled={i <= LOCKED_INDEX + 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">↓</button>
                  <button type="button" onClick={() => removeStep(i)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10">×</button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => addStep()}
        className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
      >
        {t("addStep")}
      </button>
    </div>
  );
}
