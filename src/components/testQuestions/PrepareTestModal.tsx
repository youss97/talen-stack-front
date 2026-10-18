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
import { useGetApplicationsQuery } from "@/lib/services/applicationApi";
import { useGetApplicationRequestsForSelectInfiniteQuery } from "@/lib/services/applicationRequestApi";
import { useCreateTestSessionMutation } from "@/lib/services/testSessionApi";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { CV } from "@/types/cv";
import type { ApplicationRequest } from "@/types/applicationRequest";
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
  const [mode, setMode] = useState<"vivier" | "manual">("vivier");
  const [selectedCvId, setSelectedCvId] = useState(cvId || "");
  const [manual, setManual] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [type, setType] = useState<TestSessionType>("technique");
  const [domain, setDomain] = useState<TestQuestionDomain | "">("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [applicationId, setApplicationId] = useState("");
  const [recruitmentRequestId, setRecruitmentRequestId] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createSession, { isLoading }] = useCreateTestSessionMutation();

  // Candidatures du CV sélectionné (rattachement optionnel)
  const candidateCvId = mode === "vivier" ? selectedCvId : "";
  const { data: applicationsData } = useGetApplicationsQuery(
    { cv_id: candidateCvId, limit: 50 },
    { skip: !isOpen || !candidateCvId },
  );
  const candidateApplications = candidateCvId ? applicationsData?.data || [] : [];

  useEffect(() => {
    if (isOpen) {
      setMode("vivier");
      setSelectedCvId(cvId || "");
      setManual({ first_name: "", last_name: "", email: "", phone: "" });
      setType("technique");
      setDomain("");
      setDifficulty("");
      setQuestionCount(20);
      setTimePerQuestion(60);
      setApplicationId("");
      setRecruitmentRequestId("");
      setGeneratedLink(null);
      setCopied(false);
      setError(null);
    }
  }, [isOpen, cvId]);

  // Changer de candidat invalide la candidature sélectionnée
  useEffect(() => {
    setApplicationId("");
  }, [candidateCvId]);

  const canSubmit =
    mode === "vivier" ? !!selectedCvId : !!(manual.first_name && manual.last_name && manual.email);

  const handleSubmit = async () => {
    setError(null);
    try {
      const isTalopsia = type === "talopsia";
      const result = await createSession({
        cv_id: mode === "vivier" ? selectedCvId : undefined,
        candidate_first_name: mode === "manual" ? manual.first_name : undefined,
        candidate_last_name: mode === "manual" ? manual.last_name : undefined,
        candidate_email: mode === "manual" ? manual.email : undefined,
        candidate_phone: mode === "manual" ? manual.phone : undefined,
        application_id: applicationId || undefined,
        // Une candidature porte déjà sa demande de recrutement (complétée côté serveur)
        recruitment_request_id: !applicationId && recruitmentRequestId ? recruitmentRequestId : undefined,
        type,
        domain: !isTalopsia ? domain || undefined : undefined,
        difficulty: !isTalopsia ? difficulty || undefined : undefined,
        question_count: !isTalopsia ? questionCount : undefined,
        time_per_question_seconds: !isTalopsia ? timePerQuestion : undefined,
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

  const selectClass =
    "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg max-h-[90vh] flex flex-col">
      <div className="px-6 pt-6 sm:px-8 sm:pt-8 shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t("title")}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8 space-y-4 custom-scrollbar">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Rattachement optionnel à une candidature / demande de recrutement */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("attachSection")}</p>
              {candidateCvId && candidateApplications.length > 0 && (
                <div>
                  <Label>{t("application")}</Label>
                  <select value={applicationId} onChange={(e) => setApplicationId(e.target.value)} className={selectClass}>
                    <option value="">{t("applicationNone")}</option>
                    {candidateApplications.map((application) => (
                      <option key={application.id} value={application.id}>
                        {[application.request?.reference, application.request?.title, application.request?.client?.name]
                          .filter(Boolean)
                          .join(" · ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!applicationId && (
                <InfiniteSelect<ApplicationRequest>
                  label={t("request")}
                  value={recruitmentRequestId}
                  onChange={(value) => setRecruitmentRequestId(value)}
                  useInfiniteQuery={useGetApplicationRequestsForSelectInfiniteQuery}
                  itemLabelKey="title"
                  itemValueKey="id"
                  placeholder={t("requestPlaceholder")}
                />
              )}
              <p className="text-xs text-gray-400">{t("attachHint")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={type === "talopsia" ? "col-span-2" : ""}>
                <Label>{t("type")}</Label>
                <select value={type} onChange={(e) => setType(e.target.value as TestSessionType)} className={selectClass}>
                  <option value="technique">{t("types.technique")}</option>
                  <option value="talopsia">{t("types.talopsia")}</option>
                </select>
              </div>
              {type === "technique" && (
                <div>
                  <Label>{t("questionCount")}</Label>
                  <Input type="number" min={5} max={100} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} />
                </div>
              )}
            </div>

            {type === "talopsia" ? (
              <p className="text-xs text-gray-400 leading-relaxed">{t("talopsiaHint")}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{t("timePerQuestion")}</Label>
                    <Input type="number" min={10} max={900} value={timePerQuestion} onChange={(e) => setTimePerQuestion(Number(e.target.value))} />
                    <p className="mt-1 text-xs text-gray-400">{t("timePerQuestionHint")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{t("difficulty")}</Label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={selectClass}>
                      <option value="">{t("difficultyAny")}</option>
                      <option value="easy">{t("difficulties.easy")}</option>
                      <option value="medium">{t("difficulties.medium")}</option>
                      <option value="hard">{t("difficulties.hard")}</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t("domain")}</Label>
                    <select value={domain} onChange={(e) => setDomain(e.target.value as TestQuestionDomain | "")} className={selectClass}>
                      <option value="">{t("domainAny")}</option>
                      <option value="frontend">{t("domains.frontend")}</option>
                      <option value="backend">{t("domains.backend")}</option>
                      <option value="fullstack">{t("domains.fullstack")}</option>
                      <option value="devops">{t("domains.devops")}</option>
                    </select>
                  </div>
                </div>

                <p className="text-xs text-gray-400">{t("randomHint")}</p>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 shrink-0">
        {generatedLink ? (
          <Button onClick={onClose}>{t("close")}</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>{t("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isLoading || !canSubmit}>
              {isLoading ? t("generating") : t("generate")}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
