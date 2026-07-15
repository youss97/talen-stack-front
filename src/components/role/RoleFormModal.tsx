"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import PermissionsSelector from "./PermissionsSelector";
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleFormData,
} from "@/validations/roleValidation";
import type { RoleWithFeatures } from "@/types/role";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleFormData, actionIds: string[]) => void;
  role?: RoleWithFeatures | null;
  isLoading?: boolean;
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  role,
  isLoading = false,
}: RoleFormModalProps) {
  const t = useTranslations("roles");
  const tc = useTranslations("common");
  const isEditing = !!role;

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  // Portée des données par ressource (true = toute l'entreprise, false = ses propres éléments)
  const [scopes, setScopes] = useState({
    applications: false,
    requests: false,
    cvs: false,
    clients: false,
    emails: false,
    integrations: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: yupResolver(isEditing ? updateRoleSchema : createRoleSchema) as unknown as Resolver<CreateRoleFormData>,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name || "",
        description: role.description || "",
      });

      const features: string[] = [];
      const pages: string[] = [];
      const actions: string[] = [];

      // Les features retournées SONT les features sélectionnées (pas de propriété .selected)
      role.features?.forEach((feature) => {
        features.push(feature.id);
        feature.pages?.forEach((page) => {
          pages.push(page.id);
          page.actions?.forEach((action) => {
            actions.push(action.id);
          });
        });
      });

      setSelectedFeatures(features);
      setSelectedPages(pages);
      setSelectedActions(actions);
      setScopes({
        applications: role.scope_applications_company === true,
        requests: role.scope_requests_company === true,
        cvs: role.scope_cvs_company === true,
        clients: role.scope_clients_company === true,
        emails: role.scope_emails_company === true,
        integrations: role.scope_integrations_company === true,
      });
    } else {
      reset({
        name: "",
        description: "",
      });
      setSelectedFeatures([]);
      setSelectedPages([]);
      setSelectedActions([]);
      setScopes({ applications: false, requests: false, cvs: false, clients: false, emails: false, integrations: false });
    }
  }, [role, reset]);

  const handleFormSubmit = (data: CreateRoleFormData) => {
    onSubmit(
      {
        ...data,
        scope_applications_company: scopes.applications,
        scope_requests_company: scopes.requests,
        scope_cvs_company: scopes.cvs,
        scope_clients_company: scopes.clients,
        scope_emails_company: scopes.emails,
        scope_integrations_company: scopes.integrations,
      } as CreateRoleFormData,
      selectedActions,
    );
  };

  // Lignes de la section "Portée des données"
  const scopeRows: { key: keyof typeof scopes; label: string; note?: string }[] = [
    { key: "applications", label: t("resources.applications") },
    { key: "requests", label: t("resources.requests") },
    { key: "cvs", label: t("resources.cvs") },
    { key: "clients", label: t("resources.clients") },
    { key: "emails", label: t("resources.emails") },
    { key: "integrations", label: t("resources.integrations") },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl mx-4 my-2 h-[96vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? t("form.titleEdit") : t("form.titleAdd")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? t("form.subtitleEdit")
            : t("form.subtitleAdd")}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <Label>{t("form.nameLabel")}</Label>
              <input
                placeholder={t("form.namePlaceholder")}
                {...register("name")}
                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                  errors.name
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label>{tc("labels.description")}</Label>
              <textarea
                placeholder={t("form.descriptionPlaceholder")}
                {...register("description")}
                rows={3}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                  errors.description
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <Label>{t("form.permissionsLabel")}</Label>
              <p className="text-sm text-gray-500 mb-4">
                {t("form.permissionsSubtitle")}
              </p>
              <PermissionsSelector
                selectedFeatures={selectedFeatures}
                selectedPages={selectedPages}
                selectedActions={selectedActions}
                onFeaturesChange={setSelectedFeatures}
                onPagesChange={setSelectedPages}
                onActionsChange={setSelectedActions}
              />
            </div>

            {/* Portée des données */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <Label>{t("form.dataScope.title")}</Label>
              <p className="text-sm text-gray-500 mb-4">
                {t.rich("form.dataScope.subtitle", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <div className="space-y-2">
                {scopeRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{row.label}</span>
                      {row.note && (
                        <span className="block text-xs text-gray-400 mt-0.5">{row.note}</span>
                      )}
                    </div>
                    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setScopes((s) => ({ ...s, [row.key]: false }))}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          !scopes[row.key]
                            ? "bg-brand-500 text-white"
                            : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {t("form.dataScope.own")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setScopes((s) => ({ ...s, [row.key]: true }))}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          scopes[row.key]
                            ? "bg-brand-500 text-white"
                            : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {t("form.dataScope.company")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("form.saving")
              : isEditing
              ? tc("actions.edit")
              : tc("actions.add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
