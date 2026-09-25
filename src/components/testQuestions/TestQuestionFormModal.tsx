"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { TestQuestion, CreateTestQuestionRequest, TestQuestionType, TestQuestionDifficulty, TestQuestionDomain } from "@/types/testQuestion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTestQuestionRequest) => void;
  question?: TestQuestion | null;
  isLoading?: boolean;
}

const EMPTY: CreateTestQuestionRequest = {
  type: "technique",
  category: "",
  question: "",
  options: ["", "", "", ""],
  correct_answer_index: 0,
  difficulty: "medium",
  is_active: true,
};

export default function TestQuestionFormModal({ isOpen, onClose, onSubmit, question, isLoading = false }: Props) {
  const t = useTranslations("tests.form");
  const tRoot = useTranslations("tests");
  const isEditing = !!question;
  const [form, setForm] = useState<CreateTestQuestionRequest>(EMPTY);

  useEffect(() => {
    if (isOpen) {
      if (question) {
        setForm({
          type: question.type,
          domain: question.domain || undefined,
          category: question.category,
          question: question.question,
          options: [...question.options],
          correct_answer_index: question.correct_answer_index,
          difficulty: question.difficulty,
          is_active: question.is_active,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [isOpen, question]);

  const handleOptionChange = (index: number, value: string) => {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === index ? value : o)) }));
  };

  const canSubmit = form.category.trim() && form.question.trim() && form.options.every((o) => o.trim());

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? t("titles.edit") : t("titles.add")}
        </h2>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("fields.type")}</Label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TestQuestionType }))}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="technique">{tRoot("types.technique")}</option>
              <option value="psychotechnique">{tRoot("types.psychotechnique")}</option>
            </select>
          </div>
          <div>
            <Label>{t("fields.category")} <span className="text-error-500">*</span></Label>
            <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder={t("fields.categoryPlaceholder")} />
          </div>
        </div>

        {form.type === "technique" && (
          <div>
            <Label>{t("fields.domain")}</Label>
            <select
              value={form.domain || ""}
              onChange={(e) => setForm((f) => ({ ...f, domain: (e.target.value || undefined) as TestQuestionDomain | undefined }))}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="">{t("fields.domainNone")}</option>
              <option value="frontend">{tRoot("domains.frontend")}</option>
              <option value="backend">{tRoot("domains.backend")}</option>
              <option value="fullstack">{tRoot("domains.fullstack")}</option>
              <option value="devops">{tRoot("domains.devops")}</option>
            </select>
          </div>
        )}

        <div>
          <Label>{t("fields.question")} <span className="text-error-500">*</span></Label>
          <textarea
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
        </div>

        <div>
          <Label>{t("fields.options")}</Label>
          <div className="space-y-2">
            {form.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_answer"
                  checked={form.correct_answer_index === index}
                  onChange={() => setForm((f) => ({ ...f, correct_answer_index: index }))}
                  title={t("fields.markCorrect")}
                />
                <Input value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={t("fields.optionPlaceholder", { n: index + 1 })} />
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">{t("fields.optionsHint")}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("fields.difficulty")}</Label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as TestQuestionDifficulty }))}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="easy">{tRoot("difficulties.easy")}</option>
              <option value="medium">{tRoot("difficulties.medium")}</option>
              <option value="hard">{tRoot("difficulties.hard")}</option>
            </select>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
              {t("fields.active")}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>{t("buttons.cancel")}</Button>
        <Button onClick={() => onSubmit(form)} disabled={isLoading || !canSubmit}>
          {isLoading ? t("buttons.saving") : isEditing ? t("buttons.save") : t("buttons.add")}
        </Button>
      </div>
    </Modal>
  );
}
