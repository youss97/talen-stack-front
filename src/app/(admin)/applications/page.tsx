"use client";
import { useState, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import DataTableWithSelection from "@/components/tables/DataTableWithSelection";
import BulkActions from "@/components/tables/BulkActions";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import RecruiterFormModal from "@/components/recruiter/RecruiterFormModal";
import RecruiterDetailModal from "@/components/recruiter/RecruiterDetailModal";
import BulkEmailModal from "@/components/recruiter/BulkEmailModal";
import CreateInterviewSimpleModal from "@/components/interviews/CreateInterviewSimpleModal";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import {
  useGetRecruitersQuery,
  useGetRecruiterByIdQuery,
  useLazyGetRecruiterByIdQuery,
  useCreateRecruiterMutation,
  useUpdateRecruiterMutation,
  useDeleteRecruiterMutation,
  useActivateApplicationMutation,
  useSendApplicationEmailMutation,
} from "@/lib/services/recruiterApi";
import { useGetApplicationStatusesQuery } from "@/lib/services/applicationStatusApi";
import { useGetClientsForSelectInfiniteQuery } from "@/lib/services/clientApi";
import { useGetApplicationRequestsForSelectInfiniteQuery } from "@/lib/services/applicationRequestApi";
import { useCreateInterviewMutation } from "@/lib/services/interviewApi";
import { useActions } from "@/hooks/useActions";
import { exportCandidaturesToExcel, type ExportableCandidate } from "@/utils/excelExport";
import { EmailIcon, CalendarIcon } from "@/components/tables/DataTableWithSelection";
import type { Recruiter } from "@/types/recruiter";
import type { CreateRecruiterRequest, UpdateRecruiterRequest, WorkflowStatus } from "@/types/recruiter";
import type { CreateInterviewRequest } from "@/types/interview";

export default function ApplicationsPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/applications");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<WorkflowStatus | "">("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Form for filters
  const { control, watch } = useForm({
    defaultValues: {
      clientFilter: "",
      requestFilter: "",
    },
  });

  const clientFilter = watch("clientFilter");
  const requestFilter = watch("requestFilter");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Recruiter | null>(null);
  const [detailApplicationId, setDetailApplicationId] = useState<string | null>(null);
  const [interviewCandidate, setInterviewCandidate] = useState<Recruiter | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    application: Recruiter | null;
  }>({ isOpen: false, application: null });
  const [activateModal, setActivateModal] = useState<{
    isOpen: boolean;
    application: Recruiter | null;
    action: 'activate' | 'deactivate';
  }>({ isOpen: false, application: null, action: 'activate' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message?: string
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const { data, isLoading, isFetching, refetch } = useGetRecruitersQuery({
    page,
    limit: 5,
    search: search || undefined,
    status: statusFilter || undefined,
    workflow_status: workflowStatusFilter || undefined,
    client_id: clientFilter || undefined,
    request_id: requestFilter || undefined,
  });

  // Récupérer les statuts de candidature
  const { data: applicationStatusesData } = useGetApplicationStatusesQuery({
    page: 1,
    limit: 100,
    is_active: true
  });

  const [createApplication, { isLoading: isCreating }] = useCreateRecruiterMutation();
  const [updateApplication, { isLoading: isUpdating }] = useUpdateRecruiterMutation();
  const [deleteApplication] = useDeleteRecruiterMutation();
  const [activateApplication] = useActivateApplicationMutation();
  const [sendApplicationEmail] = useSendApplicationEmailMutation();
  const [createInterview, { isLoading: isCreatingInterview }] = useCreateInterviewMutation();
  const [getApplicationById, { isLoading: isLoadingApplication }] = useLazyGetRecruiterByIdQuery();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const applicationStatuses = applicationStatusesData?.data || [];

  const getStatusLabel = (status: string) => {
    const statusObj = applicationStatuses.find(s => s.name === status);
    return statusObj?.name || status;
  };

  const getStatusColor = (status: string) => {
    const statusObj = applicationStatuses.find(s => s.name === status);
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

  // Nouvelles fonctions pour la multi-sélection
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItems(selectedIds);
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      // Supprimer chaque application individuellement
      const results = await Promise.allSettled(
        selectedItems.map(id => deleteApplication(id).unwrap())
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed > 0) {
        addToast("warning", "Suppression partielle", 
          `${successful} candidature(s) supprimée(s). ${failed} erreur(s).`);
      } else {
        addToast("success", "Succès", `${successful} candidature(s) supprimée(s) avec succès`);
      }
      
      setSelectedItems([]);
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression des candidatures"));
      throw error;
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkEmail = () => {
    setIsBulkEmailModalOpen(true);
  };

  const handleSendBulkEmail = async (emailData: { subject: string; message: string; recipients: ('candidate' | 'client')[] }) => {
    setIsSendingEmail(true);
    try {
      await Promise.all(
        selectedItems.map(id => 
          sendApplicationEmail({
            id,
            recipients: emailData.recipients,
            subject: emailData.subject,
            message: emailData.message,
          }).unwrap()
        )
      );
      addToast("success", "Succès", `Emails envoyés à ${selectedItems.length} candidature(s)`);
      setSelectedItems([]);
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de l'envoi des emails"));
      throw error;
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Actions directes sur les lignes
  const handleSendEmail = (application: Recruiter) => {
    // Ouvrir le modal d'email pour une seule candidature
    setSelectedItems([application.id]);
    setIsBulkEmailModalOpen(true);
  };

  const handleScheduleInterview = (application: Recruiter) => {
    setInterviewCandidate(application);
    setIsInterviewModalOpen(true);
  };

  const handleCreateInterview = async (applicationId: string, data: CreateInterviewRequest) => {
    try {
      await createInterview({ applicationId, data }).unwrap();
      addToast("success", "Succès", "Entretien créé avec succès");
      setIsInterviewModalOpen(false);
      setInterviewCandidate(null);
    } catch (error: any) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la création de l'entretien"));
      throw error;
    }
  };

  const columns = [
    {
      key: "cv" as keyof Recruiter,
      header: "Candidat",
      render: (value: unknown) => {
        const cv = value as { candidate_first_name: string; candidate_last_name: string; candidate_email: string };
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {cv?.candidate_first_name} {cv?.candidate_last_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{cv?.candidate_email || "-"}</div>
          </div>
        );
      },
    },
    {
      key: "request" as keyof Recruiter,
      header: "Demande",
      render: (value: unknown) => {
        const request = value as { title: string; reference: string };
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{request?.title || "-"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Réf: {request?.reference || "-"}</div>
          </div>
        );
      },
    },
    {
      key: "workflow_status",
      header: "Workflow",
      render: (value: any, row: Recruiter) => {
        const status = (value as string) || 'draft';
        const isActive = status === 'active';
        
        return (
          <div className="flex items-center gap-2">
            {canUpdate ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleWorkflowClick(row);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-success-100 text-success-700 hover:bg-success-200 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20'
                    : 'bg-warning-100 text-warning-700 hover:bg-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:hover:bg-warning-500/20'
                }`}
                title={isActive ? "Cliquer pour désactiver" : "Cliquer pour activer"}
              >
                {isActive ? "✓ Active" : "○ Brouillon"}
              </button>
            ) : (
              <Badge color={isActive ? "success" : "warning"} variant="light" size="sm">
                {isActive ? "Active" : "Brouillon"}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      render: (value: any) => (
        <Badge
          color={getStatusColor(value as string) as "success" | "error" | "warning" | "info" | "light"}
          variant="light"
          size="sm"
        >
          {getStatusLabel(value as string)}
        </Badge>
      ),
    },
    {
      key: "recruiter_notes",
      header: "Notes",
      render: (value: any) => (
        <span className="truncate max-w-[200px] block">
          {(value as string) || "-"}
        </span>
      ),
    },
  ];

  // Actions personnalisées pour chaque ligne
  const customActions = [
    {
      label: "Envoyer email",
      icon: <EmailIcon />,
      onClick: handleSendEmail,
      color: 'primary' as const,
    },
    {
      label: "Planifier entretien",
      icon: <CalendarIcon />,
      onClick: handleScheduleInterview,
      color: 'success' as const,
    },
  ];

  const handleRowClick = async (application: Recruiter) => {
    setDetailApplicationId(application.id);
    setIsDetailModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedApplication(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (application: Recruiter) => {
    // Charger les données complètes avant d'ouvrir le modal
    setIsFormModalOpen(true);
    setSelectedApplication(null); // Afficher un loading
    try {
      const fullData = await getApplicationById(application.id).unwrap();
      setSelectedApplication(fullData);
    } catch (error) {
      console.error("Error loading application data:", error);
      addToast("error", "Erreur", "Impossible de charger les données de la candidature");
      setIsFormModalOpen(false);
      setSelectedApplication(null); // Réinitialiser pour éviter de bloquer
    }
  };

  const handleDeleteClick = (application: Recruiter) => {
    setConfirmModal({ isOpen: true, application });
  };

  const handleActivateClick = (application: Recruiter) => {
    setActivateModal({ isOpen: true, application, action: 'activate' });
  };

  const handleToggleWorkflowClick = (application: Recruiter) => {
    const isActive = application.workflow_status === 'active';
    setActivateModal({ 
      isOpen: true, 
      application, 
      action: isActive ? 'deactivate' : 'activate' 
    });
  };

  const handleConfirmActivate = async () => {
    if (!activateModal.application) return;

    setIsActivating(true);
    try {
      if (activateModal.action === 'activate') {
        await activateApplication(activateModal.application.id).unwrap();
        addToast("success", "Succès", "Candidature activée avec succès");
      } else {
        // Désactiver = remettre en brouillon
        await updateApplication({
          id: activateModal.application.id,
          data: { workflow_status: 'draft' },
        }).unwrap();
        addToast("success", "Succès", "Candidature désactivée avec succès");
      }
      setActivateModal({ isOpen: false, application: null, action: 'activate' });
    } catch (error) {
      const action = activateModal.action === 'activate' ? 'activation' : 'désactivation';
      addToast("error", "Erreur", getErrorMessage(error, `Erreur lors de l'${action} de la candidature`));
    } finally {
      setIsActivating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.application) return;

    setIsDeleting(true);
    try {
      await deleteApplication(confirmModal.application.id).unwrap();
      addToast("success", "Succès", "Application supprimée avec succès");
      setConfirmModal({ isOpen: false, application: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression de l'application"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedApplication) {
        await updateApplication({
          id: selectedApplication.id,
          data: data as UpdateRecruiterRequest,
        }).unwrap();
        addToast("success", "Succès", "Application modifiée avec succès");
      } else {
        await createApplication(data as CreateRecruiterRequest).unwrap();
        addToast("success", "Succès", "Application créée avec succès");
      }
      setIsFormModalOpen(false);
      setSelectedApplication(null);
    } catch (error) {
      const defaultMsg = selectedApplication
        ? "Erreur lors de la modification de l'application"
        : "Erreur lors de la création de l'application";
      addToast("error", "Erreur", getErrorMessage(error, defaultMsg));
    }
  };

  const handleExportExcel = () => {
    if (!data?.data || data.data.length === 0) {
      addToast("warning", "Aucune donnée", "Aucune candidature à exporter");
      return;
    }

    try {
      // Convertir les données au format attendu par l'export
      const exportableData: ExportableCandidate[] = data.data.map(application => ({
        id: application.id,
        cv: application.cv,
        request: application.request,
        status: application.status,
        proposed_at: application.proposed_at,
        recruiter: application.recruiter,
        recruiter_notes: application.recruiter_notes,
        feedbacks: application.feedbacks,
      }));

      const result = exportCandidaturesToExcel(exportableData, 'candidatures');
      addToast("success", "Export réussi", `${result.count} candidature(s) exportée(s) dans ${result.filename}`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'exporter les données vers Excel";
      addToast("error", "Erreur d'export", errorMessage);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Candidatures
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les candidatures
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleExportExcel}
              variant="outline"
              disabled={!data?.data || data.data.length === 0}
            >
              📊 Exporter Excel
            </Button>
            {canCreate && (
              <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
                Créer une nouvelle candidature
              </Button>
            )}
          </div>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher dans les notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <Controller
                name="clientFilter"
                control={control}
                render={({ field }) => (
                  <InfiniteSelect
                    label=""
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setPage(1);
                    }}
                    useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                    itemLabelKey="name"
                    itemValueKey="id"
                    placeholder="Tous les clients"
                    emptyMessage="Aucun client trouvé"
                  />
                )}
              />
            </div>
            <div>
              <Controller
                name="requestFilter"
                control={control}
                render={({ field }) => (
                  <InfiniteSelect
                    label=""
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setPage(1);
                    }}
                    useInfiniteQuery={useGetApplicationRequestsForSelectInfiniteQuery}
                    itemLabelKey="title"
                    itemValueKey="id"
                    placeholder="Toutes les demandes"
                    emptyMessage="Aucune demande trouvée"
                  />
                )}
              />
            </div>
            <div>
              <select
                value={workflowStatusFilter}
                onChange={(e) => {
                  setWorkflowStatusFilter(e.target.value as WorkflowStatus | "");
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les workflows</option>
                <option value="draft">Brouillon</option>
                <option value="active">Active</option>
                <option value="archived">Archivée</option>
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les statuts</option>
                {applicationStatuses.map((status) => (
                  <option key={status.id} value={status.name}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <BulkActions
          selectedCount={selectedItems.length}
          onClearSelection={handleClearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkEmail={handleBulkEmail}
          isDeleting={isBulkDeleting}
        />

        <DataTableWithSelection
          columns={columns}
          data={data?.data || []}
          selectedItems={selectedItems}
          onSelectionChange={handleSelectionChange}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          customActions={customActions}
          emptyMessage="Aucune application trouvée"
        />

        {data && data.pagination && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <RecruiterFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedApplication(null);
        }}
        onSubmit={handleFormSubmit}
        recruiter={selectedApplication}
        isLoading={isCreating || isUpdating}
      />

      <RecruiterDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailApplicationId(null);
        }}
        recruiterId={detailApplicationId}
        isLoading={false}
        canAddFeedback={true}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, application: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'application"
        message={`Êtes-vous sûr de vouloir supprimer cette application ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={activateModal.isOpen}
        onClose={() => setActivateModal({ isOpen: false, application: null, action: 'activate' })}
        onConfirm={handleConfirmActivate}
        title={activateModal.action === 'activate' ? "Activer la candidature" : "Désactiver la candidature"}
        message={
          activateModal.action === 'activate'
            ? "Êtes-vous sûr de vouloir activer cette candidature ? Elle deviendra visible pour le manager."
            : "Êtes-vous sûr de vouloir désactiver cette candidature ? Elle ne sera plus visible pour le manager."
        }
        confirmText={activateModal.action === 'activate' ? "Activer" : "Désactiver"}
        cancelText="Annuler"
        variant={activateModal.action === 'activate' ? "info" : "warning"}
        isLoading={isActivating}
      />

      {/* Modal d'email groupé */}
      <BulkEmailModal
        isOpen={isBulkEmailModalOpen}
        onClose={() => {
          setIsBulkEmailModalOpen(false);
          // Si on était en mode email individuel, nettoyer la sélection
          if (selectedItems.length === 1) {
            setSelectedItems([]);
          }
        }}
        onSend={handleSendBulkEmail}
        selectedCandidates={data?.data?.filter(a => selectedItems.includes(a.id)) || []}
        isLoading={isSendingEmail}
      />

      {/* Modal de planification d'entretien */}
      {interviewCandidate && (
        <CreateInterviewSimpleModal
          isOpen={isInterviewModalOpen}
          onClose={() => {
            setIsInterviewModalOpen(false);
            setInterviewCandidate(null);
          }}
          onSubmit={handleCreateInterview}
          application={interviewCandidate}
          isLoading={isCreatingInterview}
        />
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4.16667V15.8333M4.16667 10H15.8333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


