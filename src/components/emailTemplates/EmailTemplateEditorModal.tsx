"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";
import {
  useGetEmailTemplateQuery,
  useGetEmailTemplateDefaultQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
} from "@/lib/services/emailTemplateApi";
import type { EmailTemplateType } from "@/types/emailTemplate";
import { getApiErrorMessage } from "@/utils/errorMessages";

interface EmailTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: EmailTemplateType;
  templateId: string | null; // null = création d'un nouveau template pour ce type
  label: string;
  variables: string[];
  onSaved: () => void;
  onToast: (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

export default function EmailTemplateEditorModal({
  isOpen,
  onClose,
  type,
  templateId,
  label,
  variables,
  onSaved,
  onToast,
}: EmailTemplateEditorModalProps) {
  const t = useTranslations("settings.emailTemplatesPage.editorModal");
  const isCreating = !templateId;

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);

  const { data: existingTemplate } = useGetEmailTemplateQuery(templateId as string, { skip: !isOpen || !templateId });
  const { data: defaultContent } = useGetEmailTemplateDefaultQuery(type, { skip: !isOpen || !isCreating });

  const [createTemplate, { isLoading: isCreatingSaving }] = useCreateEmailTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateMutation();
  const [previewTemplate, { isLoading: isPreviewing }] = usePreviewEmailTemplateMutation();
  const isSaving = isCreatingSaving || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    if (existingTemplate) {
      setName(existingTemplate.name);
      setSubject(existingTemplate.subject);
      setBody(existingTemplate.body_html);
    } else if (isCreating && defaultContent) {
      setName("");
      setSubject(defaultContent.subject);
      setBody(defaultContent.body_html);
    }
    setPreview(null);
  }, [isOpen, existingTemplate, isCreating, defaultContent]);

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createTemplate({ type, name, subject, body_html: body }).unwrap();
        onToast("success", t("toasts.savedTitle"), t("toasts.createdMessage"));
      } else {
        await updateTemplate({ id: templateId!, data: { name, subject, body_html: body } }).unwrap();
        onToast("success", t("toasts.savedTitle"), t("toasts.savedMessage"));
      }
      onSaved();
      onClose();
    } catch (error) {
      onToast("error", t("toasts.errorTitle"), getApiErrorMessage(error, t("toasts.saveError")));
    }
  };

  const handlePreview = async () => {
    try {
      const result = await previewTemplate({ type, data: { subject, body_html: body } }).unwrap();
      setPreview(result);
    } catch (error) {
      onToast("error", t("toasts.errorTitle"), getApiErrorMessage(error, t("toasts.previewError")));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{label}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isCreating ? t("subtitleCreate") : t("subtitle")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div>
          <Label>{t("nameLabel")}</Label>
          <InputField value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
        </div>

        <div>
          <Label>{t("subjectLabel")}</Label>
          <InputField value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("subjectPlaceholder")} />
        </div>

        <div>
          <Label>{t("bodyLabel")}</Label>
          <RichTextEditor ref={editorRef} value={body} onChange={setBody} />
        </div>

        <div>
          <Label>{t("variablesLabel")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => editorRef.current?.insertVariable(v)}
                className="px-2 py-1 rounded-md text-xs font-mono bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                title={t("insertVariable", { variable: `{{${v}}}` })}
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {preview && (
          <div>
            <Label>{t("previewLabel")}</Label>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-sm">
                <span className="text-gray-400">{t("previewSubjectLabel")} </span>
                <span className="font-medium text-gray-800 dark:text-white">{preview.subject}</span>
              </div>
              <iframe
                title={t("previewIframeTitle")}
                srcDoc={preview.html}
                className="w-full h-[400px] bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
          {isPreviewing ? "..." : t("preview")}
        </Button>
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !name.trim() || !subject.trim()}>
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </Modal>
  );
}
