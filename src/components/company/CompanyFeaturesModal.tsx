"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import {
  useGetFeaturesQuery,
  useGetCompanyFeaturesQuery,
  useSetCompanyFeaturesMutation,
} from "@/lib/services/roleApi";
import type { Company } from "@/types/company";
import type { Feature } from "@/types/role";

interface CompanyFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSaved?: () => void;
}

const FEATURE_ICONS: Record<string, string> = {
  Recrutement: "📋",
  Candidatures: "👥",
  Clients: "🏢",
  Managers: "👤",
  Utilisateurs: "🔑",
  Intégrations: "🔗",
  Agenda: "📅",
  Entretiens: "🗣️",
  "Vivier de talents": "💎",
  "Offres Publiques": "📢",
  Emails: "✉️",
  Logs: "📊",
  Rôles: "🛡️",
  Entreprises: "🏭",
};

export default function CompanyFeaturesModal({
  isOpen,
  onClose,
  company,
  onSaved,
}: CompanyFeaturesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: allFeatures = [], isLoading: loadingAll } = useGetFeaturesQuery(undefined, {
    skip: !isOpen,
  });

  const { data: companyFeatures = [], isLoading: loadingCompany } = useGetCompanyFeaturesQuery(
    company?.id ?? "",
    { skip: !isOpen || !company?.id }
  );

  const [setCompanyFeatures] = useSetCompanyFeaturesMutation();

  const companyFeatureIdsKey = companyFeatures.map((f: Feature) => f.id).sort().join(",");

  useEffect(() => {
    if (!loadingCompany) {
      setSelectedIds(new Set(companyFeatureIdsKey.split(",").filter(Boolean)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFeatureIdsKey, loadingCompany]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      selectedIds.size === allFeatures.length
        ? new Set()
        : new Set(allFeatures.map((f) => f.id))
    );
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    setError(null);
    try {
      await setCompanyFeatures({ companyId: company.id, featureIds: Array.from(selectedIds) }).unwrap();
      onSaved?.();
      onClose();
    } catch {
      setError("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !company) return null;

  const isLoading = loadingAll || loadingCompany;
  const allSelected = allFeatures.length > 0 && selectedIds.size === allFeatures.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden"
           style={{ maxHeight: "min(90vh, 700px)" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-50 to-transparent dark:from-brand-900/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚙️</span>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Modules — {company.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sélectionnez les modules que cette entreprise peut utiliser
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        {!isLoading && allFeatures.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-brand-600 dark:text-brand-400">{selectedIds.size}</span>
              {" "}/ {allFeatures.length} modules sélectionnés
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
            >
              {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
              <p className="text-sm text-gray-400">Chargement des modules...</p>
            </div>
          ) : allFeatures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl mb-2">🔌</p>
              <p className="text-gray-500">Aucun module disponible</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allFeatures.map((feature) => {
                const checked = selectedIds.has(feature.id);
                const icon = FEATURE_ICONS[feature.name] || "⚙️";
                return (
                  <label
                    key={feature.id}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all select-none ${
                      checked
                        ? "border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(feature.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        checked
                          ? "bg-brand-500 border-brand-500"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }`}>
                        {checked && (
                          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{icon}</span>
                        <span className={`text-sm font-semibold ${
                          checked ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-200"
                        }`}>
                          {feature.name}
                        </span>
                      </div>
                      {feature.description && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                          {feature.description}
                        </p>
                      )}
                      {feature.pages && feature.pages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {feature.pages.slice(0, 3).map((p) => (
                            <span key={p.id} className="inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                              {p.name}
                            </span>
                          ))}
                          {feature.pages.length > 3 && (
                            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
                              +{feature.pages.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {selectedIds.size === 0
              ? "Aucun module sélectionné — accès complet"
              : `${selectedIds.size} module${selectedIds.size > 1 ? "s" : ""} accordé${selectedIds.size > 1 ? "s" : ""}`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || isLoading}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Sauvegarde...
                </span>
              ) : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
