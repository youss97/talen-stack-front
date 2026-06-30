"use client";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { formatDate, formatDateTime } from "@/utils/dateFormat";
import type { Recruiter } from "@/types/recruiter";
import WorkflowStepper from "./WorkflowStepper";
import { useChangeApplicationStepMutation, useCreateFeedbackMutation } from "@/lib/services/recruiterApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidate: Recruiter | null;
  /** Permet au client de piloter l'étape (§4.1) */
  canEditStep?: boolean;
  onUpdated?: () => void;
}

const availabilityLabels: Record<string, string> = {
  immediate: "Immédiate",
  less_than_one_month: "Moins d'un mois",
  one_month: "1 mois",
  two_months: "2 mois",
  three_months: "3 mois",
  other: "Autre",
};

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex flex-col sm:flex-row sm:gap-4">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  ) : null;

export default function CandidateApplicationDetailModal({ isOpen, onClose, candidate, canEditStep = false, onUpdated }: Props) {
  const [changeStep, { isLoading: isChangingStep }] = useChangeApplicationStepMutation();
  const [createFeedback, { isLoading: isAddingFeedback }] = useCreateFeedbackMutation();

  if (!candidate) return null;

  const handleAddStepFeedback = async (step: string, description: string) => {
    try {
      await createFeedback({ id: candidate.id, title: `Feedback — ${step}`, description, step }).unwrap();
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
  const fullName = `${cv?.candidate_first_name || ""} ${cv?.candidate_last_name || ""}`.trim() || "Candidat";

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
            Informations
          </h3>
          <div className="space-y-2">
            <Row label="Email" value={cv?.candidate_email} />
            <Row label="Téléphone" value={cv?.candidate_phone} />
            <Row label="Expérience" value={
              candidate.adjusted_experience != null
                ? `${candidate.adjusted_experience} ans`
                : cv?.total_experience != null
                ? `${cv.total_experience} ans`
                : undefined
            } />
            <Row label="Statut" value={candidate.status} />
            <Row label="Soumis le" value={candidate.proposed_at ? formatDate(candidate.proposed_at) : undefined} />
            <Row label="Date entretien" value={candidate.recruiter_interview_date ? formatDateTime(candidate.recruiter_interview_date) : undefined} />
          </div>
        </section>

        {/* Workflow / étapes (3.2 + 4.1) — toujours affiché */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            Workflow
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
              Compétences
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
        {((candidate as { salary_confidential?: boolean }).salary_confidential || candidate.current_salary != null || candidate.daily_rate != null || candidate.package_rate != null) && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Rémunération
            </h3>
            <div className="space-y-2">
              {(candidate as { salary_confidential?: boolean }).salary_confidential ? (
                <Row label="Salaire" value="🔒 Confidentiel" />
              ) : (
                <>
                  {candidate.current_salary != null && (
                    <Row label="Salaire actuel" value={
                      `${candidate.current_salary.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}`
                    } />
                  )}
                  {candidate.daily_rate != null && (
                    <Row label="Taux journalier" value={
                      `${candidate.daily_rate.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}/jour`
                    } />
                  )}
                  {candidate.package_rate != null && (
                    <Row label="Package annuel" value={
                      `${candidate.package_rate.toLocaleString("fr-FR")} ${candidate.currency || "MAD"}`
                    } />
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Contrat & disponibilité */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
            Contrat & Disponibilité
          </h3>
          <div className="space-y-2">
            <Row label="Type de contrat souhaité" value={
              candidate.offer_contract_types?.length
                ? candidate.offer_contract_types.join(", ")
                : undefined
            } />
            <Row label="Contrat actuel" value={candidate.current_contract_type} />
            <Row label="En poste" value={
              candidate.currently_employed != null
                ? candidate.currently_employed ? "Oui" : "Non"
                : undefined
            } />
            <Row label="Disponibilité" value={
              candidate.availability_type
                ? availabilityLabels[candidate.availability_type] ?? candidate.availability_type
                : undefined
            } />
            {candidate.availability_days != null && (
              <Row label="Délai (jours)" value={String(candidate.availability_days)} />
            )}
            <Row label="Raison" value={candidate.availability_reason} />
            {candidate.availability_negotiable != null && (
              <Row label="Négociable" value={candidate.availability_negotiable ? "Oui" : "Non"} />
            )}
          </div>
        </section>

        {/* Langues */}
        {candidate.languages && candidate.languages.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Langues
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
              Compte-rendu de qualification
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
              Notes du manager
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
              Retour client
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
              Évaluations ({rhFeedbacks.length})
            </h3>
            <div className="space-y-3">
              {rhFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  className="rounded-lg p-3 border-l-4 bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{fb.title}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(fb.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{fb.description}</p>
                  {fb.created_by && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fb.created_by.first_name} {fb.created_by.last_name}
                      {fb.created_by.role && ` · ${fb.created_by.role.name}`}
                    </p>
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
              Mes feedbacks ({clientFeedbacks.length})
            </h3>
            <div className="space-y-3">
              {clientFeedbacks.map(fb => (
                <div
                  key={fb.id}
                  className="rounded-lg p-3 border-l-4 bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{fb.title}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(fb.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{fb.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex-shrink-0 flex justify-end p-5 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>Fermer</Button>
      </div>
    </Modal>
  );
}
