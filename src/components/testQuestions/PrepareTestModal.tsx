"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useGetCVsForSelectInfiniteQuery } from "@/lib/services/cvApi";
import { useCreateTestSessionMutation } from "@/lib/services/testSessionApi";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { CV } from "@/types/cv";
import type { TestSessionType, TestQuestionDomain } from "@/types/testSession";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Si fourni, le test est préparé directement pour ce CV du vivier (champ verrouillé). */
  cvId?: string;
  cvName?: string;
  onCreated?: () => void;
}

export default function PrepareTestModal({ isOpen, onClose, cvId, cvName, onCreated }: Props) {
  const t = useTranslations("tests.prepareModal");
  const [mode, setMode] = useState<"vivier" | "manual">(cvId ? "vivier" : "vivier");
  const [selectedCvId, setSelectedCvId] = useState(cvId || "");
  const [manual, setManual] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [type, setType] = useState<TestSessionType>("both");
  const [domain, setDomain] = useState<TestQuestionDomain | "">("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [includeCoding, setIncludeCoding] = useState(false);
  const [codingCount, setCodingCount] = useState(2);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createSession, { isLoading }] = useCreateTestSessionMutation();

  useEffect(() => {
    if (isOpen) {
      setMode(cvId ? "vivier" : "vivier");
      setSelectedCvId(cvId || "");
      setManual({ first_name: "", last_name: "", email: "", phone: "" });
      setType("both");
      setDomain("");
      setCategory("");
      setDifficulty("");
      setQuestionCount(20);
      setIncludeCoding(false);
      setCodingCount(2);
      setTimePerQuestion(60);
      setGeneratedLink(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, cvId]);

  const canSubmit =
    mode === "vivier" ? !!selectedCvId : !!(manual.first_name && manual.last_name && manual.email);

  const handleSubmit = async () => {
    setError(null);
    try {
      const result = await createSession({
        cv_id: mode === "vivier" ? selectedCvId : undefined,
        candidate_first_name: mode === "manual" ? manual.first_name : undefined,
        candidate_last_name: mode === "manual" ? manual.last_name : undefined,
        candidate_email: mode === "manual" ? manual.email : undefined,
        candidate_phone: mode === "manual" ? manual.phone : undefined,
        type,
        domain: domain || undefined,
        category: category || undefined,
        difficulty: difficulty || undefined,
        question_count: questionCount,
        include_coding: includeCoding,
        coding_challenge_count: includeCoding ? codingCount : undefined,
        time_per_question_seconds: timePerQuestion,
      }).unwrap();
      setGeneratedLink(result.publicLink);
      onCreated?.();
    } catch (err) {
      setError(getApiErrorMessage(err, t("error")));
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t("title")}</h2>

        {generatedLink ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("linkGenerated")}</p>
            <div className="flex items-center gap-2">
              <Input value={generatedLink} readOnly />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-700"
              >
                {copied ? <Check size={15} className="text-success-500" /> : <Copy size={15} />}
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={onClose}>{t("close")}</Button>
            </div>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-error-500">{error}</p>}

            {!cvId && (
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 mb-1">
                <button
                  type="button"
                  onClick={() => setMode("vivier")}
                  className={`px-3 py-1.5 text-sm rounded-md ${mode === "vivier" ? "bg-brand-600 text-white" : "text-gray-500"}`}
                >
                  {t("modeVivier")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`px-3 py-1.5 text-sm rounded-md ${mode === "manual" ? "bg-brand-600 text-white" : "text-gray-500"}`}
                >
                  {t("modeManual")}
                </button>
              </div>
            )}

            {mode === "vivier" ? (
              cvId ? (
                <div>
                  <Label>{t("candidate")}</Label>
                  <Input value={cvName || ""} readOnly />
                </div>
              ) : (
                <InfiniteSelect<CV>
                  label={t("candidate")}
                  value={selectedCvId}
                  onChange={(value) => setSelectedCvId(value)}
                  useInfiniteQuery={useGetCVsForSelectInfiniteQuery}
                  itemValueKey="id"
                  placeholder={t("candidatePlaceholder")}
                  getOptionLabel={(item) => `${(item.candidate_first_name as string) || ""} ${(item.candidate_last_name as string) || ""}`.trim()}
                />
              )
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("firstName")} <span className="text-error-500">*</span></Label>
                    <Input value={manual.first_name} onChange={(e) => setManual((m) => ({ ...m, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>{t("lastName")} <span className="text-error-500">*</span></Label>
                    <Input value={manual.last_name} onChange={(e) => setManual((m) => ({ ...m, last_name: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>{t("email")} <span className="text-error-500">*</span></Label>
                  <Input type="email" value={manual.email} onChange={(e) => setManual((m) => ({ ...m, email: e.target.value }))} />
                </div>
                <div>
                  <Label>{t("phone")}</Label>
                  <Input value={manual.phone} onChange={(e) => setManual((m) => ({ ...m, phone: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("type")}</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TestSessionType)}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  <option value="both">{t("types.both")}</option>
                  <option value="technique">{t("types.technique")}</option>
                  <option value="psychotechnique">{t("types.psychotechnique")}</option>
                  <option value="personality">{t("types.personality")}</option>
                </select>
              </div>
              {type !== "personality" && (
                <div>
                  <Label>{t("questionCount")}</Label>
                  <Input type="number" min={5} max={100} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
                </div>
              )}
            </div>

            {type === "personality" ? (
              <p className="text-xs text-gray-400">{t("personalityHint")}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("timePerQuestion")}</Label>
                    <Input type="number" min={10} max={900} value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} />
                    <p className="mt-1 text-xs text-gray-400">{t("timePerQuestionHint")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("difficulty")}</Label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="">{t("difficultyAny")}</option>
                      <option value="easy">{t("difficulties.easy")}</option>
                      <option value="medium">{t("difficulties.medium")}</option>
                      <option value="hard">{t("difficulties.hard")}</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t("domain")}</Label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value as TestQuestionDomain | "")}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="">{t("domainAny")}</option>
                      <option value="frontend">{t("domains.frontend")}</option>
                      <option value="backend">{t("domains.backend")}</option>
                      <option value="fullstack">{t("domains.fullstack")}</option>
                      <option value="devops">{t("domains.devops")}</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={includeCoding} onChange={(e) => setIncludeCoding(e.target.checked)} className="w-4 h-4" />
                    {t("includeCoding")}
                  </label>
                  {includeCoding && (
                    <div className="mt-2">
                      <Label>{t("codingChallengeCount")}</Label>
                      <Input type="number" min={1} max={10} value={codingCount} onChange={(e) => setCodingCount(Number(e.target.value))} />
                      <p className="mt-1 text-xs text-gray-400">{t("codingHint")}</p>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400">{t("randomHint")}</p>
              </>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>{t("cancel")}</Button>
              <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
                {isLoading ? t("generating") : t("generate")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
