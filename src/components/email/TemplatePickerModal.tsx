"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import RichTextEditor, { type RichTextEditorHandle } from "@/components/emailTemplates/RichTextEditor";
import {
  useGetEmailTemplatesForSelectInfiniteQuery,
  useGetEmailTemplateQuery,
  useGetEmailTemplateDefaultQuery,
  useGetEmailTemplateVariablesQuery,
} from "@/lib/services/emailTemplateApi";
import type { EmailTemplate, EmailTemplateType } from "@/types/emailTemplate";

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EmailTemplateType;
  title: string;
  onConfirm: (payload: { templateId?: string; subject: string; body_html: string }) => void;
  isConfirming?: boolean;
}

/**
 * Popup de sélection + aperçu éditable d'un template email pour un type donné.
 * Le contenu affiché (objet/corps) peut être modifié librement avant l'envoi,
 * mais ces modifications ne sont JAMAIS répercutées sur le template enregistré.
 */
export default function TemplatePickerModal({
  isOpen,
  onClose,
  type,
  title,
  onConfirm,
  isConfirming = false,
}: TemplatePickerModalProps) {
  const t = useTranslations("emails.templatePicker");
  const [selectedId, setSelectedId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);

  const { data: selectedTemplate } = useGetEmailTemplateQuery(selectedId, { skip: !isOpen || !selectedId });
  const { data: defaultContent } = useGetEmailTemplateDefaultQuery(type, { skip: !isOpen || !!selectedId });
  const { data: variableGroups = [] } = useGetEmailTemplateVariablesQuery(undefined, { skip: !isOpen });
  const variables = variableGroups.find((g) => g.type === type)?.variables || [];

  useEffect(() => {
    if (!isOpen) {
      setSelectedId("");
      setSubject("");
      setBody("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedId || !selectedTemplate) return;
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body_html);
  }, [isOpen, selectedId, selectedTemplate]);

  useEffect(() => {
    if (!isOpen || selectedId || !defaultContent) return;
    setSubject(defaultContent.subject);
    setBody(defaultContent.body_html);
  }, [isOpen, selectedId, defaultContent]);

  const handleSelectChange = (value: string, item?: EmailTemplate) => {
    setSelectedId(value);
    if (!value) return;
    if (item) {
      setSubject(item.subject);
      setBody(item.body_html);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <InfiniteSelect<EmailTemplate>
          label={t("templateLabel")}
          value={selectedId}
          onChange={handleSelectChange}
          useInfiniteQuery={useGetEmailTemplatesForSelectInfiniteQuery}
          queryArg={{ type }}
          getOptionLabel={(item) => item.name}
          itemValueKey="id"
          emptyMessage={t("noTemplate")}
          placeholder={t("selectPlaceholder")}
        />

        <div>
          <Label>{t("subjectLabel")}</Label>
          <InputField value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div>
          <Label>{t("bodyLabel")}</Label>
          <RichTextEditor ref={editorRef} value={body} onChange={setBody} />
        </div>

        {variables.length > 0 && (
          <div>
            <Label>{t("variablesLabel")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => editorRef.current?.insertVariable(v)}
                  className="px-2 py-1 rounded-md text-xs font-mono bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button
          onClick={() => onConfirm({ templateId: selectedId || undefined, subject, body_html: body })}
          disabled={isConfirming || !subject.trim()}
        >
          {isConfirming ? "..." : t("confirm")}
        </Button>
      </div>
    </Modal>
  );
}
