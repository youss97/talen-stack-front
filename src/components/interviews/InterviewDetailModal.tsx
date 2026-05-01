"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import RescheduleInterviewModal from "./RescheduleInterviewModal";
import type { Interview } from "@/types/interview";

interface InterviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: Interview;
  onChangeStatus?: (interviewId: string, newStatus: string) => Promise<void>;
  onReschedule?: (interviewId: string, newDate: Date, newDuration?: number) => Promise<void>;
  onDelete?: (interviewId: string) => void;
}

export default function InterviewDetailModal({
  isOpen,
  onClose,
  interview,
  onChangeStatus,
  onReschedule,
  onDelete,
}: InterviewDetailModalProps) {
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  
  const interviewDateRaw = interview.scheduled_date ? new Date(interview.scheduled_date) : null;
  const interviewDate = interviewDateRaw && !isNaN(interviewDateRaw.getTime()) ? interviewDateRaw : null;

  const handleReschedule = async (interviewId: string, newDate: Date, newDuration?: number) => {
    if (!onReschedule) return;
    
    setIsRescheduling(true);
    try {
      await onReschedule(interviewId, newDate, newDuration);
      setIsRescheduleModalOpen(false);
      onClose();
    } catch (error) {
      console.error("Erreur lors du report:", error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "info";
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      case "rescheduled":
        return "warning";
      default:
        return "light";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Planifié";
      case "completed":
        return "Terminé";
      case "cancelled":
        return "Annulé";
      case "rescheduled":
        return "Reporté";
      default:
        return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
          📅 Détails de l'entretien
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        <div className="space-y-4 sm:space-y-6">
        {/* Statut */}
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Statut
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Badge
              color={getStatusColor(interview.status) as any}
              variant="light"
            >
              {getStatusLabel(interview.status)}
            </Badge>
          </div>
        </div>

        {/* Informations sur les emails */}
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notifications email
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2">
            <div className="flex items-center gap-2">
              {interview.email_sent_to_candidate ? (
                <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Email envoyé au candidat
                </span>
              ) : (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  Email non envoyé au candidat
                </span>
              )}
            </div>
            {interview.invitees_emails && interview.invitees_emails.length > 0 && (
              <div className="flex items-center gap-2">
                {interview.email_sent_to_invitees ? (
                  <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Emails envoyés aux invités ({interview.invitees_emails.length})
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    Emails non envoyés aux invités ({interview.invitees_emails.length})
                  </span>
                )}
              </div>
            )}
            {interview.status === "rescheduled" && interview.original_scheduled_date && (
              <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
                  <span className="font-medium">📅 Entretien reporté</span>
                  <div className="mt-1">
                    Date originale : {new Date(interview.original_scheduled_date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })} à {new Date(interview.original_scheduled_date).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ✉️ Emails de report automatiquement envoyés
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Date et heure */}
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date et heure
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {interviewDate ? interviewDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }) : '-'}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {interviewDate ? interviewDate.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }) : '-'} • Durée: {interview.duration_minutes} minutes
            </div>
          </div>
        </div>

        {/* Type et lieu/lien */}
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type d'entretien
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
              {interview.type === "presential" ? "📍 Présentiel" : "🌐 En ligne"}
            </div>
            {interview.type === "presential" && interview.location && (
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Lieu:</span> {interview.location}
              </div>
            )}
            {interview.type === "online" && interview.meeting_link && (
              <div className="text-xs sm:text-sm break-all">
                <span className="font-medium text-gray-600 dark:text-gray-400">Lien:</span>{" "}
                <a
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {interview.meeting_link}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Candidat */}
        {interview.application && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Candidat
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 space-y-2">
              <div className="text-xs sm:text-sm">
                <span className="font-medium text-gray-900 dark:text-white">
                  {interview.application.cv?.candidate_first_name}{" "}
                  {interview.application.cv?.candidate_last_name}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                {interview.application.cv?.candidate_email}
              </div>
              {interview.application.cv?.candidate_phone && (
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {interview.application.cv?.candidate_phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Organisateur */}
        {interview.organizer && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organisateur
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {interview.organizer.first_name} {interview.organizer.last_name}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                {interview.organizer.email}
              </div>
            </div>
          </div>
        )}

        {/* Invités */}
        {interview.invitees_emails && interview.invitees_emails.length > 0 && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personnes invitées ({interview.invitees_emails.length})
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {interview.invitees_emails.map((email, idx) => (
                  <span
                    key={idx}
                    className="px-2 sm:px-3 py-1 bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-xs sm:text-sm break-all"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {interview.notes}
              </p>
            </div>
          </div>
        )}

        {/* Dates de création/modification */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="font-medium">Créé le:</span>{" "}
              {interview.created_at ? (() => { const d = new Date(interview.created_at); return isNaN(d.getTime()) ? '-' : `${d.toLocaleDateString("fr-FR")} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`; })() : '-'}
            </div>
            <div>
              <span className="font-medium">Modifié le:</span>{" "}
              {interview.updated_at ? (() => { const d = new Date(interview.updated_at); return isNaN(d.getTime()) ? '-' : `${d.toLocaleDateString("fr-FR")} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`; })() : '-'}
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="order-2 sm:order-1">
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => {
                onDelete(interview.id);
                onClose();
              }}
              className="text-red-600 hover:text-red-700 hover:border-red-300 w-full sm:w-auto text-sm"
            >
              🗑️ Supprimer
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
          {onChangeStatus && interview.status === "scheduled" && (
            <>
              <Button
                variant="outline"
                onClick={async () => {
                  await onChangeStatus(interview.id, "completed");
                  onClose();
                }}
                className="text-green-600 hover:text-green-700 hover:border-green-300 text-sm"
              >
                ✓ Terminé
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRescheduleModalOpen(true)}
                className="text-orange-600 hover:text-orange-700 hover:border-orange-300 text-sm"
              >
                📅 Reporter
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await onChangeStatus(interview.id, "cancelled");
                  onClose();
                }}
                className="text-red-600 hover:text-red-700 hover:border-red-300 text-sm"
              >
                ✗ Annuler
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose} className="text-sm">
            Fermer
          </Button>
        </div>
      </div>

      {/* Modal de report */}
      <RescheduleInterviewModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        interview={interview}
        onReschedule={handleReschedule}
        isLoading={isRescheduling}
      />
    </Modal>
  );
}
