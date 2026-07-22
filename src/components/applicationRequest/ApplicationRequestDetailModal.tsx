"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { ApplicationRequest } from "@/types/applicationRequest";
import { getSkillName, getSkillLevel } from "@/types/applicationRequest";

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 20 20" className={`w-4 h-4 ${filled ? "text-amber-400" : "text-gray-200 dark:text-gray-600"}`} fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const SkillsList = ({ skills }: { skills: unknown[] | null | undefined }) => {
  const t = useTranslations("recruitmentRequests.detailModal");
  const validSkills = (skills || []).filter(
    (s: any) => s && !Array.isArray(s) && (typeof s === 'string' ? s.trim() : s?.name?.trim())
  );
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t("requiredSkillsTitle")}</h4>
      {validSkills.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t("noSkills")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {validSkills.map((skill: any, index: number) => {
            const name = getSkillName(skill);
            const level = getSkillLevel(skill);
            return (
              <div key={index} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{name || "—"}</span>
                <span className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => <StarIcon key={s} filled={s <= level} />)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ApplicationRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationRequest: ApplicationRequest | null;
  isLoading?: boolean;
  onStatusUpdate?: (requestId: string, newStatus: string) => Promise<void>;
}

export default function ApplicationRequestDetailModal({
  isOpen,
  onClose,
  applicationRequest,
  isLoading = false,
  onStatusUpdate,
}: ApplicationRequestDetailModalProps) {
  const t = useTranslations("recruitmentRequests");
  const tc = useTranslations("common");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!applicationRequest && !isLoading) return null;

  const handleStartEditStatus = () => {
    setSelectedStatus(applicationRequest?.status || "in_progress");
    setIsEditingStatus(true);
  };

  const handleCancelEditStatus = () => {
    setIsEditingStatus(false);
    setSelectedStatus("");
  };

  const handleSaveStatus = async () => {
    if (!applicationRequest || !onStatusUpdate) return;

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(applicationRequest.id, selectedStatus);
      setIsEditingStatus(false);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return t("list.statusOptions.in_progress");
      case "standby":
        return t("list.statusOptions.standby");
      case "abandoned":
        return t("list.statusOptions.abandoned");
      case "filled":
        return t("list.statusOptions.filled");
      case "open":
        return t("list.statusOptions.open");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "info";
      case "standby":
        return "warning";
      case "abandoned":
        return "error";
      case "filled":
        return "success";
      case "open":
        return "success";
      default:
        return "light";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "normal":
        return "info";
      default:
        return "success";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return t("list.urgencyLabels.urgent");
      case "high":
        return t("list.urgencyLabels.high");
      case "normal":
        return t("list.urgencyLabels.normal");
      case "low":
        return t("list.urgencyLabels.low");
      default:
        return t("list.urgencyLabels.low");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t("detailModal.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("detailModal.subtitle")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : applicationRequest ? (
          <div className="space-y-6">
            {/* En-tête avec titre et urgence */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {applicationRequest.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("list.columns.reference", { ref: applicationRequest.reference })}
                </p>
              </div>
              <Badge
                variant="light"
                color={getUrgencyColor(applicationRequest.priority || '')}
              >
                {getUrgencyLabel(applicationRequest.priority || '')}
              </Badge>
            </div>

            {/* Informations du client */}
            {applicationRequest.client && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.clientTitle")}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tc("labels.name")}</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.client.name || "-"}</p>
                    </div>
                    {applicationRequest.client.contact_email && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tc("labels.email")}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.client.contact_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Informations du manager */}
            {applicationRequest.manager && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.managerTitle")}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tc("labels.name")}</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {`${applicationRequest.manager.first_name || ""} ${applicationRequest.manager.last_name || ""}`.trim() || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tc("labels.email")}</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.manager.email || "-"}</p>
                    </div>
                  </div>
                  {applicationRequest.manager.role && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t("detailModal.role")}</p>
                      <p className="text-sm text-gray-900 dark:text-white">{applicationRequest.manager.role.name || "-"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("detailModal.descriptionTitle")}
              </h4>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {applicationRequest.description}
              </p>
            </div>

            {/* Compétences requises */}
            <SkillsList skills={applicationRequest.required_skills} />

            {/* Softskills */}
            {applicationRequest.soft_skills && (applicationRequest.soft_skills as string[]).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.softSkillsTitle")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(applicationRequest.soft_skills as string[]).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Langues */}
            {applicationRequest.languages && applicationRequest.languages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.languagesTitle")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {applicationRequest.languages.map((lang, index) => {
                    const name = typeof lang === "string" ? lang : lang?.language;
                    const level = typeof lang === "string" ? undefined : lang?.level;
                    return (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full text-sm"
                      >
                        {name}{level ? ` — ${level}/5` : ""}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Workflow / étapes (1.2) — toujours affiché (étapes définies, sinon défaut) */}
            {(() => {
              const customSteps = [...(applicationRequest.workflow_steps || [])]
                .filter((s) => s && s.name)
                .sort((a, b) => a.order - b.order);
              const hasCustom = customSteps.length > 0;
              const steps = hasCustom
                ? customSteps
                : [
                    { name: t("form.defaultWorkflowSteps.proposed"), order: 0 },
                    { name: t("form.defaultWorkflowSteps.hrInterview"), order: 1 },
                    { name: t("form.defaultWorkflowSteps.clientInterview"), order: 2 },
                    { name: t("form.defaultWorkflowSteps.offer"), order: 3 },
                  ];
              return (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t("detailModal.workflowTitle")}
                    {!hasCustom && (
                      <span className="ms-2 text-xs font-normal text-gray-400">{t("detailModal.defaultStepsBadge")}</span>
                    )}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {steps.map((step, index) => (
                      <span key={index} className="flex items-center gap-2">
                        {index > 0 && <span className="text-gray-400">→</span>}
                        <span className="px-3 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm">
                          {step.name}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Informations du poste */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("detailModal.jobInfoTitle")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.contractType")}</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{applicationRequest.contract_type || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.workMode")}</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.work_type === "remote" ? t("form.fields.workModeRemote")
                      : applicationRequest.work_type === "hybrid" ? t("form.fields.workModeHybrid")
                      : applicationRequest.work_type === "on_site" ? t("form.fields.workModeOnSite")
                      : "-"}
                  </p>
                </div>
                {applicationRequest.location && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.location")}</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {[applicationRequest.location, applicationRequest.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                {applicationRequest.number_of_profiles && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.numberOfProfiles")}</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{applicationRequest.number_of_profiles}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.experience")}</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.min_experience
                      ? applicationRequest.max_experience
                        ? t("detailModal.experienceRange", { min: applicationRequest.min_experience, max: applicationRequest.max_experience })
                        : t("detailModal.experienceMin", { count: applicationRequest.min_experience })
                      : "-"}
                  </p>
                </div>
                {(applicationRequest.min_salary != null || applicationRequest.max_salary != null) && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.salary")}</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const currency: string = (applicationRequest.currency as string | undefined) || "MAD";
                        if (applicationRequest.min_salary != null && applicationRequest.max_salary != null) {
                          const min: string = applicationRequest.min_salary.toLocaleString("fr-FR");
                          const max: string = applicationRequest.max_salary.toLocaleString("fr-FR");
                          return t("detailModal.salaryRange", { min, max, currency });
                        }
                        if (applicationRequest.min_salary != null) {
                          const amount: string = applicationRequest.min_salary.toLocaleString("fr-FR");
                          return t("detailModal.salaryMinOnly", { amount, currency });
                        }
                        const amount: string = (applicationRequest.max_salary ?? 0).toLocaleString("fr-FR");
                        return t("detailModal.salaryMaxOnly", { amount, currency });
                      })()}
                    </p>
                  </div>
                )}
                {(applicationRequest.daily_rate_min != null || applicationRequest.daily_rate_max != null) && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.dailyRate")}</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {(() => {
                        const currency: string = (applicationRequest.currency as string | undefined) || "MAD";
                        if (applicationRequest.daily_rate_min != null && applicationRequest.daily_rate_max != null) {
                          return t("detailModal.dailyRateRange", { min: applicationRequest.daily_rate_min, max: applicationRequest.daily_rate_max, currency });
                        }
                        if (applicationRequest.daily_rate_min != null) {
                          return t("detailModal.dailyRateMinOnly", { amount: applicationRequest.daily_rate_min, currency });
                        }
                        const amount: number = applicationRequest.daily_rate_max ?? 0;
                        return t("detailModal.dailyRateMaxOnly", { amount, currency });
                      })()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.startDate")}</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {applicationRequest.desired_start_date
                      ? new Date(applicationRequest.desired_start_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Primes & Avantages */}
            {(applicationRequest.benefits || applicationRequest.bonuses || applicationRequest.variables) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.compensationTitle")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {applicationRequest.benefits && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.benefits")}</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{applicationRequest.benefits}</p>
                    </div>
                  )}
                  {applicationRequest.bonuses && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.bonuses")}</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{applicationRequest.bonuses}</p>
                    </div>
                  )}
                  {applicationRequest.variables && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("detailModal.variables")}</p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{applicationRequest.variables}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statut de la demande */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t("detailModal.statusTitle")}
              </h4>
              {!isEditingStatus ? (
                <div className="flex items-center gap-3">
                  <Badge
                    variant="light"
                    color={getStatusColor(applicationRequest.status) as "success" | "error" | "warning" | "info" | "light"}
                  >
                    {getStatusLabel(applicationRequest.status)}
                  </Badge>
                  {onStatusUpdate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEditStatus}
                    >
                      {t("detailModal.editStatusButton")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
                    disabled={isUpdatingStatus}
                  >
                    <option value="in_progress">{t("list.statusOptions.in_progress")}</option>
                    <option value="standby">{t("list.statusOptions.standby")}</option>
                    <option value="abandoned">{t("list.statusOptions.abandoned")}</option>
                    <option value="filled">{t("list.statusOptions.filled")}</option>
                    <option value="open">{t("list.statusOptions.open")}</option>
                  </select>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveStatus}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? t("detailModal.saving") : tc("actions.save")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEditStatus}
                      disabled={isUpdatingStatus}
                    >
                      {tc("actions.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dates */}
            {(applicationRequest.created_at || applicationRequest.updated_at) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t("detailModal.historyTitle")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {applicationRequest.created_at && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("detailModal.createdAt")}
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(applicationRequest.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                  {applicationRequest.updated_at && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t("detailModal.updatedAt")}
                      </p>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(applicationRequest.updated_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          {tc("actions.close")}
        </Button>
      </div>
    </Modal>
  );
}
