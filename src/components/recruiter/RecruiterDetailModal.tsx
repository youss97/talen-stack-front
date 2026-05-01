"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import StatusChangeModal from "./StatusChangeModal";
import StatusHistoryModal from "./StatusHistoryModal";
import FeedbackListModal from "./FeedbackListModal";
import FeedbackModal from "./FeedbackModal";
import SendEmailModal from "./SendEmailModal";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import EditInterviewNotesModal from "../interviews/EditInterviewNotesModal";
import CancelInterviewModal from "../interviews/CancelInterviewModal";
import { ToastContainer } from "@/components/ui/toast/Toast";
import { useToast } from "@/hooks/useToast";
import type { Recruiter } from "@/types/recruiter";
import type { CreateInterviewRequest, UpdateInterviewRequest, Interview } from "@/types/interview";
import { useAppSelector } from "@/lib/hooks";
import { 
  useChangeApplicationStatusMutation,
  useLazyGetApplicationStatusHistoryQuery,
  useCreateFeedbackMutation,
  useSendApplicationEmailMutation,
  useGetRecruiterByIdQuery,
} from "@/lib/services/recruiterApi";
import { useGetApplicationStatusesQuery } from "@/lib/services/applicationStatusApi";
import { useCreateInterviewMutation, useGetApplicationInterviewsQuery, useUpdateInterviewNotesMutation, useCancelInterviewMutation } from "@/lib/services/interviewApi";
import { formatDateTime } from "@/utils/dateFormat";

interface RecruiterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recruiterId: string | null; // Changer pour passer l'ID au lieu de l'objet
  isLoading?: boolean;
  onStatusUpdate?: (recruiterId: string, newStatus: string) => Promise<void>;
  canAddFeedback?: boolean;
}

export default function RecruiterDetailModal({
  isOpen,
  onClose,
  recruiterId,
  isLoading: externalLoading = false,
  onStatusUpdate,
  canAddFeedback = true,
}: RecruiterDetailModalProps) {
  // Utiliser la query pour récupérer les données en temps réel
  const { data: recruiter, isLoading: isLoadingRecruiter } = useGetRecruiterByIdQuery(
    recruiterId || '', 
    { skip: !recruiterId || !isOpen }
  );
  
  const isLoading = externalLoading || isLoadingRecruiter;
  // Récupérer les statuts de candidature
  const { data: applicationStatusesData } = useGetApplicationStatusesQuery({
    page: 1,
    limit: 100,
    is_active: true
  });

  const applicationStatuses = applicationStatusesData?.data || [];

  // Convertir les statuts en format attendu par StatusChangeModal
  const STATUS_OPTIONS = applicationStatuses.map(status => ({
    value: status.name,
    label: status.name,
    color: status.color?.toLowerCase() || "gray"
  }));

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusObj) return "light";
    
    // Mapper les couleurs selon le type de statut
    switch (statusObj.color?.toLowerCase()) {
      case "blue":
      case "info":
        return "info";
      case "yellow":
      case "warning":
        return "warning";
      case "green":
      case "success":
        return "success";
      case "red":
      case "error":
      case "danger":
        return "error";
      default:
        return "light";
    }
  };
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAddFeedbackModalOpen, setIsAddFeedbackModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isScheduleInterviewModalOpen, setIsScheduleInterviewModalOpen] = useState(false);
  const [isEditInterviewNotesModalOpen, setIsEditInterviewNotesModalOpen] = useState(false);
  const [isCancelInterviewModalOpen, setIsCancelInterviewModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  
  const { toasts, removeToast, success, error: showError } = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const [changeStatus, { isLoading: isChangingStatus }] = useChangeApplicationStatusMutation();
  const [getHistory, { data: statusHistory, isLoading: isLoadingHistory }] = 
    useLazyGetApplicationStatusHistoryQuery();
  const [createFeedback, { isLoading: isCreatingFeedback }] = useCreateFeedbackMutation();
  const [sendEmail, { isLoading: isSendingEmail }] = useSendApplicationEmailMutation();
  const [createInterview, { isLoading: isCreatingInterview }] = useCreateInterviewMutation();
  const [updateInterviewNotes, { isLoading: isUpdatingNotes }] = useUpdateInterviewNotesMutation();
  const [cancelInterview, { isLoading: isCancellingInterview }] = useCancelInterviewMutation();
  
  // Récupérer les entretiens de cette candidature
  const { data: interviews = [], isLoading: isLoadingInterviews } = useGetApplicationInterviewsQuery(
    recruiter?.id || '', 
    { skip: !recruiter?.id }
  );
  
  if (!recruiter && !isLoading) return null;

  const handleStatusChange = async (newStatus: string, note: string) => {
    if (!recruiter) return;
    
    try {
      console.log('🔄 Changement de statut:', { 
        applicationId: recruiter.id, 
        oldStatus: recruiter.status, 
        newStatus, 
        note 
      });

      // Effectuer la mutation qui invalide automatiquement les tags
      const result = await changeStatus({
        id: recruiter.id,
        new_status: newStatus,
        note,
      }).unwrap();
      
      console.log('✅ Statut changé avec succès:', result);
      
      success(
        "Statut modifié", 
        `Le statut a été changé de "${getStatusLabel(recruiter.status)}" vers "${getStatusLabel(newStatus)}"`
      );
      
      setIsStatusModalOpen(false);
      
      // Le cache RTK Query sera automatiquement mis à jour grâce aux tags invalidés
      // Pas besoin de callback onStatusUpdate car les données se mettent à jour automatiquement
      
    } catch (error: any) {
      console.error("❌ Erreur lors du changement de statut:", error);
      console.error("Détails de l'erreur:", {
        status: error?.status,
        data: error?.data,
        message: error?.data?.message || error?.message
      });
      
      const errorMessage = error?.data?.message || error?.message || 'Erreur lors du changement de statut';
      showError("Erreur", errorMessage);
    }
  };

  const handleOpenHistory = () => {
    if (recruiter) {
      getHistory(recruiter.id);
      setIsHistoryModalOpen(true);
    }
  };

  const handleOpenFeedbacks = () => {
    if (recruiter) {
      setIsFeedbackModalOpen(true);
    }
  };

  const handleCreateFeedback = async (title: string, description: string) => {
    if (!recruiter) return;
    
    try {
      const result = await createFeedback({
        id: recruiter.id,
        title,
        description,
      }).unwrap();
      
      console.log('✅ Feedback créé avec succès:', result);
      
      setIsAddFeedbackModalOpen(false);
      setIsFeedbackModalOpen(false);
      
      success("Feedback ajouté", "Le feedback a été ajouté avec succès");
      
      // RTK Query invalide automatiquement les tags, pas besoin de refetch manuel
    } catch (err: any) {
      console.error("❌ Error creating feedback:", err);
      console.error("Error details:", {
        status: err?.status,
        data: err?.data,
        message: err?.data?.message || err?.message
      });
      showError("Erreur", err?.data?.message || err?.message || 'Erreur lors de l\'ajout du feedback');
      throw err;
    }
  };

  const handleSendEmail = async (recipients: ('candidate' | 'client')[], subject: string, message: string) => {
    if (!recruiter) return;
    
    try {
      const result = await sendEmail({
        id: recruiter.id,
        recipients,
        subject,
        message,
      }).unwrap();
      
      console.log('✅ Email envoyé:', result);
      success("Email envoyé", result.message);
      setIsSendEmailModalOpen(false);
    } catch (err: any) {
      console.error("❌ Error sending email:", err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de l\'envoi de l\'email';
      showError("Erreur", errorMessage);
      throw err;
    }
  };

  const handleScheduleInterview = async (data: CreateInterviewRequest) => {
    if (!recruiter) return;
    
    try {
      const result = await createInterview({
        applicationId: recruiter.id,
        data,
      }).unwrap();
      
      console.log('✅ Entretien créé:', result);
      success(
        "Entretien créé",
        data.send_email_automatically 
          ? 'Un email a été envoyé au candidat' 
          : 'L\'entretien a été créé avec succès'
      );
      setIsScheduleInterviewModalOpen(false);
    } catch (err: any) {
      console.error("❌ Error creating interview:", err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de la création de l\'entretien';
      showError("Erreur", errorMessage);
      throw err;
    }
  };

  const handleEditInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsEditInterviewNotesModalOpen(true);
  };

  const handleUpdateInterviewNotes = async (data: { notes?: string; title?: string; internal_notes?: string }) => {
    if (!selectedInterview) return;
    
    try {
      const result = await updateInterviewNotes({
        id: selectedInterview.id,
        ...data,
      }).unwrap();
      
      console.log('✅ Entretien modifié:', result);
      success("Entretien modifié", "L'entretien a été modifié et un email a été envoyé");
      setIsEditInterviewNotesModalOpen(false);
      setSelectedInterview(null);
    } catch (err: any) {
      console.error("❌ Error updating interview:", err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de la modification de l\'entretien';
      showError("Erreur", errorMessage);
      throw err;
    }
  };

  const handleCancelInterview = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsCancelInterviewModalOpen(true);
  };

  const handleConfirmCancelInterview = async (reason: string) => {
    if (!selectedInterview) return;
    
    try {
      const result = await cancelInterview({
        id: selectedInterview.id,
        reason,
      }).unwrap();
      
      console.log('✅ Entretien annulé:', result);
      success("Entretien annulé", result.message);
      setIsCancelInterviewModalOpen(false);
      setSelectedInterview(null);
    } catch (err: any) {
      console.error("❌ Error cancelling interview:", err);
      const errorMessage = err?.data?.message || err?.message || 'Erreur lors de l\'annulation de l\'entretien';
      showError("Erreur", errorMessage);
      throw err;
    }
  };

  const getFeedbackCardColor = (feedback: any) => {
    const roleCode = feedback?.created_by?.role?.code;
    
    if (roleCode?.startsWith('CLIENT_MANAGER_')) {
      return "bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-600";
    } else if (roleCode === 'rh' || roleCode === 'admin') {
      return "bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600";
    } else {
      return "bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600";
    }
  };

  return (
    <>
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Détails de la candidature
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : recruiter ? (
          <div className="space-y-6">
            {/* Informations du CV */}
            {recruiter.cv && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Candidat
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem 
                      label="Nom" 
                      value={`${recruiter.cv.candidate_first_name || ""} ${recruiter.cv.candidate_last_name || ""}`.trim() || "-"} 
                    />
                    <DetailItem label="Email" value={recruiter.cv.candidate_email || "-"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Téléphone" value={recruiter.cv.candidate_phone || "-"} />
                  </div>
                  {recruiter.cv.skills && recruiter.cv.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Compétences</p>
                      <div className="flex flex-wrap gap-2">
                        {recruiter.cv.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {recruiter.cv.file_path && (
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                          window.open(`${apiUrl}/${recruiter.cv?.file_path}`, '_blank');
                        }}
                      >
                        📄 Voir le CV
                      </Button>
                      {recruiter.cv.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                              const token = localStorage.getItem('token');
                              
                              const response = await fetch(`${apiUrl}/cvs/${recruiter.cv?.id}/anonymized`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (!response.ok) {
                                throw new Error('Erreur lors du téléchargement');
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `cv-anonymise-${recruiter.cv?.id.substring(0, 8)}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (err) {
                              console.error('Erreur:', err);
                              showError('Erreur', 'Erreur lors du téléchargement du CV anonymisé');
                            }
                          }}
                        >
                          🔒 CV Anonymisé
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations de la demande */}
            {recruiter.request && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Demande de recrutement
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Titre" value={recruiter.request.title || "-"} />
                    <DetailItem label="Référence" value={recruiter.request.reference || "-"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Statut" value={recruiter.request.status || "-"} />
                    {recruiter.request.client && (
                      <DetailItem label="Client" value={recruiter.request.client.name || "-"} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section Entretiens - toujours visible */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Entretiens ({interviews.length})
                </h3>
                <Button
                  onClick={() => setIsScheduleInterviewModalOpen(true)}
                  variant="outline"
                  className="text-xs px-3 py-1"
                >
                  📅 Planifier
                </Button>
              </div>
              
              {isLoadingInterviews ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : interviews.length > 0 ? (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(interview.scheduled_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              à {new Date(interview.scheduled_date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <Badge 
                              color={interview.status === 'scheduled' ? 'info' : 
                                     interview.status === 'completed' ? 'success' : 
                                     interview.status === 'cancelled' ? 'error' : 'warning'}
                            >
                              {interview.status === 'scheduled' ? 'Planifié' :
                               interview.status === 'completed' ? 'Terminé' :
                               interview.status === 'cancelled' ? 'Annulé' :
                               interview.status === 'rescheduled' ? 'Reporté' : interview.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Type:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                {interview.type === 'online' ? '🌐 En ligne' : '📍 Présentiel'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Durée:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                {interview.duration_minutes} min
                              </span>
                            </div>
                          </div>
                          
                          {interview.location && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Lieu:</span>
                              <span className="ml-2 text-gray-900 dark:text-white">
                                {interview.location}
                              </span>
                            </div>
                          )}
                          
                          {interview.meeting_link && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Lien:</span>
                              <a 
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-brand-600 dark:text-brand-400 hover:underline"
                              >
                                Rejoindre la réunion
                              </a>
                            </div>
                          )}
                          
                          {interview.notes && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                              <p className="mt-1 text-gray-900 dark:text-white">
                                {interview.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleEditInterview(interview)}
                            variant="outline"
                            className="text-xs px-2 py-1"
                          >
                            ✏️ Notes
                          </Button>
                          <Button
                            onClick={() => handleCancelInterview(interview)}
                            variant="outline"
                            className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            ❌ Annuler
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">Aucun entretien planifié</p>
                  <Button
                    onClick={() => setIsScheduleInterviewModalOpen(true)}
                    variant="outline"
                    className="mt-2 text-xs"
                  >
                    📅 Planifier le premier entretien
                  </Button>
                </div>
              )}
            </div>

            {/* Informations du recruteur */}
            {recruiter.recruiter && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Recruteur
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem 
                      label="Nom" 
                      value={`${recruiter.recruiter.first_name || ""} ${recruiter.recruiter.last_name || ""}`.trim() || "-"} 
                    />
                    <DetailItem label="Email" value={recruiter.recruiter.email || "-"} />
                  </div>
                  {recruiter.recruiter.role && (
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Rôle" value={recruiter.recruiter.role.name || "-"} />
                      {recruiter.recruiter.company && (
                        <DetailItem label="Société" value={recruiter.recruiter.company.name || "-"} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes du recruteur */}
            {recruiter.recruiter_notes && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Notes du recruteur
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {recruiter.recruiter_notes}
                </p>
              </div>
            )}

            {/* Feedbacks */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Feedbacks
                </h3>
                <div className="flex items-center gap-2">
                  {recruiter.feedbacks && recruiter.feedbacks.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenFeedbacks}
                    >
                      Voir tous ({recruiter.feedbacks.length})
                    </Button>
                  )}
                  {canAddFeedback && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsAddFeedbackModalOpen(true)}
                    >
                      Ajouter un feedback
                    </Button>
                  )}
                </div>
              </div>
              
              {recruiter.feedbacks && recruiter.feedbacks.length > 0 ? (
                <div className="space-y-3">
                  {recruiter.feedbacks.slice(0, 2).map((feedback) => (
                    <div 
                      key={feedback.id}
                      className={`rounded-lg p-4 border-l-4 ${getFeedbackCardColor(feedback)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {feedback.title}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-2 mb-3">
                        {feedback.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {feedback.created_by.first_name} {feedback.created_by.last_name}
                          </span>
                          {feedback.created_by.role && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500 dark:text-gray-500">
                                {feedback.created_by.role.name}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-gray-500 dark:text-gray-500">
                          {formatDateTime(feedback.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recruiter.feedbacks.length > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      +{recruiter.feedbacks.length - 2} autre{recruiter.feedbacks.length - 2 > 1 ? "s" : ""} feedback{recruiter.feedbacks.length - 2 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Aucun feedback pour le moment
                </p>
              )}
            </div>

            {/* Statut de l'application */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Statut de l'application
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  color={getStatusColor(recruiter.status) as "success" | "error" | "warning" | "info" | "light"}
                  variant="light"
                >
                  {getStatusLabel(recruiter.status)}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  Changer le statut
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenHistory}
                >
                  Voir l'historique
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSendEmailModalOpen(true)}
                >
                  📧 Envoyer un email
                </Button>
              </div>
            </div>

            {/* Date de proposition */}
            {recruiter.proposed_at && (
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Date de proposition
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  {new Date(recruiter.proposed_at).toLocaleDateString("fr-FR", {
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
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>

    {/* Status Change Modal */}
    <StatusChangeModal
      isOpen={isStatusModalOpen}
      onClose={() => setIsStatusModalOpen(false)}
      onSubmit={handleStatusChange}
      currentStatus={recruiter?.status || "proposed"}
      isLoading={isChangingStatus}
      availableStatuses={STATUS_OPTIONS}
    />

    {/* Status History Modal */}
    <StatusHistoryModal
      isOpen={isHistoryModalOpen}
      onClose={() => setIsHistoryModalOpen(false)}
      history={statusHistory || []}
      isLoading={isLoadingHistory}
      getStatusLabel={getStatusLabel}
      getStatusColor={getStatusColor}
    />

    {/* Feedback List Modal */}
    <FeedbackListModal
      isOpen={isFeedbackModalOpen}
      onClose={() => setIsFeedbackModalOpen(false)}
      feedbacks={recruiter?.feedbacks || []}
      isLoading={false}
      onCreateFeedback={handleCreateFeedback}
      isCreating={isCreatingFeedback}
      canAddFeedback={canAddFeedback}
    />

    {/* Add Feedback Modal (direct) */}
    <FeedbackModal
      isOpen={isAddFeedbackModalOpen}
      onClose={() => setIsAddFeedbackModalOpen(false)}
      onSubmit={handleCreateFeedback}
      isLoading={isCreatingFeedback}
    />

    {/* Send Email Modal */}
    <SendEmailModal
      isOpen={isSendEmailModalOpen}
      onClose={() => setIsSendEmailModalOpen(false)}
      onSubmit={handleSendEmail}
      isLoading={isSendingEmail}
      candidateEmail={recruiter?.cv?.candidate_email}
      clientEmail={recruiter?.request?.client?.email}
      candidateName={`${recruiter?.cv?.candidate_first_name || ''} ${recruiter?.cv?.candidate_last_name || ''}`.trim()}
      clientName={recruiter?.request?.client?.name}
    />

    {/* Schedule Interview Modal */}
    <ScheduleInterviewModal
      isOpen={isScheduleInterviewModalOpen}
      onClose={() => setIsScheduleInterviewModalOpen(false)}
      onSubmit={(data) => handleScheduleInterview(data as CreateInterviewRequest)}
      isLoading={isCreatingInterview}
      candidateEmail={recruiter?.cv?.candidate_email || ''}
      candidateName={`${recruiter?.cv?.candidate_first_name || ''} ${recruiter?.cv?.candidate_last_name || ''}`.trim()}
    />

    {/* Edit Interview Notes Modal */}
    <EditInterviewNotesModal
      isOpen={isEditInterviewNotesModalOpen}
      onClose={() => {
        setIsEditInterviewNotesModalOpen(false);
        setSelectedInterview(null);
      }}
      onSubmit={handleUpdateInterviewNotes}
      isLoading={isUpdatingNotes}
      interview={selectedInterview}
    />

    {/* Cancel Interview Modal */}
    <CancelInterviewModal
      isOpen={isCancelInterviewModalOpen}
      onClose={() => {
        setIsCancelInterviewModalOpen(false);
        setSelectedInterview(null);
      }}
      onConfirm={handleConfirmCancelInterview}
      isLoading={isCancellingInterview}
      interview={selectedInterview}
    />
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
    </div>
  );
}
