"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useGetTalopsiaJobProfileQuery, useSetTalopsiaJobProfileMutation } from "@/lib/services/applicationRequestApi";
import type { TalopsiaJobImportance, TalopsiaJobProfile } from "@/types/testSession";

interface Props {
  requestId: string;
  canEdit?: boolean;
}

const IMPORTANCES: TalopsiaJobImportance[] = [0, 1, 2, 3, 4];

/**
 * Job Profile TALOPSIA d'une demande de recrutement (spec §14) : importance 0-4 de chacune des 15
 * dimensions, groupées par catégorie comme dans le référentiel (Personnalité / Comportements
 * professionnels). Donnée interne au cabinet — jamais affichée côté client (le backend refuse
 * l'accès aux utilisateurs d'une entreprise cliente).
 *
 * Une importance n'est PAS un score minimum : elle sert uniquement à l'alignement qualitatif.
 */
export default function TalopsiaJobProfileEditor({ requestId, canEdit = false }: Props) {
  const t = useTranslations("tests.talopsia");
  const { data, isLoading, isError } = useGetTalopsiaJobProfileQuery(requestId);
  const [saveProfile, { isLoading: isSaving }] = useSetTalopsiaJobProfileMutation();
  const [draft, setDraft] = useState<Record<string, TalopsiaJobImportance>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setDraft(Object.fromEntries(data.entries.map((e) => [e.dimension_code, e.importance])));
  }, [data]);

  const isDirty = useMemo(
    () => !!data && data.entries.some((e) => (draft[e.dimension_code] ?? 0) !== e.importance),
    [data, draft],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="text-sm text-error-500 text-center py-6">{t("jobProfile.error")}</p>;
  }

  const label = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);
  const groups: Array<{ category: TalopsiaJobProfile["entries"][number]["category"]; entries: TalopsiaJobProfile["entries"] }> = [
    { category: "personality", entries: data.entries.filter((e) => e.category === "personality") },
    { category: "professional_behavior", entries: data.entries.filter((e) => e.category === "professional_behavior") },
  ];

  const handleSave = async () => {
    try {
      await saveProfile({
        id: requestId,
        entries: data.entries.map((e) => ({ dimension_code: e.dimension_code, importance: draft[e.dimension_code] ?? 0 })),
      }).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // erreur affichée globalement via le middleware
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/[0.03]">
        <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{t("jobProfile.hint")}</p>
      </div>

      {groups.map((group) => (
        <div key={group.category}>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t(`categories.${group.category}`)}</h4>
          <div className="space-y-2">
            {group.entries.map((entry) => {
              const value = draft[entry.dimension_code] ?? 0;
              return (
                <div
                  key={entry.dimension_code}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {label(`dimensions.${entry.dimension_code}`, entry.name)}
                  </span>
                  {canEdit ? (
                    <select
                      value={value}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [entry.dimension_code]: Number(e.target.value) as TalopsiaJobImportance }))
                      }
                      aria-label={label(`dimensions.${entry.dimension_code}`, entry.name)}
                      className="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-56"
                    >
                      {IMPORTANCES.map((importance) => (
                        <option key={importance} value={importance}>
                          {importance} — {t(`jobProfile.importance.${importance}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-sm ${value === 0 ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {value} — {t(`jobProfile.importance.${value}`)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-xs text-success-600 dark:text-success-400">{t("jobProfile.saved")}</span>}
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? t("jobProfile.saving") : t("jobProfile.save")}
          </Button>
        </div>
      )}
    </div>
  );
}
