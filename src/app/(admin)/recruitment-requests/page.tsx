"use client";
import React, { useState, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import ApplicationRequestFormModal from "@/components/applicationRequest/ApplicationRequestFormModal";
import ApplicationRequestDetailModal from "@/components/applicationRequest/ApplicationRequestDetailModal";
import PublicOfferToggleSimple from "@/components/recruitment/PublicOfferToggleSimple";
import PublicStatusCell from "@/components/recruitment/PublicStatusCell";
import AssignModal from "@/components/assign/AssignModal";
import {
  useGetApplicationRequestsQuery,
  useLazyGetApplicationRequestByIdQuery,
  useCreateApplicationRequestMutation,
  useUpdateApplicationRequestMutation,
  useDeleteApplicationRequestMutation,
  useAssignApplicationRequestMutation,
} from "@/lib/services/applicationRequestApi";
import { publicJobOfferApi } from "@/lib/services/publicJobOfferApi";
import { useAppDispatch } from "@/lib/hooks";
import { useActions } from "@/hooks/useActions";
import { exportApplicationRequestsToExcel } from "@/utils/excelExport";
import { formatDate } from "@/utils/dateFormat";
import type { ApplicationRequest, UpdateApplicationRequestRequest } from "@/types/applicationRequest";
import type { CreateApplicationRequestFormData } from "@/validations/applicationRequestValidation";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function RecruitmentPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/recruitment-requests");
  const canAssign = canUpdate;
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [requiredSkillsFilter, setRequiredSkillsFilter] = useState<string>("");
  const [experienceLevelFilter, setExperienceLevelFilter] = useState<string>("");
  const [contractTypeFilter, setContractTypeFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApplicationRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<ApplicationRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    request: ApplicationRequest | null;
  }>({ isOpen: false, request: null });
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    request: ApplicationRequest | null;
  }>({ isOpen: false, request: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [optimisticPublicStates, setOptimisticPublicStates] = useState<Record<string, boolean>>({});

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

  const limit = 5;

  const { data, isLoading, isFetching, refetch } = useGetApplicationRequestsQuery({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
    required_skills: requiredSkillsFilter || undefined,
    experience_level: experienceLevelFilter || undefined,
    contract_type: contractTypeFilter || undefined,
    location: locationFilter || undefined,
  });

  const [getRequestById, { isLoading: isLoadingRequest }] = useLazyGetApplicationRequestByIdQuery();
  const [createRequest, { isLoading: isCreating }] = useCreateApplicationRequestMutation();
  const [updateRequest, { isLoading: isUpdating }] = useUpdateApplicationRequestMutation();
  const [deleteRequest] = useDeleteApplicationRequestMutation();
  const [assignRequest] = useAssignApplicationRequestMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleAddClick = () => {
    setEditingRequest(null);
    setIsFormModalOpen(true);
  };

  const handleExportExcel = () => {
    if (!data?.data || data.data.length === 0) {
      addToast("warning", "Aucune donnée", "Aucune demande à exporter");
      return;
    }

    try {
      const result = exportApplicationRequestsToExcel(data.data, 'demandes-recrutement');
      addToast("success", "Export réussi", `${result.count} demande(s) exportée(s) dans ${result.filename}`);
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'exporter les données vers Excel";
      addToast("error", "Erreur d'export", errorMessage);
    }
  };

  const handleEditClick = async (request: ApplicationRequest) => {
    setIsFormModalOpen(true);
    setEditingRequest(null);
    
    try {
      const fullData = await getRequestById(request.id).unwrap();
      setEditingRequest(fullData);
    } catch (error) {
      console.error("Error loading request data:", error);
      addToast("error", "Erreur", "Impossible de charger les données de la demande");
      setIsFormModalOpen(false);
    }
  };

  const handleRowClick = async (request: ApplicationRequest) => {
    setIsDetailModalOpen(true);
    setIsLoadingDetail(true);
    setSelectedRequest(null);
    try {
      const fullData = await getRequestById(request.id).unwrap();
      setSelectedRequest(fullData);
    } catch {
      setSelectedRequest(request); // fallback to list data
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDeleteClick = (request: ApplicationRequest) => {
    setConfirmModal({ isOpen: true, request });
  };

  const handleAssignClick = (request: ApplicationRequest) => {
    setAssignModal({ isOpen: true, request });
  };

  const handleAssignRequest = async (responsibleIds: string[]) => {
    if (!assignModal.request) return;
    setIsAssigning(true);
    try {
      await assignRequest({ id: assignModal.request.id, responsible_ids: responsibleIds }).unwrap();
      addToast("success", "Succès", responsibleIds.length > 0 ? "Responsable(s) affecté(s) avec succès" : "Affectation(s) retirée(s) avec succès");
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de l'affectation"));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.request) return;

    setIsDeleting(true);
    try {
      await deleteRequest(confirmModal.request.id).unwrap();
      addToast("success", "Succès", "Demande supprimée avec succès");
      setConfirmModal({ isOpen: false, request: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression de la demande"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      await updateRequest({
        id: requestId,
        data: { status: newStatus as any },
      }).unwrap();
      addToast("success", "Succès", "Statut mis à jour avec succès");
      
      // Update the detail modal with the new status
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus as any });
      }
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la mise à jour du statut"));
      throw error;
    }
  };

  const handleFormSubmit = async (formData: CreateApplicationRequestFormData) => {
    try {
      if (editingRequest) {
        // Pour l'update, créer un objet avec seulement les champs définis
        const updateData: any = {};
        
        if (formData.title) updateData.title = formData.title;
        if (formData.description) updateData.description = formData.description;
        if (formData.required_skills) updateData.required_skills = formData.required_skills;
        if (formData.min_experience !== undefined) updateData.min_experience = formData.min_experience;
        if (formData.max_experience !== undefined) updateData.max_experience = formData.max_experience;
        if (formData.contract_types && formData.contract_types.length > 0) updateData.contract_types = formData.contract_types;
        if (formData.mission_duration_months !== undefined) updateData.mission_duration_months = formData.mission_duration_months;
        if (formData.mission_renewable !== undefined) updateData.mission_renewable = formData.mission_renewable;
        if (formData.min_salary !== undefined) updateData.min_salary = formData.min_salary;
        if (formData.max_salary !== undefined) updateData.max_salary = formData.max_salary;
        if (formData.daily_rate_min !== undefined) updateData.daily_rate_min = formData.daily_rate_min;
        if (formData.daily_rate_max !== undefined) updateData.daily_rate_max = formData.daily_rate_max;
        if (formData.location) updateData.location = formData.location;
        if (formData.country) updateData.country = formData.country;
        if (formData.work_type) updateData.work_type = formData.work_type;
        if (formData.remote_days_per_week !== undefined) updateData.remote_days_per_week = formData.remote_days_per_week;
        if (formData.remote_possible !== undefined) updateData.remote_possible = formData.remote_possible;
        if (formData.languages) updateData.languages = formData.languages;
        if (formData.benefits) updateData.benefits = formData.benefits;
        if (formData.bonuses) updateData.bonuses = formData.bonuses;
        if (formData.variables) updateData.variables = formData.variables;
        if (formData.priority) updateData.priority = formData.priority;
        if (formData.status) updateData.status = formData.status;
        if (formData.desired_start_date) updateData.desired_start_date = formData.desired_start_date;
        if (formData.number_of_profiles !== undefined) updateData.number_of_profiles = formData.number_of_profiles;
        if ((formData as any).currency) updateData.currency = (formData as any).currency;
        if ((formData as any).soft_skills) updateData.soft_skills = (formData as any).soft_skills;
        if ((formData as any).note_client !== undefined) updateData.note_client = (formData as any).note_client;
        if ((formData as any).note_interne !== undefined) updateData.note_interne = (formData as any).note_interne;

        await updateRequest({
          id: editingRequest.id,
          data: updateData,
        }).unwrap();
        addToast("success", "Succès", "Demande modifiée avec succès");
      } else {
        // Pour la création, envoyer seulement les champs définis
        const createData: any = {
          client_id: formData.client_id,
          manager_id: formData.manager_id,
          title: formData.title,
          description: formData.description,
          required_skills: formData.required_skills,
          contract_types: formData.contract_types || [],
          location: formData.location,
          country: formData.country,
          work_type: formData.work_type,
          languages: formData.languages,
          priority: formData.priority,
          number_of_profiles: formData.number_of_profiles,
        };
        
        // Ajouter les champs optionnels seulement s'ils sont définis
        if (formData.min_experience !== undefined && formData.min_experience !== null) {
          createData.min_experience = formData.min_experience;
        }
        if (formData.max_experience !== undefined && formData.max_experience !== null) {
          createData.max_experience = formData.max_experience;
        }
        if (formData.mission_duration_months !== undefined && formData.mission_duration_months !== null) {
          createData.mission_duration_months = formData.mission_duration_months;
        }
        if (formData.mission_renewable !== undefined) {
          createData.mission_renewable = formData.mission_renewable;
        }
        if (formData.min_salary !== undefined && formData.min_salary !== null) {
          createData.min_salary = formData.min_salary;
        }
        if (formData.max_salary !== undefined && formData.max_salary !== null) {
          createData.max_salary = formData.max_salary;
        }
        if (formData.daily_rate_min !== undefined && formData.daily_rate_min !== null) {
          createData.daily_rate_min = formData.daily_rate_min;
        }
        if (formData.daily_rate_max !== undefined && formData.daily_rate_max !== null) {
          createData.daily_rate_max = formData.daily_rate_max;
        }
        if (formData.remote_days_per_week !== undefined && formData.remote_days_per_week !== null) {
          createData.remote_days_per_week = formData.remote_days_per_week;
        }
        if (formData.remote_possible !== undefined) {
          createData.remote_possible = formData.remote_possible;
        }
        if (formData.benefits) {
          createData.benefits = formData.benefits;
        }
        if (formData.bonuses) {
          createData.bonuses = formData.bonuses;
        }
        if (formData.variables) {
          createData.variables = formData.variables;
        }
        if (formData.status) {
          createData.status = formData.status;
        }
        if (formData.desired_start_date) {
          createData.desired_start_date = formData.desired_start_date;
        }
        // Devise (MAD par défaut)
        createData.currency = (formData as any).currency || 'MAD';
        // Soft skills et notes
        if ((formData as any).soft_skills?.length) createData.soft_skills = (formData as any).soft_skills;
        if ((formData as any).note_client) createData.note_client = (formData as any).note_client;
        if ((formData as any).note_interne) createData.note_interne = (formData as any).note_interne;

        // Filtrer les skills invalides (tableaux vides, null, etc.)
        if (Array.isArray(createData.required_skills)) {
          createData.required_skills = createData.required_skills.filter(
            (s: any) => s && !Array.isArray(s) && (typeof s === 'string' ? s.trim() : s?.name?.trim())
          );
        }

        await createRequest({ ...createData, client_id: formData.client_id }).unwrap();

        addToast("success", "Succès", "Demande créée avec succès");
      }
      setIsFormModalOpen(false);
      setEditingRequest(null);
    } catch (error) {
      console.error('Error creating/updating request:', error);
      const defaultMsg = editingRequest
        ? "Erreur lors de la modification de la demande"
        : "Erreur lors de la création de la demande";
      addToast("error", "Erreur", getErrorMessage(error, defaultMsg));
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "Critique";
      case "high":
        return "Haute";
      case "medium":
        return "Moyenne";
      default:
        return "Basse";
    }
  };

  const handleTogglePublic = async (id: string, newState: boolean) => {
    // Mise à jour optimiste
    setOptimisticPublicStates(prev => ({
      ...prev,
      [id]: newState
    }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/applications/requests/${id}/toggle-public`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        addToast('success', 'Succès', newState ? 'Offre activée' : 'Offre désactivée');
        
        // Invalider les tags PublicJobOffer pour rafraîchir la page "Mes offres publiques"
        dispatch(publicJobOfferApi.util.invalidateTags(['PublicJobOffer']));
        
        // Refetch après un court délai
        setTimeout(async () => {
          await refetch();
          // Nettoyer l'état optimiste
          setOptimisticPublicStates(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
          });
        }, 300);
      } else {
        // Annuler l'état optimiste
        setOptimisticPublicStates(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        addToast('error', 'Erreur', 'Impossible de changer le statut');
      }
    } catch (error) {
      // Annuler l'état optimiste
      setOptimisticPublicStates(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      console.error('Erreur:', error);
      addToast('error', 'Erreur', 'Impossible de changer le statut');
      throw error;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "En cours";
      case "standby":
        return "Standby";
      case "abandoned":
        return "Abandonnée";
      case "filled":
        return "Comblée";
      case "open":
        return "Ouverte";
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

  const columns = [
    {
      key: "title" as keyof ApplicationRequest,
      header: "Demande",
      className: "min-w-[200px]",
      render: (value: unknown, row?: ApplicationRequest) => {
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{value as string || "-"}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Réf: {row?.reference || "-"}</div>
          </div>
        );
      },
    },
    {
      key: "id" as keyof ApplicationRequest,
      header: "Client",
      className: "min-w-[150px]",
      render: (_value: unknown, row?: ApplicationRequest) => {
        return <span className="truncate block max-w-[150px]">{row?.client?.name || "-"}</span>;
      },
    },
    {
      key: "contract_types" as keyof ApplicationRequest,
      header: "Contrat",
      className: "min-w-[100px]",
      render: (value: unknown, row: ApplicationRequest) => {
        const types = (value as string[]) || (row.contract_type ? [row.contract_type] : []);
        return <span className="text-sm">{types.length > 0 ? types.join(", ") : "-"}</span>;
      },
    },
    {
      key: "min_experience" as keyof ApplicationRequest,
      header: "Exp.",
      className: "min-w-[80px]",
      render: (value: unknown) => <span className="text-sm">{value as React.ReactNode} ans</span>,
    },
    {
      key: "responsible" as keyof ApplicationRequest,
      header: "Responsable",
      className: "min-w-[130px]",
      render: (value: unknown) => {
        const r = value as { first_name?: string; last_name?: string } | null;
        const name = r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() || "-" : "-";
        return <span className="text-sm truncate block max-w-[130px]">{name}</span>;
      },
    },
    {
      key: "status" as keyof ApplicationRequest,
      header: "Statut",
      className: "min-w-[110px]",
      render: (value: unknown) => (
        <Badge
          variant="light"
          color={getStatusColor(value as string) as "success" | "error" | "warning" | "info" | "light"}
          size="sm"
        >
          {getStatusLabel(value as string)}
        </Badge>
      ),
    },
    {
      key: "is_public" as keyof ApplicationRequest,
      header: "Publication",
      className: "min-w-[120px]",
      render: (_value: unknown, row?: ApplicationRequest) => {
        if (!row) return null;
        return (
          <PublicStatusCell
            row={row}
            optimisticState={optimisticPublicStates[row.id]}
            onToggle={handleTogglePublic}
          />
        );
      },
    },
    {
      key: "urgency" as keyof ApplicationRequest,
      header: "Urgence",
      className: "min-w-[100px]",
      render: (value: unknown) => (
        <Badge
          variant="light"
          color={getUrgencyColor(value as string)}
          size="sm"
        >
          {getUrgencyLabel(value as string)}
        </Badge>
      ),
    },
    {
      key: "desired_start_date" as keyof ApplicationRequest,
      header: "Début",
      className: "min-w-[100px]",
      render: (value: unknown) => {
        return <span className="text-gray-400 text-sm">{formatDate(value as string)}</span>;
      },
    },
    {
      id: "created_by_manager",
      key: "manager" as keyof ApplicationRequest,
      header: "Créé par",
      className: "min-w-[130px]",
      render: (_value: unknown, row?: ApplicationRequest) => {
        const m = row?.manager;
        const name = m ? `${m.first_name || ""} ${m.last_name || ""}`.trim() : "";
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate block max-w-[130px]">
            {name || "-"}
          </span>
        );
      },
    },
  ];

  const requests = data?.data || [];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/95">
              Demandes de recrutement
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez les demandes de recrutement de vos clients
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
              <Button onClick={handleAddClick} startIcon={<PlusIcon />}>Ajouter une demande</Button>
            )}
          </div>
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par titre ou description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
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
                <option value="in_progress">En cours</option>
                <option value="standby">Standby</option>
                <option value="abandoned">Abandonnée</option>
                <option value="filled">Comblée</option>
                <option value="open">Ouverte</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrer par compétences requises..."
                value={requiredSkillsFilter}
                onChange={(e) => {
                  setRequiredSkillsFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <select
                value={experienceLevelFilter}
                onChange={(e) => {
                  setExperienceLevelFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les niveaux d'expérience</option>
                <option value="Junior">Junior</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <div>
              <select
                value={contractTypeFilter}
                onChange={(e) => {
                  setContractTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les types de contrat</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrer par localisation..."
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <DataTable<ApplicationRequest>
            key={`datatable-${Object.keys(optimisticPublicStates).join('-')}`}
            columns={columns}
            data={requests}
            isLoading={isLoading || isFetching}
            onView={handleRowClick}
            onEdit={canUpdate ? handleEditClick : undefined}
            onDelete={canDelete ? handleDeleteClick : undefined}
            customActions={canAssign ? [{ label: "Affecter", icon: <AssignIcon />, onClick: handleAssignClick }] : undefined}
            emptyMessage="Aucune demande trouvée"
            renderRowTooltip={(row: ApplicationRequest) => {
            const managerName = row.manager ? `${row.manager.first_name || ""} ${row.manager.last_name || ""}`.trim() : null;
            const skills = Array.isArray(row.required_skills) ? row.required_skills.slice(0, 3).map((s) => typeof s === "string" ? s : (s as { name: string }).name) : [];
            const priorityColors: Record<string, string> = {
              low: "text-gray-500", normal: "text-blue-500",
              high: "text-orange-500", urgent: "text-red-500",
            };
            return (
              <div className="w-72 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-0.5 truncate">{row.title || "-"}</div>
                <div className="text-xs text-gray-400 mb-2">Réf: {row.reference || "-"}</div>
                <div className="space-y-1.5">
                  {row.client?.name && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Client</span>
                      <span className="text-gray-700 dark:text-gray-300">{row.client.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-gray-400 shrink-0">Contrat</span>
                    <span className="text-gray-700 dark:text-gray-300">{(row.contract_types && row.contract_types.length > 0 ? row.contract_types.join(", ") : row.contract_type) || "-"}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-400 shrink-0">Priorité</span>
                    <span className={`font-medium ${priorityColors[row.priority] || ""}`}>{row.priority || "-"}</span>
                  </div>
                  {managerName && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Créé par</span>
                      <span className="text-gray-700 dark:text-gray-300">{managerName}</span>
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex flex-wrap gap-1">
                        {skills.map((s, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                            {s}
                          </span>
                        ))}
                        {row.required_skills.length > 3 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                            +{row.required_skills.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
        </div>

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

      <ApplicationRequestFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingRequest(null);
        }}
        onSubmit={handleFormSubmit}
        applicationRequest={editingRequest}
        isLoading={isCreating || isUpdating || isLoadingRequest}
      />

      <ApplicationRequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
        applicationRequest={selectedRequest}
        isLoading={isLoadingDetail}
        onStatusUpdate={canUpdate ? handleStatusUpdate : undefined}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, request: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer la demande"
        message={`Êtes-vous sûr de vouloir supprimer la demande "${confirmModal.request?.title}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />

      <AssignModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, request: null })}
        onAssign={handleAssignRequest}
        currentResponsible={assignModal.request?.responsible}
        entityLabel="cette demande"
        isLoading={isAssigning}
      />
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

function AssignIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 10 12.5H4.16667C3.28261 12.5 2.43477 12.8512 1.80964 13.4763C1.18452 14.1014 0.833336 14.9493 0.833336 15.8333V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.08333 9.16667C8.92428 9.16667 10.4167 7.67428 10.4167 5.83333C10.4167 3.99238 8.92428 2.5 7.08333 2.5C5.24238 2.5 3.75 3.99238 3.75 5.83333C3.75 7.67428 5.24238 9.16667 7.08333 9.16667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8333 6.66667V11.6667M13.3333 9.16667H18.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}