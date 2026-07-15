"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import { getFeedbackCardColor } from "@/utils/feedbackColors";
import { resolveStatusLabel } from "@/utils/applicationStatusLabels";
import type { Recruiter } from "@/types/recruiter";
import WorkflowStepper from "./WorkflowStepper";
import { useChangeApplicationStepMutation, useCreateFeedbackMutation } from "@/lib/services/recruiterApi";
import { useGetApplicationStatusesQuery } from "@/lib/services/applicationStatusApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: Recruiter | null;
  /** Permet au client de piloter l'étape (§4.1) */
  canEditStep?: boolean;
  onUpdated?: () => void;
}

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  ) : null;

export default function CandidateApplicationDetailModal({ isOpen, onClose, candidate, canEditStep = false, onUpdated }: Props) {
  const t = useTranslations("recruiterModals");
  const tc = useTranslations("common");
  const [changeStep, { isLoading: isChangingStep }] = useChangeApplicationStepMutation();
  const [createFeedback, { isLoading: isAddingFeedback }] = useCreateFeedbackMutation();
  const { data: applicationStatusesData } = useGetApplicationStatusesQuery({ page: 1, limit: 100, is_active: true });
  const applicationStatuses = applicationStatusesData?.data || [];

  if (!candidate) return null;

  const handleAddStepFeedback = async (step: string, description: string) => {
    try {
      await createFeedback({ id: candidate.id, title: t("candidateDetail.feedbackTitleForStep", { step }), description, step }).unwrap();
      onUpdated?.();
    } catch {
      // erreur affichée globalement via le middleware
    }
  };

  const handleChangeStep = async (step: string, feedbackDescription?: string) => {
    const terminal = ["Accepté", "KO", "Désistement"].includes(step);
    try {
      await changeStep({
        id: candidate.id,
        step,
        feedback_description: feedbackDescription,
        ...(terminal ? { status: step } : {}),
      }).unwrap();
      onUpdated?.();
      onClose();
    } catch {
      // erreur affichée globalement via le middleware
    }
  };

  const cv = candidate.cv;
  const fullName = `${cv?.candidate_first_name || ""} ${cv?.candidate_last_name || ""}`.trim() || t("candidateDetail.defaultName");

  // Prétentions affichées selon les types de contrat SOUHAITÉS pour l'offre — même règle
  // que RecruiterFormModal.tsx : CDI souhaité → salaire, Freelance souhaité → TJM,
  // les deux souhaités → les deux affichés.
  const offerTypes = (candidate.offer_contract_types || []).filter(Boolean) as string[];
  const wantsTjmExpectation = offerTypes.some((v) => v?.toLowerCase() === "freelance");
  const wantsSalaryExpectation = offerTypes.length === 0 || offerTypes.some((v) => ["CDI", "CDD", "Stage", "Intérim", "Alternance"].includes(v));

  const allFeedbacks = candidate.feedbacks || [];
  const clientFeedbacks = allFeedbacks.filter(f =>
    f.created_by?.role?.code?.startsWith("CLIENT_MANAGER_")
  );
  const rhFeedbacks = allFeedbacks.filter(f =>
    !f.created_by?.role?.code?.startsWith("CLIENT_MANAGER_")
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col">
      <div className="flex-shrink-0 p-5 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{fullName}</h2>
        {cv?.profile_title && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{cv.profile_title}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

        {/* Informations générales */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {t("candidateDetail.informationSection")}
          </h3>
          <div className="space-y-2">
            <Row label={t("candidateDetail.position")} value={candidate.request?.title} />
            <Row label={t("candidateDetail.reference")} value={candidate.request?.reference} />
            <Row label={t("candidateDetail.email")} value={cv?.candidate_email} />
            <Row label={t("candidateDetail.phone")} value={cv?.candidate_phone} />
            <Row label={t("candidateDetail.experience")} value={
              candidate.adjusted_experience != null
                ? t("candidateDetail.yearsValue", { years: candidate.adjusted_experience })
                : cv?.total_experience != null
                ? t("candidateDetail.yearsValue", { years: cv.total_experience })
                : undefined
            } />
            <Row label={t("candidateDetail.status")} value={resolveStatusLabel(candidate.status, applicationStatuses)} />
            <Row label={t("candidateDetail.state")} value={
              candidate.workflow_status === 'active' ? t("candidateDetail.statePublished")
                : candidate.workflow_status === 'archived' ? t("candidateDetail.stateArchived")
                : candidate.workflow_status === 'draft' ? t("candidateDetail.stateDraft")
                : undefined
            } />
            <Row label={t("candidateDetail.anonymized")} value={candidate.is_anonymized != null ? (candidate.is_anonymized ? tc("labels.yes") : tc("labels.no")) : undefined} />
            <Row label={t("candidateDetail.submittedOn")} value={candidate.proposed_at ? formatDate(candidate.proposed_at) : undefined} />
            <Row label={t("candidateDetail.publishedOn")} value={candidate.activated_at ? formatDate(candidate.activated_at) : undefined} />
            <Row label={t("candidateDetail.interviewDate")} value={candidate.recruiter_interview_date ? formatDateTime(candidate.recruiter_interview_date) : undefined} />
          </div>
        </section>

        {/* Workflow / étapes (3.2 + 4.1) — toujours affiché */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {t("candidateDetail.workflowSection")}
          </h3>
          <WorkflowStepper
            steps={candidate.request?.workflow_steps || []}
            currentStep={candidate.current_step}
            canEdit={canEditStep}
            isSaving={isChangingStep}
            onChangeStep={handleChangeStep}
            onAddFeedback={handleAddStepFeedback}
            isAddingFeedback={isAddingFeedback}
          />
        </section>

        {/* Compétences */}
        {cv?.skills && cv.skills.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.skillsSection")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Rémunération */}
        {((candidate as { salary_confidential?: boolean }).salary_confidential
          || candidate.current_salary != null || candidate.daily_rate != null || candidate.package_rate != null
          || candidate.salary_expectation != null || candidate.daily_rate_expectation != null
          || candidate.package_current || candidate.package_desired) && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.remunerationSection")}
            </h3>
            <div className="space-y-2">
              {(candidate as { salary_confidential?: boolean }).salary_confidential ? (
                <Row label={t("candidateDetail.salary")} value={t("candidateDetail.confidential")} />
              ) : (
                <>
                  {candidate.current_salary != null && (
                    <Row label={t("candidateDetail.currentSalary")} value={
                      `${candidate.current_salary.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}`
                    } />
                  )}
                  {candidate.daily_rate != null && (
                    <Row label={t("candidateDetail.dailyRate")} value={
                      `${candidate.daily_rate.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}${t("candidateDetail.perDay")}`
                    } />
                  )}
                  {candidate.package_rate != null && (
                    <Row label={t("candidateDetail.annualPackage")} value={
                      `${candidate.package_rate.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}`
                    } />
                  )}
                  <Row label={t("candidateDetail.currentPackage")} value={candidate.package_current} />
                </>
              )}
              {candidate.salary_expectation != null && wantsSalaryExpectation && (
                <Row label={t("candidateDetail.desiredSalary")} value={
                  `${candidate.salary_expectation.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}`
                } />
              )}
              {candidate.daily_rate_expectation != null && wantsTjmExpectation && (
                <Row label={t("candidateDetail.desiredDailyRate")} value={
                  `${candidate.daily_rate_expectation.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}${t("candidateDetail.perDay")}`
                } />
              )}
              <Row label={t("candidateDetail.desiredPackage")} value={candidate.package_desired} />
            </div>
          </section>
        )}

        {/* Contrat & disponibilité */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            {t("candidateDetail.contractSection")}
          </h3>
          <div className="space-y-2">
            <Row label={t("candidateDetail.desiredContractType")} value={
              candidate.offer_contract_types?.length
                ? candidate.offer_contract_types.join(", ")
                : undefined
            } />
            <Row label={t("candidateDetail.currentContract")} value={candidate.current_contract_type} />
            <Row label={t("candidateDetail.currentlyEmployed")} value={
              candidate.currently_employed != null
                ? candidate.currently_employed ? tc("labels.yes") : tc("labels.no")
                : undefined
            } />
            <Row label={t("candidateDetail.availability")} value={
              candidate.availability_type
                ? (t.has(`candidateDetail.availabilityLabels.${candidate.availability_type}`)
                    ? t(`candidateDetail.availabilityLabels.${candidate.availability_type}`)
                    : candidate.availability_type)
                : undefined
            } />
            {candidate.availability_days != null && (
              <Row label={t("candidateDetail.availabilityDelay")} value={String(candidate.availability_days)} />
            )}
            {candidate.availability_custom_value != null && (
              <Row label={t("candidateDetail.customDelay")} value={
                `${candidate.availability_custom_value} ${candidate.availability_custom_unit === 'months' ? t("candidateDetail.months") : t("candidateDetail.days")}`
              } />
            )}
            <Row label={t("candidateDetail.reason")} value={candidate.availability_reason} />
            {candidate.availability_negotiable != null && (
              <Row label={t("candidateDetail.negotiable")} value={candidate.availability_negotiable ? tc("labels.yes") : tc("labels.no")} />
            )}
          </div>
        </section>

        {/* Langues */}
        {candidate.languages && candidate.languages.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.languagesSection")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {candidate.languages.map((l, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {l.language} — {l.level}/5
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Compte-rendu RH */}
        {candidate.qualification_report && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.qualificationSection")}
            </h3>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {candidate.qualification_report}
            </div>
          </section>
        )}

        {/* Notes du recruteur : internes — JAMAIS affichées côté client (3.7) */}

        {/* Notes manager */}
        {candidate.manager_notes && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.managerNotesSection")}
            </h3>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {candidate.manager_notes}
            </div>
          </section>
        )}

        {/* Feedback client */}
        {candidate.client_feedback && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.clientFeedbackSection")}
            </h3>
            <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {candidate.client_feedback}
            </div>
            {candidate.feedback_date && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(candidate.feedback_date)}
              </p>
            )}
          </section>
        )}

        {/* Feedbacks RH */}
        {rhFeedbacks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.evaluationsSection", { count: rhFeedbacks.length })}
            </h3>
            <div className="space-y-3">
              {rhFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  className={`rounded-lg p-4 border-s-4 ${getFeedbackCardColor(fb)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      {fb.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ms-4">
                      {formatDateTime(fb.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                    {fb.description}
                  </p>

                  {fb.created_by && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {fb.created_by.first_name} {fb.created_by.last_name}
                      </span>
                      {fb.created_by.role && (
                        <>
                          <span>•</span>
                          <span>{fb.created_by.role.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mes feedbacks */}
        {clientFeedbacks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              {t("candidateDetail.myFeedbacksSection", { count: clientFeedbacks.length })}
            </h3>
            <div className="space-y-3">
              {clientFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  className={`rounded-lg p-4 border-s-4 ${getFeedbackCardColor(fb)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      {fb.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ms-4">
                      {formatDateTime(fb.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                    {fb.description}
                  </p>

                  {fb.created_by && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {fb.created_by.first_name} {fb.created_by.last_name}
                      </span>
                      {fb.created_by.role && (
                        <>
                          <span>•</span>
                          <span>{fb.created_by.role.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex-shrink-0 flex justify-end p-5 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>{tc("actions.close")}</Button>
      </div>
    </Modal>
  );
}
