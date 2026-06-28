"use client";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { useGetApplicationRequestByIdQuery } from "@/lib/services/applicationRequestApi";
import { useGetRecruitersQuery, useChangeApplicationStepMutation } from "@/lib/services/recruiterApi";
import type { Recruiter } from "@/types/recruiter";
import { getApiErrorMessage } from "@/utils/errorMessages";

// Étapes par défaut si la demande n'en définit pas
const DEFAULT_STEPS = ["Proposé", "Entretien RH", "Entretien client", "Offre"];
// Colonnes terminales (statuts de clôture) — §4.2
const TERMINAL_COLUMNS = ["Accepté", "KO", "Désistement"];
const UNSTARTED = "Non démarré";
const PER_COLUMN = 6; // pagination par colonne

export default function RequestKanbanPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request } = useGetApplicationRequestByIdQuery(requestId, { skip: !requestId });
  const { data, isLoading, refetch } = useGetRecruitersQuery({ request_id: requestId, limit: 500 });
  const [changeStep] = useChangeApplicationStepMutation();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [colPage, setColPage] = useState<Record<string, number>>({});
  // Modal de clôture (KO / Désistement) — motif obligatoire
  const [closeModal, setCloseModal] = useState<{ id: string; column: string } | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [closeError, setCloseError] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);

  const addToast = (variant: ToastItem["variant"], title: string, message?: string) =>
    setToasts((p) => [...p, { id: Date.now().toString(), variant, title, message }]);
  const removeToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));

  const candidates: Recruiter[] = useMemo(() => data?.data || [], [data]);

  const workflowStepNames = useMemo(() => {
    const steps = [...(request?.workflow_steps || [])]
      .filter((s) => s && s.name)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => s.name);
    return steps.length ? steps : DEFAULT_STEPS;
  }, [request]);

  const stepColumns = useMemo(
    () => [UNSTARTED, ...workflowStepNames, ...TERMINAL_COLUMNS],
    [workflowStepNames],
  );

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
    `${c.cv?.candidate_first_name || ""} ${c.cv?.candidate_last_name || ""}`.trim() || "Candidat";
  const initials = (c: Recruiter) => {
    const f = c.cv?.candidate_first_name?.[0] || "";
    const l = c.cv?.candidate_last_name?.[0] || "";
    return (f + l).toUpperCase() || "?";
  };

  const handleDrop = async (column: string) => {
    setDragOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const candidate = candidates.find((c) => c.id === id);
    if (!candidate || candidate.current_step === column || column === UNSTARTED) return;

    // KO / Désistement → ouvrir le modal de motif (au lieu d'un prompt natif)
    if (column === "KO" || column === "Désistement") {
      setCloseReason("");
      setCloseError(false);
      setCloseModal({ id, column });
      return;
    }

    await applyStep(id, column);
  };

  const applyStep = async (id: string, column: string, feedback?: string) => {
    const candidate = candidates.find((c) => c.id === id);
    try {
      const isTerminal = TERMINAL_COLUMNS.includes(column);
      await changeStep({
        id, step: column, feedback_description: feedback,
        ...(isTerminal ? { status: column } : {}),
      }).unwrap();
      addToast("success", "Déplacé", `${candidate ? candidateName(candidate) : "Candidature"} → ${column}`);
      refetch();
    } catch (err) {
      addToast("error", "Erreur", getApiErrorMessage(err, "Impossible de déplacer la candidature"));
    }
  };

  const confirmClose = async () => {
    if (!closeModal) return;
    if (!closeReason.trim()) {
      setCloseError(true);
      return;
    }
    setCloseSaving(true);
    await applyStep(closeModal.id, closeModal.column, closeReason.trim());
    setCloseSaving(false);
    setCloseModal(null);
    setCloseReason("");
  };

  const headerColor = (col: string) => {
    if (col === "Accepté") return "bg-green-500";
    if (col === "KO") return "bg-red-500";
    if (col === "Désistement") return "bg-amber-500";
    if (col === UNSTARTED) return "bg-gray-400";
    return "bg-brand-500";
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Kanban — {request?.title || "Recrutement"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Glissez-déposez les candidatures entre les étapes. KO / Désistement demandent un motif.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/recruitment-requests")}>Retour</Button>
      </div>

      {/* Barre de statistiques */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total candidatures", value: candidates.length, color: "text-gray-800 dark:text-white" },
          { label: "En cours", value: candidates.filter((c) => !TERMINAL_COLUMNS.includes(c.current_step || "")).length, color: "text-brand-600" },
          { label: "Acceptés", value: (grouped["Accepté"] || []).length, color: "text-green-600" },
          { label: "KO / Désistement", value: (grouped["KO"] || []).length + (grouped["Désistement"] || []).length, color: "text-red-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stepColumns.map((col) => {
            const items = grouped[col] || [];
            const pageIdx = colPage[col] || 0;
            const totalPages = Math.max(1, Math.ceil(items.length / PER_COLUMN));
            const safePage = Math.min(pageIdx, totalPages - 1);
            const slice = items.slice(safePage * PER_COLUMN, safePage * PER_COLUMN + PER_COLUMN);
            return (
              <div
                key={col}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
                onDrop={() => handleDrop(col)}
                className={`flex-1 min-w-[270px] max-w-[360px] rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 flex flex-col transition-shadow ${
                  dragOverCol === col ? "ring-2 ring-brand-400 shadow-lg" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${headerColor(col)} shrink-0`} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{col}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-0.5 shrink-0">
                    {items.length}
                  </span>
                </div>

                <div className="p-2 space-y-2 min-h-[55vh] flex-1">
                  {slice.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => router.push(`/applications/${c.id}`)}
                      className="cursor-grab active:cursor-grabbing rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500/40 transition-all"
                    >
                      {/* En-tête : avatar + nom + poste */}
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-xs font-bold shrink-0">
                          {initials(c)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{candidateName(c)}</p>
                          {(c.cv?.profile_title || c.cv?.last_position) && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.cv?.profile_title || c.cv?.last_position}</p>
                          )}
                        </div>
                      </div>

                      {/* Badges infos */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {typeof c.cv?.total_experience === "number" && c.cv.total_experience > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            🎯 {c.cv.total_experience} an{c.cv.total_experience > 1 ? "s" : ""}
                          </span>
                        )}
                        {Array.isArray(c.cv?.skills) && c.cv.skills.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            🛠 {c.cv.skills.length} comp.
                          </span>
                        )}
                        {c.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                            {c.status}
                          </span>
                        )}
                      </div>

                      {/* Pied : email + date */}
                      {(c.cv?.candidate_email || c.proposed_at) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2 text-[10px] text-gray-400">
                          <span className="truncate">{c.cv?.candidate_email || ""}</span>
                          {c.proposed_at && (
                            <span className="shrink-0">{new Date(c.proposed_at).toLocaleDateString("fr-FR")}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-[45vh] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center px-3">
                      <span className="text-3xl mb-2 opacity-40">📋</span>
                      <p className="text-xs text-gray-400">Aucune candidature</p>
                      <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">Glissez une carte ici</p>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                    <button
                      onClick={() => setColPage((p) => ({ ...p, [col]: Math.max(safePage - 1, 0) }))}
                      disabled={safePage === 0}
                      className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                    >‹</button>
                    <span className="text-gray-500">{safePage + 1}/{totalPages}</span>
                    <button
                      onClick={() => setColPage((p) => ({ ...p, [col]: Math.min(safePage + 1, totalPages - 1) }))}
                      disabled={safePage >= totalPages - 1}
                      className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                    >›</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal motif KO / Désistement */}
      <Modal
        isOpen={!!closeModal}
        onClose={() => { setCloseModal(null); setCloseReason(""); setCloseError(false); }}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
            Clôturer la candidature — {closeModal?.column}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Indiquez le motif (obligatoire) pour passer la candidature en « {closeModal?.column} ».
          </p>
          <textarea
            value={closeReason}
            onChange={(e) => { setCloseReason(e.target.value); if (e.target.value.trim()) setCloseError(false); }}
            rows={3}
            placeholder="Motif…"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-hidden focus:ring-2 dark:bg-gray-900 dark:text-white/90 ${
              closeError ? "border-error-500 focus:ring-error-500/10" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
            }`}
          />
          {closeError && <p className="mt-1 text-xs text-error-500">Le motif est obligatoire.</p>}
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => { setCloseModal(null); setCloseReason(""); setCloseError(false); }} disabled={closeSaving}>
              Annuler
            </Button>
            <Button onClick={confirmClose} disabled={closeSaving}>
              {closeSaving ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
