"use client";
import { useState, useCallback } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import EmailTemplateEditorModal from "@/components/emailTemplates/EmailTemplateEditorModal";
import { useGetEmailTemplatesQuery, useGetEmailTemplateVariablesQuery } from "@/lib/services/emailTemplateApi";
import { useActions } from "@/hooks/useActions";
import type { EmailTemplate, EmailTemplateType } from "@/types/emailTemplate";

export default function EmailTemplatesPage() {
  const { canUpdate } = useActions("/email-templates");
  const { data: templates = [], isLoading } = useGetEmailTemplatesQuery();
  const { data: variableInfo = [] } = useGetEmailTemplateVariablesQuery();
  const [selectedType, setSelectedType] = useState<EmailTemplateType | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const labelFor = (type: EmailTemplateType) => variableInfo.find((v) => v.type === type)?.label || type;
  const selectedTemplate: EmailTemplate | null = templates.find((t) => t.type === selectedType) || null;

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates emails</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Personnalisez le contenu des emails envoyés automatiquement par la plateforme (candidatures, entretiens, notifications).
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.type}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">{labelFor(template.type)}</h3>
                <Badge color={template.is_custom ? "success" : "light"} variant="light" size="sm">
                  {template.is_custom ? "Personnalisé" : "Par défaut"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={template.subject}>
                {template.subject}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedType(template.type)}
                disabled={!canUpdate}
                className="mt-auto"
              >
                {canUpdate ? "Modifier" : "Voir"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <EmailTemplateEditorModal
        isOpen={!!selectedType}
        onClose={() => setSelectedType(null)}
        template={selectedTemplate}
        label={selectedType ? labelFor(selectedType) : ""}
        onToast={addToast}
      />
    </div>
  );
}
