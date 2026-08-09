"use client";
import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Star, Pencil, Trash2 } from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import EmailTemplateEditorModal from "@/components/emailTemplates/EmailTemplateEditorModal";
import {
  useGetEmailTemplatesQuery,
  useGetEmailTemplateVariablesQuery,
  useDeleteEmailTemplateMutation,
  useSetDefaultEmailTemplateMutation,
} from "@/lib/services/emailTemplateApi";
import { useActions } from "@/hooks/useActions";
import type { EmailTemplate, EmailTemplateType } from "@/types/emailTemplate";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function EmailTemplatesPage() {
  const t = useTranslations("settings.emailTemplatesPage");
  const { canUpdate } = useActions("/email-templates");
  const { data: templates = [], isLoading } = useGetEmailTemplatesQuery();
  const { data: variableInfo = [] } = useGetEmailTemplateVariablesQuery();
  const [editing, setEditing] = useState<{ type: EmailTemplateType; templateId: string | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<EmailTemplate | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateMutation();
  const [setDefaultTemplate] = useSetDefaultEmailTemplateMutation();

  const addToast = useCallback(
    (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Libellés/descriptions traduits côté frontend (le backend ne renvoie que du français) —
  // repli sur la valeur backend si un type n'a pas (encore) d'entrée dans le namespace.
  const labelFor = (type: EmailTemplateType) =>
    (t.has(`types.${type}.label`) ? t(`types.${type}.label`) : variableInfo.find((v) => v.type === type)?.label) || type;
  const descriptionFor = (type: EmailTemplateType) =>
    (t.has(`types.${type}.description`) ? t(`types.${type}.description`) : variableInfo.find((v) => v.type === type)?.description) || "";

  // Un type par carte, même si aucun template n'est encore enregistré pour lui.
  const types = useMemo(
    () => variableInfo.map((v) => v.type),
    [variableInfo]
  );
  const templatesByType = useMemo(() => {
    const map = new Map<EmailTemplateType, EmailTemplate[]>();
    templates.forEach((tpl) => {
      const list = map.get(tpl.type) || [];
      list.push(tpl);
      map.set(tpl.type, list);
    });
    return map;
  }, [templates]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTemplate(confirmDelete.id).unwrap();
      addToast("success", t("toasts.deletedTitle"), t("toasts.deletedMessage"));
      setConfirmDelete(null);
    } catch (error) {
      addToast("error", t("toasts.errorTitle"), getApiErrorMessage(error, t("toasts.deleteError")));
    }
  };

  const handleSetDefault = async (template: EmailTemplate) => {
    try {
      await setDefaultTemplate(template.id).unwrap();
      addToast("success", t("toasts.defaultSetTitle"), t("toasts.defaultSetMessage", { name: template.name }));
    } catch (error) {
      addToast("error", t("toasts.errorTitle"), getApiErrorMessage(error, t("toasts.defaultSetError")));
    }
  };

  return (
    <div className="w-full">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => {
            const typeTemplates = templatesByType.get(type) || [];
            return (
              <div
                key={type}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col gap-3"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{labelFor(type)}</h3>
                  {descriptionFor(type) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {descriptionFor(type)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {typeTemplates.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t("noneSaved")}</p>
                  ) : (
                    typeTemplates.map((tpl) => (
                      <div
                        key={tpl.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{tpl.name}</span>
                            {tpl.is_default && (
                              <Badge color="success" variant="light" size="sm">{t("default")}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate" title={tpl.subject}>{tpl.subject}</p>
                        </div>
                        {canUpdate && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!tpl.is_default && (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(tpl)}
                                title={t("setDefault")}
                                className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                              >
                                <Star size={14} strokeWidth={1.8} className="icon-glow" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setEditing({ type, templateId: tpl.id })}
                              title={t("edit")}
                              className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                            >
                              <Pencil size={14} strokeWidth={1.8} className="icon-glow" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(tpl)}
                              title={t("delete")}
                              className="p-1.5 rounded-md text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors"
                            >
                              <Trash2 size={14} strokeWidth={1.8} className="icon-glow" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing({ type, templateId: null })}
                    className="mt-auto inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} strokeWidth={1.8} className="icon-glow" />
                    {t("addTemplate")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EmailTemplateEditorModal
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          type={editing.type}
          templateId={editing.templateId}
          label={labelFor(editing.type)}
          variables={variableInfo.find((v) => v.type === editing.type)?.variables || []}
          onSaved={() => setEditing(null)}
          onToast={addToast}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title={t("deleteConfirm.title")}
        message={t("deleteConfirm.message", { name: confirmDelete?.name || "" })}
        confirmText={t("deleteConfirm.confirm")}
        cancelText={t("deleteConfirm.cancel")}
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
