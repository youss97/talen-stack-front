"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ActionsMenu from "@/components/tables/ActionsMenu";
import Button from "@/components/ui/button/Button";
import VoiceNoteRecorder from "@/components/form/VoiceNoteRecorder";
import { Modal } from "@/components/ui/modal";
import type { ToastItem } from "@/components/ui/toast/Toast";
import { useGetApplicationRequestsQuery } from "@/lib/services/applicationRequestApi";
import { useChangeApplicationStepMutation } from "@/lib/services/recruiterApi";
import type { Recruiter } from "@/types/recruiter";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { formatDate } from "@/utils/dateFormat";

const DEFAULT_STEPS = ["Proposé", "Entretien RH", "Entretien client", "Offre"];
const TERMINAL_COLUMNS = ["Accepté", "KO", "Désistement"];
const UNSTARTED = "Non démarré";
const PER_COLUMN = 6;

type CardAction = React.ComponentProps<typeof ActionsMenu>["actions"];

interface Props {
  candidates: Recruiter[];
  isLoading?: boolean;
  /** Restreint les colonnes aux étapes de ces demandes (vide = union de toutes les demandes) */
  requestIds?: string[];
  onOpen: (candidate: Recruiter) => void;
  cardActions: (candidate: Recruiter) => CardAction;
  onChanged: () => void;
  addToast: (variant: ToastItem["variant"], title: string, message?: string) => void;
}

/**
 * Corps du Kanban des candidatures (colonnes = étapes du workflow, cartes déplaçables).
 * Rendu à la place du tableau : l'en-tête, les filtres et les modales sont ceux de la page liste.
 */
export default function ApplicationsKanbanBoard({ candidates, isLoading, requestIds = [], onOpen, cardActions, onChanged, addToast }: Props) {
  const t = useTranslations("recruitmentRequests");
  const ta = useTranslations("applications");

  const { data: requestsData } = useGetApplicationRequestsQuery({ page: 1, limit: 200 });
  const allRequests = useMemo(() => requestsData?.data || [], [requestsData]);
  const [changeStep] = useChangeApplicationStepMutation();

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [colPage, setColPage] = useState<Record<string, number>>({});
  const [closeModal, setCloseModal] = useState<{ id: string; column: string } | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [closeError, setCloseError] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);
  const [closeAudio, setCloseAudio] = useState<Blob | null>(null);

  const stepColumns = useMemo(() => {
    const scoped = requestIds.length > 0 ? allRequests.filter((r) => requestIds.includes(r.id)) : allRequests;
    const names: string[] = [];
    scoped.forEach((r) => {
      const steps = [...(r.workflow_steps || [])]
        .filter((s) => s && s.name)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => s.name);
      (steps.length ? steps : DEFAULT_STEPS).forEach((n) => { if (!names.includes(n)) names.push(n); });
    });
    if (names.length === 0) DEFAULT_STEPS.forEach((n) => names.push(n));
    return [UNSTARTED, ...names, ...TERMINAL_COLUMNS];
  }, [allRequests, requestIds]);

  const grouped = useMemo(() => {
    const map: Record<string, Recruiter[]> = {};
    stepColumns.forEach((c) => (map[c] = []));
    candidates.forEach((c) => {
      const col = c.current_step && map[c.current_step] !== undefined ? c.current_step : UNSTARTED;
      (map[col] ||= []).push(c);
    });
    return map;
  }, [candidates, stepColumns]);

  const candidateName = (c: Recruiter) =>
    `${c.cv?.candidate_first_name || ""} ${c.cv?.candidate_last_name || ""}`.trim() || t("kanban.candidateFallback");
  const initials = (c: Recruiter) =>
    ((c.cv?.candidate_first_name?.[0] || "") + (c.cv?.candidate_last_name?.[0] || "")).toUpperCase() || "?";
  const requestTitleById = (id?: string | null) => allRequests.find((r) => r.id === id)?.title;

  const applyStep = async (id: string, column: string, feedback?: string, audio?: Blob | null) => {
    const candidate = candidates.find((c) => c.id === id);
    try {
      await changeStep({
        id, step: column, feedback_description: feedback, audio,
        ...(TERMINAL_COLUMNS.includes(column) ? { status: column } : {}),
      }).unwrap();
      addToast("success", t("kanban.toast.movedTitle"), t("kanban.toast.movedMessage", { name: candidate ? candidateName(candidate) : t("kanban.toast.defaultCandidate"), column }));
      onChanged();
    } catch (err) {
      addToast("error", t("kanban.toast.moveErrorTitle"), getApiErrorMessage(err, t("kanban.toast.moveErrorDefault")));
    }
  };

  const handleDrop = async (column: string) => {
    setDragOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate || candidate.current_step === column || column === UNSTARTED) return;
    if (column === "KO" || column === "Désistement") {
      setCloseReason("");
      setCloseError(false);
      setCloseModal({ id, column });
      return;
    }
    await applyStep(id, column);
  };

  const confirmClose = async () => {
    if (!closeModal) return;
    if (!closeReason.trim() && !closeAudio) { setCloseError(true); return; }
    setCloseSaving(true);
    await applyStep(closeModal.id, closeModal.column, closeReason.trim() || undefined, closeAudio);
    setCloseSaving(false);
    setCloseModal(null);
    setCloseReason("");
    setCloseAudio(null);
  };

  const headerColor = (col: string) => {
    if (col === "Accepté") return "bg-green-500";
    if (col === "KO") return "bg-red-500";
    if (col === "Désistement") return "bg-amber-500";
    if (col === UNSTARTED) return "bg-gray-400";
    return "bg-brand-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stepColumns.map((col) => {
          const items = grouped[col] || [];
          const totalPages = Math.max(1, Math.ceil(items.length / PER_COLUMN));
          const safePage = Math.min(colPage[col] || 0, totalPages - 1);
          const slice = items.slice(safePage * PER_COLUMN, safePage * PER_COLUMN + PER_COLUMN);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
              onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
              onDrop={() => handleDrop(col)}
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
              className={`flex-1 min-w-[270px] max-w-[360px] rounded-xl border flex flex-col transition-shadow ${dragOverCol === col ? "ring-2 ring-brand-400 shadow-lg" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${headerColor(col)} shrink-0`} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{col}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5 shrink-0">{items.length}</span>
              </div>

              <div className="p-2 space-y-2 min-h-[55vh] flex-1">
                {slice.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={() => setDragId(c.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => onOpen(c)}
                    className="gw-card cursor-grab active:cursor-grabbing p-3 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold shrink-0">
                        {initials(c)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{candidateName(c)}</p>
                        {(c.cv?.profile_title || c.cv?.last_position) && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{c.cv.profile_title || c.cv.last_position}</p>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="shrink-0">
                        <ActionsMenu actions={cardActions(c)} />
                      </div>
                    </div>

                    {(c.request?.title || requestTitleById(c.request_id)) && (
                      <div className="mt-2 text-xs">
                        <p className="text-brand-600 dark:text-brand-400 font-medium truncate">{c.request?.title || requestTitleById(c.request_id)}</p>
                        {(c.request?.reference || c.request?.client?.name) && (
                          <p className="text-gray-500 dark:text-gray-400 truncate">
                            {[c.request?.client?.name, c.request?.reference].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {c.cv?.candidate_email && <p className="truncate">✉ {c.cv.candidate_email}</p>}
                      {c.cv?.candidate_phone && <p className="truncate">☎ {c.cv.candidate_phone}</p>}
                      {(c.salary_expectation != null || (c as any).daily_rate_expectation != null) && !c.desired_salary_deferred && (
                        <p className="truncate">
                          💰 {c.salary_expectation != null ? `${Number(c.salary_expectation).toLocaleString("fr-FR")} ${(c as any).currency || "MAD"}` : ""}
                          {(c as any).daily_rate_expectation != null ? ` · TJM ${Number((c as any).daily_rate_expectation).toLocaleString("fr-FR")}` : ""}
                        </p>
                      )}
                      {c.recruiter && <p className="truncate">👤 {`${c.recruiter.first_name || ""} ${c.recruiter.last_name || ""}`.trim()}</p>}
                      {c.proposed_at && <p className="truncate">📅 {formatDate(c.proposed_at)}</p>}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {typeof c.cv?.total_experience === "number" && c.cv.total_experience > 0 && (
                        <span className="gw-chip !h-6 !text-[11px]">🎯 {t("kanban.experienceYears", { count: c.cv.total_experience })}</span>
                      )}
                      {c.status && <span className="gw-badge gw-badge-brand !h-6 !text-[11px]">{c.status}</span>}
                      {c.workflow_status === "draft" && <span className="gw-chip !h-6 !text-[11px]">{ta("list.workflowDraft")}</span>}
                      {c.is_anonymized && <span className="gw-chip !h-6 !text-[11px]">🕶</span>}
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[45vh] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center px-3">
                    <span className="text-3xl mb-2 opacity-40">📋</span>
                    <p className="text-xs text-gray-400">{t("kanban.emptyColumn.title")}</p>
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                  <button
                    onClick={() => setColPage((p) => ({ ...p, [col]: Math.max(safePage - 1, 0) }))}
                    disabled={safePage === 0}
                    className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 rtl:rotate-180"
                  >‹</button>
                  <span className="text-gray-500">{safePage + 1}/{totalPages}</span>
                  <button
                    onClick={() => setColPage((p) => ({ ...p, [col]: Math.min(safePage + 1, totalPages - 1) }))}
                    disabled={safePage >= totalPages - 1}
                    className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 rtl:rotate-180"
                  >›</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!closeModal} onClose={() => { setCloseModal(null); setCloseReason(""); setCloseError(false); }} className="max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            {t("kanban.closeModal.title", { column: closeModal?.column || "" })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("kanban.closeModal.description", { column: closeModal?.column || "" })}
          </p>
          <textarea
            value={closeReason}
            onChange={(e) => { setCloseReason(e.target.value); if (e.target.value.trim()) setCloseError(false); }}
            rows={3}
            placeholder={t("kanban.closeModal.placeholder")}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${
              closeError ? "border-error-500 focus:ring-error-500/10" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
            }`}
          />
          <VoiceNoteRecorder className="mt-2" value={closeAudio} onChange={(blob) => { setCloseAudio(blob); if (blob) setCloseError(false); }} />
          {closeError && <p className="mt-1 text-xs text-error-500">{t("kanban.closeModal.requiredError")}</p>}
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => { setCloseModal(null); setCloseReason(""); setCloseError(false); }} disabled={closeSaving}>
              {t("kanban.closeModal.cancel")}
            </Button>
            <Button onClick={confirmClose} disabled={closeSaving}>
              {closeSaving ? t("kanban.closeModal.saving") : t("kanban.closeModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
