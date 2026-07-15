"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("assignments");
  if (!user) return <span className="text-xs text-gray-400 italic">{t("responsible.unassigned")}</span>;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "—";
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
      {name}
    </span>
  );
}

function PriorityCell({ priority }: { priority?: string }) {
  const t = useTranslations("assignments");
  const map: Record<string, { label: string; cls: string }> = {
    urgent: { label: t("priority.urgent"), cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    high: { label: t("priority.high"), cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    normal: { label: t("priority.normal"), cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    low: { label: t("priority.low"), cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  };
  const { label, cls } = map[priority ?? ""] ?? { label: priority ?? "—", cls: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

export default function AssignmentsPage() {
  const t = useTranslations("assignments");
  const tc = useTranslations("common");
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
    responsibles?: ResponsibleUser[];
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
      addToast("success", tc("status.success"), responsibleIds.length ? t("toasts.assignSuccess") : t("toasts.unassignSuccess"));
      setAssignTarget(null);
    } catch (e: any) {
      addToast("error", tc("status.error"), e?.data?.message || t("toasts.assignError"));
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
      addToast("success", tc("status.success"), t("toasts.bulkSuccess", { count: successCount }));
    } else {
      addToast("error", t("toasts.bulkPartialTitle"), t("toasts.bulkPartial", { success: successCount, error: errorCount }));
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
      addToast("success", t("toasts.deassignSuccessTitle"), t("toasts.deassignSuccess", { count: successCount }));
    } else {
      addToast("error", t("toasts.bulkPartialTitle"), t("toasts.bulkPartial", { success: successCount, error: errorCount }));
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────

  const cvColumns: Column<CV>[] = [
    {
      id: "cv-name",
      key: "candidate_first_name",
      header: t("columns.candidate"),
      render: (_, row) => (
        <span className="font-medium">
          {[row.candidate_first_name, row.candidate_last_name].filter(Boolean).join(" ") || "—"}
        </span>
      ),
    },
    {
      id: "cv-position",
      key: "last_position",
      header: t("columns.position"),
      render: (v) => <span>{(v as string) || "—"}</span>,
    },
    {
      id: "cv-exp",
      key: "total_experience",
      header: t("columns.experience"),
      render: (v) => <span>{v ? t("columns.experienceYears", { count: Number(v) }) : "—"}</span>,
    },
    {
      id: "cv-skills",
      key: "skills",
      header: t("columns.skills"),
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
      header: t("columns.responsible"),
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const appColumns: Column<Recruiter>[] = [
    {
      id: "app-name",
      key: "cv",
      header: t("columns.candidate"),
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
      header: t("columns.titleOrRequest"),
      render: (v) => <span>{(v as any)?.title || "—"}</span>,
    },
    {
      id: "app-client",
      key: "request",
      header: t("columns.client"),
      render: (v) => <span className="text-gray-600 dark:text-gray-400">{(v as any)?.client?.name || "—"}</span>,
    },
    {
      id: "app-status",
      key: "status",
      header: tc("labels.status"),
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {(v as string) || "—"}
        </span>
      ),
    },
    {
      id: "app-resp",
      key: "responsible",
      header: t("columns.responsible"),
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const reqColumns: Column<ApplicationRequest>[] = [
    {
      id: "req-title",
      key: "title",
      header: t("columns.reqTitle"),
      render: (v) => <span className="font-medium">{(v as string) || "—"}</span>,
    },
    {
      id: "req-client",
      key: "client",
      header: t("columns.client"),
      render: (v) => <span>{(v as any)?.name || "—"}</span>,
    },
    {
      id: "req-contract",
      key: "contract_type",
      header: t("columns.contract"),
      render: (v) => <span>{(v as string) || "—"}</span>,
    },
    {
      id: "req-priority",
      key: "priority",
      header: t("columns.priority"),
      render: (v) => <PriorityCell priority={v as string} />,
    },
    {
      id: "req-resp",
      key: "responsible",
      header: t("columns.responsible"),
      render: (v) => <ResponsibleCell user={v as ResponsibleUser | null} />,
    },
  ];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "cvs", label: t("tabs.cvs"), count: cvsStats?.pagination?.total },
    { key: "applications", label: t("tabs.applications"), count: appsStats?.pagination?.total },
    { key: "requests", label: t("tabs.requests"), count: reqsStats?.pagination?.total },
  ];

  const entitySingular =
    activeTab === "cvs" ? t("entities.cvSingular") :
    activeTab === "applications" ? t("entities.applicationSingular") :
    t("entities.requestSingular");

  const entityPlural =
    activeTab === "cvs" ? t("entities.cvPlural") :
    activeTab === "applications" ? t("entities.applicationPlural") :
    t("entities.requestPlural");

  const entityLabel = selectedIds.length > 1 ? entityPlural : entitySingular;

  const selectedLabel =
    activeTab === "cvs" ? t("bulkBar.selectedCv", { count: selectedIds.length }) :
    activeTab === "applications" ? t("bulkBar.selectedApplication", { count: selectedIds.length }) :
    t("bulkBar.selectedRequest", { count: selectedIds.length });

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("page.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("page.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {cvsStats && (
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                  {t("stats.unassignedCvs", { count: cvsStats.pagination?.total ?? 0 })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  {t("stats.applications", { count: appsStats?.pagination?.total ?? 0 })}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                  {t("stats.requests", { count: reqsStats?.pagination?.total ?? 0 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs — segmented control */}
        <div className="mb-5 inline-flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/40">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab.key
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  activeTab === "cvs" ? t("filters.searchCvs") :
                  activeTab === "applications" ? t("filters.searchApplications") :
                  t("filters.searchRequests")
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
                  <div className="absolute top-0.5 start-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">{t("filters.unassignedOnly")}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Bulk action bar — appears when rows are selected */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 border-b border-brand-100 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/10 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {selectedLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkAssignOpen(true)}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
              >
                <AssignIcon />
                {t("actions.assignSelected", { count: selectedIds.length })}
              </button>
              <button
                type="button"
                onClick={handleBulkDeassign}
                disabled={isBulkProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors"
              >
                <UnassignIcon />
                {t("actions.unassign")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 px-2 py-1.5"
              >
                {t("actions.cancelSelection")}
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
            emptyMessage={t("emptyState.cvs")}
            customActions={[{
              label: t("actions.assign"),
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "cvs", responsibles: (row as any).responsibles ?? ((row as any).responsible ? [(row as any).responsible] : []) }),
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
            emptyMessage={t("emptyState.applications")}
            customActions={[{
              label: t("actions.assign"),
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "applications", responsibles: (row as any).responsibles ?? ((row as any).responsible ? [(row as any).responsible] : []) }),
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
            emptyMessage={t("emptyState.requests")}
            customActions={[{
              label: t("actions.assign"),
              icon: <AssignIcon />,
              onClick: (row) => setAssignTarget({ id: row.id, type: "requests", responsibles: (row as any).responsibles ?? ((row as any).responsible ? [(row as any).responsible] : []) }),
            }]}
          />
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
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
        currentResponsibles={assignTarget?.responsibles ?? []}
        isLoading={false}
        entityLabel={
          assignTarget?.type === "cvs" ? t("modal.singleCv") :
          assignTarget?.type === "applications" ? t("modal.singleApplication") :
          t("modal.singleRequest")
        }
      />

      {/* Bulk assign modal */}
      <AssignModal
        isOpen={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        onAssign={handleBulkAssign}
        currentResponsibles={[]}
        isLoading={isBulkProcessing}
        entityLabel={t("modal.bulk", { count: selectedIds.length, entity: entityLabel })}
      />
    </div>
  );
}
