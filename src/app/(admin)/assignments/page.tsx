"use client";

import { useState, useCallback } from "react";
import DataTableWithSelection, { type Column } from "@/components/tables/DataTableWithSelection";
import Pagination from "@/components/tables/Pagination";
import { ToastContainer, type ToastItem } from "@/components/ui/toast/Toast";
import AssignModal from "@/components/assign/AssignModal";
import { useGetCVsQuery, useAssignCVMutation } from "@/lib/services/cvApi";
import { useGetRecruitersQuery, useAssignApplicationResponsibleMutation } from "@/lib/services/recruiterApi";
import { useGetApplicationRequestsQuery, useAssignApplicationRequestMutation } from "@/lib/services/applicationRequestApi";
import { useDebounce } from "@/hooks/useDebounce";
import type { CV } from "@/types/cv";
import type { Recruiter } from "@/types/recruiter";
import type { ApplicationRequest } from "@/types/applicationRequest";

type Tab = "cvs" | "applications" | "requests";

interface ResponsibleUser {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800";

function AssignIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UnassignIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h8m6-4l2 2m0 0l2 2m-2-2l2-2m-2 2l-2 2" />
    </svg>
  );
}

function ResponsibleCell({ user }: { user?: ResponsibleUser | null }) {
  if (!user) return <span className="text-xs text-gray-400 italic">Non affecté</span>;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "—";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
      {name}
    </span>
  );
}

function PriorityCell({ priority }: { priority?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: "Urgent", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    high: { label: "Haute", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    normal: { label: "Normale", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    low: { label: "Basse", cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  };
  const { label, cls } = map[priority ?? ""] ?? { label: priority ?? "—", cls: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("cvs");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Selection state (reset on tab change)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Single-row assign modal
  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    type: Tab;
    responsible?: ResponsibleUser | null;
  } | null>(null);

  // Bulk assign modal (multiple selected rows)
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const addToast = useCallback((variant: "success" | "error", title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((p) => [...p, { id, variant, title, message }]);
  }, []);
  const removeToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  const qParams = {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    unassigned: unassignedOnly || undefined,
  };

  const { data: cvsData, isLoading: cvsLoading, isFetching: cvsFetching } = useGetCVsQuery(qParams, { skip: activeTab !== "cvs" });
  const { data: appsData, isLoading: appsLoading, isFetching: appsFetching } = useGetRecruitersQuery(qParams, { skip: activeTab !== "applications" });
  const { data: reqsData, isLoading: reqsLoading, isFetching: reqsFetching } = useGetApplicationRequestsQuery(qParams, { skip: activeTab !== "requests" });

  // Unassigned counts
  const { data: cvsStats } = useGetCVsQuery({ page: 1, limit: 1, unassigned: true });
  const { data: appsStats } = useGetRecruitersQuery({ page: 1, limit: 1, unassigned: true });
  const { data: reqsStats } = useGetApplicationRequestsQuery({ page: 1, limit: 1, unassigned: true });

  const [assignCV] = useAssignCVMutation();
  const [assignApp] = useAssignApplicationResponsibleMutation();
  const [assignReq] = useAssignApplicationRequestMutation();

  const isLoading = cvsLoading || appsLoading || reqsLoading;
  const isFetching = cvsFetching || appsFetching || reqsFetching;

  const pagination =
    activeTab === "cvs" ? cvsData?.pagination :
    activeTab === "applications" ? appsData?.pagination :
    reqsData?.pagination;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setSelectedIds([]);
  };

  // ── Assign a single item ──────────────────────────────────────────────────────
  const assignOne = async (id: string, type: Tab, responsibleIds: string[]) => {
    if (type === "cvs") await assignCV({ id, responsible_ids: responsibleIds }).unwrap();
    else if (type === "applications") await assignApp({ id, responsible_ids: responsibleIds }).unwrap();
    else await assignReq({ id, responsible_ids: responsibleIds }).unwrap();
  };

  // Single row: open modal
  const handleSingleAssign = async (responsibleIds: string[]) => {
    if (!assignTarget) return;
    try {
      await assignOne(assignTarget.id, assignTarget.type, responsibleIds);
      addToast("success", "Succès", responsibleIds.length ? "Responsable affecté" : "Affectation retirée");
      setAssignTarget(null);
    } catch (e: any) {
      addToast("error", "Erreur", e?.data?.message || "Erreur lors de l'affectation");
      throw e;
    }
  };

  // Bulk assign: apply same responsibles to all selected items
  const handleBulkAssign = async (responsibleIds: string[]) => {
    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    for (const id of selectedIds) {
      try {
        await assignOne(id, activeTab, responsibleIds);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setIsBulkProcessing(false);
    setBulkAssignOpen(false);
    setSelectedIds([]);
    if (errorCount === 0) {
      addToast("success", "Succès", `${successCount} élément${successCount > 1 ? "s" : ""} affecté${successCount > 1 ? "s" : ""}`);
    } else {
      addToast("error", "Partiel", `${successCount} réussi${successCount > 1 ? "s" : ""}, ${errorCount} échoué${errorCount > 1 ? "s" : ""}`);
    }
  };

  // Bulk deassign: remove all responsibles from selected items
  const handleBulkDeassign = async () => {
    setIsBulkProcessing(true);
    let successCount = 0;
    let errorCount = 0;
    for (const id of selectedIds) {
      try {
        await assignOne(id, activeTab, []);
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setIsBulkProcessing(false);
    setSelectedIds([]);
    if (errorCount === 0) {
      addToast("success", "Désaffectés", `${successCount} élément${successCount > 1 ? "s" : ""} désaffecté${successCount > 1 ? "s" : ""}`);
    } else {
      addToast("error", "Partiel", `${successCount} réussi${successCount > 1 ? "s" : ""}, ${errorCount} échoué${errorCount > 1 ? "s" : ""}`);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────

  const cvColumns: Column<CV>[] = [
    {
      id: "cv-name",
      key: "candidate_first_name",
      header: "Candidat",
      render: (_, row) => (
        <span className="font-medium">
          {[row.candidate_first_name, row.candidate_last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    {
      id: "cv-position",
      key: "last_position",
      header: "Poste actuel",
      render: (v) => <span>{(v as string) || "—"}</span>,
    },
    {
      id: "cv-exp",
      key: "total_experience",
      header: "Expérience",
      render: (v) => <span>{v ? `${v} ans` : "—"}</span>,
    },
    {
      id: "cv-skills",
      key: "skills",
      header: "Compétences",
      render: (v) => {
        const skills = (v as any[]) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 3).map((s: any, i: number) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {typeof s === "string" ? s : s.name}
              </span>
            ))}
            {skills.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-700">+{skills.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "cv-resp",
      key: "responsible",
      header: "Responsable",
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const appColumns: Column<Recruiter>[] = [
    {
      id: "app-name",
      key: "cv",
      header: "Candidat",
      render: (v) => {
        const cv = v as any;
        return (
          <span className="font-medium">
            {cv ? [cv.candidate_first_name, cv.candidate_last_name].filter(Boolean).join(" ") || "—" : "—"}
          </span>
        );
      },
    },
    {
      id: "app-title",
      key: "request",
      header: "Poste / Demande",
      render: (v) => <span>{(v as any)?.title || "—"}</span>,
    },
    {
      id: "app-client",
      key: "request",
      header: "Client",
      render: (v) => <span className="text-gray-600 dark:text-gray-400">{(v as any)?.client?.name || "—"}</span>,
    },
    {
      id: "app-status",
      key: "status",
      header: "Statut",
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {(v as string) || "—"}
        </span>
      ),
    },
    {
      id: "app-resp",
      key: "responsible",
      header: "Responsable",
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const reqColumns: Column<ApplicationRequest>[] = [
    {
      id: "req-title",
      key: "title",
      header: "Titre",
      render: (v) => <span className="font-medium">{(v as string) || "—"}</span>,
    },
    {
      id: "req-client",
      key: "client",
      header: "Client",
      render: (v) => <span>{(v as any)?.name || "—"}</span>,
    },
    {
      id: "req-contract",
      key: "contract_type",
      header: "Contrat",
      render: (v) => <span>{(v as string) || "—"}</span>,
    },
    {
      id: "req-priority",
      key: "priority",
      header: "Priorité",
      render: (v) => <PriorityCell priority={v as string} />,
    },
    {
      id: "req-resp",
      key: "responsible",
      header: "Responsable",
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "cvs", label: "Talents (CVs)", count: cvsStats?.pagination?.total },
    { key: "applications", label: "Candidatures", count: appsStats?.pagination?.total },
    { key: "requests", label: "Demandes", count: reqsStats?.pagination?.total },
  ];

  const entityLabel =
    activeTab === "cvs" ? "talent" :
    activeTab === "applications" ? "candidature" :
    "demande";

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Gestion des Affectations
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Affectez des responsables aux talents, candidatures et demandes de recrutement
            </p>
          </div>
          <div className="flex items-center gap-3">
            {cvsStats && (
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  {cvsStats.pagination?.total ?? 0} CVs non affectés
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  {appsStats?.pagination?.total ?? 0} candidatures
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  {reqsStats?.pagination?.total ?? 0} demandes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex gap-1 border-b border-gray-100 dark:border-gray-800 -mb-5 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.key
                      ? "bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  activeTab === "cvs" ? "Rechercher par nom, poste..." :
                  activeTab === "applications" ? "Rechercher par candidat, poste..." :
                  "Rechercher par titre, référence..."
                }
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={unassignedOnly}
                    onChange={(e) => { setUnassignedOnly(e.target.checked); setPage(1); }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Non affectés uniquement</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bulk action bar — appears when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 border-b border-brand-100 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/10 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {selectedIds.length} {entityLabel}{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkAssignOpen(true)}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                <AssignIcon />
                Affecter les {selectedIds.length} sélectionnés
              </button>
              <button
                type="button"
                onClick={handleBulkDeassign}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors"
              >
                <UnassignIcon />
                Désaffecter
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2 py-1.5"
              >
                Annuler la sélection
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {activeTab === "cvs" && (
          <DataTableWithSelection<CV>
            columns={cvColumns}
            data={cvsData?.data || []}
            selectedItems={selectedIds}
            onSelectionChange={setSelectedIds}
            isLoading={isLoading || isFetching}
            emptyMessage="Aucun talent trouvé"
            customActions={[{
              label: "Affecter",
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "cvs", responsible: (row as any).responsible ?? null }),
            }]}
          />
        )}

        {activeTab === "applications" && (
          <DataTableWithSelection<Recruiter>
            columns={appColumns}
            data={appsData?.data || []}
            selectedItems={selectedIds}
            onSelectionChange={setSelectedIds}
            isLoading={isLoading || isFetching}
            emptyMessage="Aucune candidature trouvée"
            customActions={[{
              label: "Affecter",
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "applications", responsible: (row as any).responsible ?? null }),
            }]}
          />
        )}

        {activeTab === "requests" && (
          <DataTableWithSelection<ApplicationRequest>
            columns={reqColumns}
            data={reqsData?.data || []}
            selectedItems={selectedIds}
            onSelectionChange={setSelectedIds}
            isLoading={isLoading || isFetching}
            emptyMessage="Aucune demande trouvée"
            customActions={[{
              label: "Affecter",
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "requests", responsible: (row as any).responsible ?? null }),
            }]}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Single-row assign modal */}
      <AssignModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={handleSingleAssign}
        currentResponsibles={assignTarget?.responsible ? [assignTarget.responsible] : []}
        isLoading={false}
        entityLabel={
          assignTarget?.type === "cvs" ? "ce talent" :
          assignTarget?.type === "applications" ? "cette candidature" :
          "cette demande"
        }
      />

      {/* Bulk assign modal */}
      <AssignModal
        isOpen={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        onAssign={handleBulkAssign}
        currentResponsibles={[]}
        isLoading={isBulkProcessing}
        entityLabel={`ces ${selectedIds.length} ${entityLabel}${selectedIds.length > 1 ? "s" : ""}`}
      />
    </div>
  );
}
