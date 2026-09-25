"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import { useLimitPreference } from "@/hooks/useLimitPreference";
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
import { useRouter } from "@/i18n/navigation";
import type { CV } from "@/types/cv";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { Plus, UserPlus, ClipboardList } from "lucide-react";
import PrepareTestModal from "@/components/testQuestions/PrepareTestModal";
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("tests.prepareModal");
  const tl = useTranslations("cvs.list");
  const locale = useLocale();
  const [testModalCv, setTestModalCv] = useState<CV | null>(null);
  const { canCreate, canUpdate, canDelete } = useActions("/cvs");
  const canAssign = canUpdate;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useLimitPreference("cvs", 20);
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
      addToast("success", tl("toasts.addedToPoolTitle"), tl("toasts.addedToPoolMessage"));
      // convertSpontaneous n'invalide que le cache de publicJobOfferApi (la liste des
      // candidatures spontanées) — cvApi est un slice RTK Query séparé, donc le tableau du
      // vivier ne se rafraîchit jamais tout seul : il faut le forcer explicitement.
      refetchCVs();
    } catch (error) {
      addToast("error", tl("toasts.errorTitle"), getErrorMessage(error, tl("toasts.addToPoolError")));
    } finally {
      setConvertingSpontaneousId(null);
    }
  };

  const handleDeleteSpontaneous = async (id: string) => {
    try {
      await deleteSpontaneous(id).unwrap();
      addToast("success", tl("toasts.deletedTitle"), tl("toasts.deletedMessage"));
    } catch (error) {
      addToast("error", tl("toasts.errorTitle"), getErrorMessage(error, tl("toasts.deleteSpontaneousError")));
    }
  };

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const columns: Column<CV>[] = [
    {
      key: "candidate_first_name",
      header: tl("columns.candidate"),
      render: (_, row) => {
        const fullName = [row.candidate_first_name, row.candidate_last_name]
          .filter(Boolean)
          .join(" ");
        return <span className="font-medium">{fullName || "-"}</span>;
      },
    },
    {
      key: "candidate_email",
      header: tl("columns.email"),
      render: (value) => <span>{(value as string) || "-"}</span>,
    },
    {
      key: "last_position",
      header: tl("columns.position"),
      render: (value, row) => <span>{row.profile_title || (value as string) || "-"}</span>,
    },
    {
      key: "specialty",
      header: tl("columns.specialty"),
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
      header: tl("columns.experience"),
      render: (value) => (
        <span>{value ? tl("experienceYears", { count: value as number }) : "-"}</span>
      ),
    },
    {
      key: "source",
      header: tl("columns.source"),
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
      header: tl("columns.createdBy"),
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: tl("columns.addedOn"),
      render: (value) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value ? new Date(value as string).toLocaleDateString(locale === "ar" ? "ar" : locale === "en" ? "en-US" : "fr-FR") : "-"}
        </span>
      ),
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
      addToast("success", tl("toasts.assignSuccessTitle"), responsibleIds.length > 0 ? tl("toasts.assignedMessage") : tl("toasts.unassignedMessage"));
    } catch (error) {
      addToast("error", tl("toasts.errorTitle"), getErrorMessage(error, tl("toasts.assignError")));
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
      addToast("success", tl("toasts.assignSuccessTitle"), tl("toasts.deleteCvSuccess"));
    } catch (error) {
      addToast("error", tl("toasts.errorTitle"), getErrorMessage(error, tl("toasts.deleteCvError")));
    } finally {
      setIsDeleting(false);
      // Always close the modal — if deletion actually succeeded the CV is gone anyway
      if (deleted) setConfirmModal({ isOpen: false, cv: null });
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tl("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tl("subtitle")}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              {tl("addButton")}
            </Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder={tl("filters.searchPlaceholder")}
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
                placeholder={tl("filters.skillsPlaceholder")}
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
                placeholder={tl("filters.minExperiencePlaceholder")}
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
                placeholder={tl("filters.maxExperiencePlaceholder")}
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
                placeholder={tl("filters.industryPlaceholder")}
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
                placeholder={tl("filters.specialtyPlaceholder")}
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
                <option value="">{tl("filters.anonymousAll")}</option>
                <option value="true">{tl("filters.anonymousYes")}</option>
                <option value="false">{tl("filters.anonymousNo")}</option>
              </select>
            </div>
            <div>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">{tl("filters.sourceAll")}</option>
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
              {tl("spontaneous.pendingTitle", { count: spontaneousApplications.length })}
            </h2>
            <div className="space-y-2">
              {spontaneousApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-900/40 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                      {tl("spontaneous.badge")}
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
                      {isConvertingSpontaneous && convertingSpontaneousId === app.id ? tl("spontaneous.adding") : tl("spontaneous.addToPoolButton")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteSpontaneous(app.id)}>
                      {tl("spontaneous.deleteButton")}
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
          customActions={[
            ...(canAssign ? [{ label: tl("assignAction"), icon: <AssignIcon />, onClick: handleAssignClick }] : []),
            { label: t("button"), icon: <ClipboardList size={16} strokeWidth={1.8} />, onClick: (row: CV) => setTestModalCv(row) },
          ]}
          emptyMessage={tl("emptyState")}
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

      <PrepareTestModal
        isOpen={!!testModalCv}
        onClose={() => setTestModalCv(null)}
        cvId={testModalCv?.id}
        cvName={testModalCv ? `${testModalCv.candidate_first_name} ${testModalCv.candidate_last_name}` : undefined}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, cv: null })}
        onConfirm={handleConfirmDelete}
        title={tl("deleteConfirm.title")}
        message={tl("deleteConfirm.message")}
        confirmText={tl("deleteConfirm.confirmText")}
        cancelText={tl("deleteConfirm.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />

      <AssignModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, cv: null })}
        onAssign={handleAssignCV}
        currentResponsibles={(assignModal.cv as any)?.responsibles ?? (assignModal.cv?.responsible ? [assignModal.cv.responsible] : [])}
        entityLabel={tl("assignEntityLabel")}
        isLoading={isAssigning}
      />
    </div>
  );
}

function PlusIcon() {
  return <Plus className="icon-glow" size={20} strokeWidth={1.8} />;
}

function AssignIcon() {
  return <UserPlus className="icon-glow" size={16} strokeWidth={1.8} />;
}
