"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CVDetailModal from "@/components/cv/CVDetailModal";
import AssignModal from "@/components/assign/AssignModal";
import {
  useGetCVsQuery,
  useLazyGetCVByIdQuery,
  useDeleteCVMutation,
  useAssignCVMutation,
} from "@/lib/services/cvApi";
import { useGetCvSourcesQuery } from "@/lib/services/cvSourceApi";
import {
  useGetSpontaneousApplicationsQuery,
  useConvertSpontaneousApplicationMutation,
  useDeleteSpontaneousApplicationMutation,
} from "@/lib/services/publicJobOfferApi";
import { useActions } from "@/hooks/useActions";
import { useRouter } from "next/navigation";
import type { CV } from "@/types/cv";
import { getApiErrorMessage } from "@/utils/errorMessages";

const SPONTANEOUS_SOURCE_LABEL = "Candidature spontanée";

function getSourceBadgeColor(source?: string) {
  if (source === SPONTANEOUS_SOURCE_LABEL) {
    return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
  }
  if (source === "Offre publique") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export default function CVsPage() {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = useActions("/cvs");
  const canAssign = canUpdate;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [skillsFilter, setSkillsFilter] = useState<string>("");
  const [minExperience, setMinExperience] = useState<string>("");
  const [maxExperience, setMaxExperience] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("");
  const [anonymousFilter, setAnonymousFilter] = useState<string>(""); // "", "true", "false"
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCV, setDetailCV] = useState<CV | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    cv: CV | null;
  }>({ isOpen: false, cv: null });
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    cv: CV | null;
  }>({ isOpen: false, cv: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

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

  const { data, isLoading, isFetching, refetch: refetchCVs } = useGetCVsQuery({
    page,
    limit,
    search: search || undefined,
    skills: skillsFilter || undefined,
    min_experience: minExperience ? parseInt(minExperience) : undefined,
    max_experience: maxExperience ? parseInt(maxExperience) : undefined,
    industry: industryFilter || undefined,
    specialty: specialtyFilter || undefined,
    is_anonymous: anonymousFilter || undefined,
    source: sourceFilter || undefined,
  });

  const [getCVById, { isLoading: isLoadingDetail }] = useLazyGetCVByIdQuery();
  const [deleteCV] = useDeleteCVMutation();
  const [assignCV] = useAssignCVMutation();

  const { data: cvSourcesData } = useGetCvSourcesQuery({ is_active: true });
  const cvSources = cvSourcesData?.data || [];
  const sourceOptions = Array.from(
    new Set([...cvSources.map((s) => s.name), "Offre publique", SPONTANEOUS_SOURCE_LABEL])
  );

  // Candidatures spontanées pas encore ajoutées au vivier — visibles directement ici
  const { data: spontaneousApplications = [] } = useGetSpontaneousApplicationsQuery();
  const [convertSpontaneous, { isLoading: isConvertingSpontaneous }] = useConvertSpontaneousApplicationMutation();
  const [deleteSpontaneous] = useDeleteSpontaneousApplicationMutation();
  const [convertingSpontaneousId, setConvertingSpontaneousId] = useState<string | null>(null);

  const handleConvertSpontaneous = async (id: string) => {
    setConvertingSpontaneousId(id);
    try {
      await convertSpontaneous(id).unwrap();
      addToast("success", "Ajouté au vivier", "La candidature spontanée a été ajoutée au vivier de talents");
      // convertSpontaneous n'invalide que le cache de publicJobOfferApi (la liste des
      // candidatures spontanées) — cvApi est un slice RTK Query séparé, donc le tableau du
      // vivier ne se rafraîchit jamais tout seul : il faut le forcer explicitement.
      refetchCVs();
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de l'ajout au vivier"));
    } finally {
      setConvertingSpontaneousId(null);
    }
  };

  const handleDeleteSpontaneous = async (id: string) => {
    try {
      await deleteSpontaneous(id).unwrap();
      addToast("success", "Supprimée", "La candidature spontanée a été supprimée");
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression"));
    }
  };

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const columns: Column<CV>[] = [
    {
      key: "candidate_first_name",
      header: "Candidat",
      render: (_, row) => {
        const fullName = [row.candidate_first_name, row.candidate_last_name]
          .filter(Boolean)
          .join(" ");
        return <span className="font-medium">{fullName || "-"}</span>;
      },
    },
    {
      key: "candidate_email",
      header: "Email",
      render: (value) => <span>{(value as string) || "-"}</span>,
    },
    {
      key: "last_position",
      header: "Poste",
      render: (value) => <span>{(value as string) || "-"}</span>,
    },
    {
      key: "specialty",
      header: "Spécialité pertinente",
      render: (value) =>
        value ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
            {value as string}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "total_experience",
      header: "Expérience",
      render: (value) => (
        <span>{value ? `${value} ans` : "-"}</span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (value) =>
        value ? (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(value as string)}`}>
            {value as string}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: "created_by_name",
      header: "Créé par",
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "responsible",
      header: "Responsable",
      render: (value) => {
        const r = value as { first_name?: string; last_name?: string } | null;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() || "-" : "-"}
          </span>
        );
      },
    },
  ];

  const handleRowClick = async (cv: CV) => {
    setIsDetailModalOpen(true);
    setDetailCV(null);
    try {
      const result = await getCVById(cv.id).unwrap();
      setDetailCV(result);
    } catch (error) {
      console.error("Error fetching CV details:", error);
    }
  };

  const handleAddClick = () => {
    router.push("/cvs/extract");
  };

  const handleEditClick = (cv: CV) => {
    router.push(`/cvs/extract?id=${cv.id}`);
  };

  const handleDeleteClick = (cv: CV) => {
    setConfirmModal({ isOpen: true, cv });
  };

  const handleAssignClick = (cv: CV) => {
    setAssignModal({ isOpen: true, cv });
  };

  const handleAssignCV = async (responsibleIds: string[]) => {
    if (!assignModal.cv) return;
    setIsAssigning(true);
    try {
      await assignCV({ id: assignModal.cv.id, responsible_ids: responsibleIds }).unwrap();
      addToast("success", "Succès", responsibleIds.length > 0 ? "Responsable(s) affecté(s) avec succès" : "Affectation(s) retirée(s) avec succès");
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de l'affectation"));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.cv) return;

    setIsDeleting(true);
    let deleted = false;
    try {
      await deleteCV(confirmModal.cv.id).unwrap();
      deleted = true;
      addToast("success", "Succès", "CV supprimé avec succès");
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression du CV"));
    } finally {
      setIsDeleting(false);
      // Always close the modal — if deletion actually succeeded the CV is gone anyway
      if (deleted) setConfirmModal({ isOpen: false, cv: null });
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Vivier de talents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez les talents et candidats
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              Ajouter un talent
            </Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par nom, poste, email ou code CV (CV-00001)..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrer par compétences..."
                value={skillsFilter}
                onChange={(e) => {
                  setSkillsFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Expérience minimum (années)"
                value={minExperience}
                onChange={(e) => {
                  setMinExperience(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="Expérience maximum (années)"
                value={maxExperience}
                onChange={(e) => {
                  setMaxExperience(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrer par secteur d'activité..."
                value={industryFilter}
                onChange={(e) => {
                  setIndustryFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Filtrer par spécialité pertinente..."
                value={specialtyFilter}
                onChange={(e) => {
                  setSpecialtyFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <select
                value={anonymousFilter}
                onChange={(e) => { setAnonymousFilter(e.target.value); setPage(1); }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">CV anonymisé : Tous</option>
                <option value="true">Anonymisé : Oui</option>
                <option value="false">Anonymisé : Non</option>
              </select>
            </div>
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Source : Toutes</option>
                {sourceOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {spontaneousApplications.length > 0 && (
          <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-800 dark:bg-purple-900/10">
            <h2 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3">
              Candidatures spontanées en attente ({spontaneousApplications.length})
            </h2>
            <div className="space-y-2">
              {spontaneousApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                      Candidature spontanée
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isConvertingSpontaneous && convertingSpontaneousId === app.id}
                      onClick={() => handleConvertSpontaneous(app.id)}
                    >
                      {isConvertingSpontaneous && convertingSpontaneousId === app.id ? "Ajout..." : "Ajouter au vivier"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteSpontaneous(app.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          customActions={canAssign ? [{ label: "Affecter", icon: <AssignIcon />, onClick: handleAssignClick }] : undefined}
          emptyMessage="Aucun CV trouvé"
        />

        {data && data.pagination && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
              onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }}
            />
          </div>
        )}
      </div>

      <CVDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailCV(null);
        }}
        cv={detailCV}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, cv: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer le CV"
        message={`Êtes-vous sûr de vouloir supprimer ce CV ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />

      <AssignModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, cv: null })}
        onAssign={handleAssignCV}
        currentResponsible={assignModal.cv?.responsible}
        entityLabel="ce talent"
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
