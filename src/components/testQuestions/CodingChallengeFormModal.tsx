"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { CodingChallenge, CreateCodingChallengeRequest, CodingDomain, CodingDifficulty } from "@/types/codingChallenge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCodingChallengeRequest) => void;
  challenge?: CodingChallenge | null;
  isLoading?: boolean;
}

const EMPTY: CreateCodingChallengeRequest = {
  domain: "backend",
  title: "",
  description: "",
  language: "javascript",
  starter_code: "// La variable \"input\" contient les données d'entrée.\n// Affichez le résultat avec console.log(...)\n\n",
  test_cases: [{ input: "", expected_output: "" }],
  difficulty: "medium",
  is_active: true,
};

export default function CodingChallengeFormModal({ isOpen, onClose, onSubmit, challenge, isLoading = false }: Props) {
  const t = useTranslations("tests.codingForm");
  const tRoot = useTranslations("tests");
  const isEditing = !!challenge;
  const [form, setForm] = useState<CreateCodingChallengeRequest>(EMPTY);

  useEffect(() => {
    if (isOpen) {
      if (challenge) {
        setForm({
          domain: challenge.domain,
          title: challenge.title,
          description: challenge.description,
          language: challenge.language,
          starter_code: challenge.starter_code,
          test_cases: [...challenge.test_cases],
          difficulty: challenge.difficulty,
          is_active: challenge.is_active,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [isOpen, challenge]);

  const handleTestCaseChange = (index: number, field: "input" | "expected_output", value: string) => {
    setForm((f) => ({ ...f, test_cases: f.test_cases.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc)) }));
  };

  const addTestCase = () => setForm((f) => ({ ...f, test_cases: [...f.test_cases, { input: "", expected_output: "" }] }));
  const removeTestCase = (index: number) => setForm((f) => ({ ...f, test_cases: f.test_cases.filter((_, i) => i !== index) }));

  const canSubmit = form.title.trim() && form.description.trim() && form.starter_code.trim() && form.test_cases.every((tc) => tc.input.trim() !== "" || tc.expected_output.trim() !== "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? t("titles.edit") : t("titles.add")}
        </h2>
      </div>

      <div className="max-h-[65vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>{t("fields.domain")}</Label>
            <select
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value as CodingDomain }))}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="frontend">{tRoot("domains.frontend")}</option>
              <option value="backend">{tRoot("domains.backend")}</option>
              <option value="fullstack">{tRoot("domains.fullstack")}</option>
              <option value="devops">{tRoot("domains.devops")}</option>
            </select>
          </div>
          <div>
            <Label>{t("fields.difficulty")}</Label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as CodingDifficulty }))}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="easy">{tRoot("difficulties.easy")}</option>
              <option value="medium">{tRoot("difficulties.medium")}</option>
              <option value="hard">{tRoot("difficulties.hard")}</option>
            </select>
          </div>
        </div>

        <div>
          <Label>{t("fields.title")} <span className="text-error-500">*</span></Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div>
          <Label>{t("fields.description")} <span className="text-error-500">*</span></Label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
          />
        </div>

        <div>
          <Label>{t("fields.starterCode")}</Label>
          <textarea
            value={form.starter_code}
            onChange={(e) => setForm((f) => ({ ...f, starter_code: e.target.value }))}
            spellCheck={false}
            rows={6}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 text-gray-100 font-mono text-sm p-4"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{t("fields.testCases")}</Label>
            <button type="button" onClick={addTestCase} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              <Plus size={14} /> {t("fields.addTestCase")}
            </button>
          </div>
          <div className="space-y-2">
            {form.test_cases.map((tc, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input placeholder={t("fields.testInputPlaceholder")} value={tc.input} onChange={(e) => handleTestCaseChange(index, "input", e.target.value)} />
                <Input placeholder={t("fields.testOutputPlaceholder")} value={tc.expected_output} onChange={(e) => handleTestCaseChange(index, "expected_output", e.target.value)} />
                {form.test_cases.length > 1 && (
                  <button type="button" onClick={() => removeTestCase(index)}>
                    <Trash2 size={16} className="text-gray-400 hover:text-error-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-400">{t("fields.testCasesHint")}</p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
          {t("fields.active")}
        </label>
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
