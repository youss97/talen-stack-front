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
import { useActions } from "@/hooks/useActions";
import { useRouter } from "next/navigation";
import type { CV } from "@/types/cv";

export default function CVsPage() {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = useActions("/cvs");
  const canAssign = canUpdate;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [skillsFilter, setSkillsFilter] = useState<string>("");
  const [minExperience, setMinExperience] = useState<string>("");
  const [maxExperience, setMaxExperience] = useState<string>("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("");
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

  const { data, isLoading, isFetching } = useGetCVsQuery({
    page,
    limit: 5,
    search: search || undefined,
    skills: skillsFilter || undefined,
    min_experience: minExperience ? parseInt(minExperience) : undefined,
    max_experience: maxExperience ? parseInt(maxExperience) : undefined,
    industry: industryFilter || undefined,
    contract_type: profileTypeFilter || undefined,
  });

  const [getCVById, { isLoading: isLoadingDetail }] = useLazyGetCVByIdQuery();
  const [deleteCV] = useDeleteCVMutation();
  const [assignCV] = useAssignCVMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

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
      key: "total_experience",
      header: "Expérience",
      render: (value) => (
        <span>{value ? `${value} ans` : "-"}</span>
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
    try {
      await deleteCV(confirmModal.cv.id).unwrap();
      addToast("success", "Succès", "CV supprimé avec succès");
      setConfirmModal({ isOpen: false, cv: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression du CV"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Vivier de talents
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les talents et candidats
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              Ajouter un talent
            </Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom, poste ou email..."
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
              <select
                value={profileTypeFilter}
                onChange={(e) => {
                  setProfileTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les types de profil</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Freelance">Freelance</option>
                <option value="Stage">Stage</option>
                <option value="Alternance">Alternance</option>
                <option value="Intérim">Intérim</option>
                <option value="Portage salarial">Portage salarial</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          customActions={canAssign ? [{ label: "Affecter", icon: <AssignIcon />, onClick: handleAssignClick }] : undefined}
          emptyMessage="Aucun CV trouvé"
          renderRowTooltip={(row: CV) => {
            const name = `${row.candidate_first_name || ""} ${row.candidate_last_name || ""}`.trim();
            const skills = Array.isArray(row.skills) ? row.skills.slice(0, 4) : [];
            const position = row.last_position || row.profile_title;
            const experience = row.total_experience;
            return (
              <div className="w-72 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white mb-1">{name || "-"}</div>
                {row.candidate_email && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{row.candidate_email}</div>
                )}
                <div className="space-y-1.5">
                  {position && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Poste</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{position}</span>
                    </div>
                  )}
                  {experience != null && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Expérience</span>
                      <span className="text-gray-700 dark:text-gray-300">{experience} an(s)</span>
                    </div>
                  )}
                  {row.created_by_name && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 shrink-0">Créé par</span>
                      <span className="text-gray-700 dark:text-gray-300">{row.created_by_name}</span>
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
                        {row.skills && row.skills.length > 4 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            +{row.skills.length - 4}
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
