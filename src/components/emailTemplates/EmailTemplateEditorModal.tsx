"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import RichTextEditor, { type RichTextEditorHandle } from "./RichTextEditor";
import {
  useUpdateEmailTemplateMutation,
  useResetEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
} from "@/lib/services/emailTemplateApi";
import type { EmailTemplate } from "@/types/emailTemplate";
import { getApiErrorMessage } from "@/utils/errorMessages";

interface EmailTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  label: string;
  onToast: (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => void;
}

export default function EmailTemplateEditorModal({
  isOpen,
  onClose,
  template,
  label,
  onToast,
}: EmailTemplateEditorModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [updateTemplate, { isLoading: isSaving }] = useUpdateEmailTemplateMutation();
  const [resetTemplate, { isLoading: isResetting }] = useResetEmailTemplateMutation();
  const [previewTemplate, { isLoading: isPreviewing }] = usePreviewEmailTemplateMutation();

  useEffect(() => {
    if (isOpen && template) {
      setSubject(template.subject);
      setBody(template.body_html);
      setPreview(null);
    }
  }, [isOpen, template]);

  if (!template) return null;

  const handleSave = async () => {
    try {
      await updateTemplate({ type: template.type, data: { subject, body_html: body } }).unwrap();
      onToast("success", "Enregistré", "Le template a été mis à jour.");
      onClose();
    } catch (error) {
      onToast("error", "Erreur", getApiErrorMessage(error, "Échec de l'enregistrement"));
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetTemplate(template.type).unwrap();
      setSubject(result.subject);
      setBody(result.body_html);
      setPreview(null);
      onToast("success", "Réinitialisé", "Le modèle par défaut a été restauré.");
    } catch (error) {
      onToast("error", "Erreur", getApiErrorMessage(error, "Échec de la réinitialisation"));
    }
  };

  const handlePreview = async () => {
    try {
      const result = await previewTemplate({ type: template.type, data: { subject, body_html: body } }).unwrap();
      setPreview(result);
    } catch (error) {
      onToast("error", "Erreur", getApiErrorMessage(error, "Échec de l'aperçu"));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{label}</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Personnalisez l&apos;objet et le corps de cet email. Utilisez les variables ci-dessous pour insérer des informations dynamiques.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div>
          <Label>Objet de l&apos;email</Label>
          <InputField value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet de l'email" />
        </div>

        <div>
          <Label>Corps de l&apos;email</Label>
          <RichTextEditor ref={editorRef} value={body} onChange={setBody} />
        </div>

        <div>
          <Label>Variables disponibles</Label>
          <div className="flex flex-wrap gap-1.5">
            {template.variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => editorRef.current?.insertVariable(v)}
                className="px-2 py-1 rounded-md text-xs font-mono bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-colors"
                title={`Insérer {{${v}}}`}
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        {preview && (
          <div>
            <Label>Aperçu (avec des données d&apos;exemple)</Label>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-sm">
                <span className="text-gray-400">Objet : </span>
                <span className="font-medium text-gray-800 dark:text-white">{preview.subject}</span>
              </div>
              <iframe
                title="Aperçu de l'email"
                srcDoc={preview.html}
                className="w-full h-[400px] bg-white"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center justify-between gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={handleReset} disabled={isResetting || !template.is_custom}>
          {isResetting ? "..." : "Réinitialiser au modèle par défaut"}
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
            {isPreviewing ? "..." : "Aperçu"}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
