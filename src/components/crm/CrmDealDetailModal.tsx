"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useGetCrmDealByIdQuery, useUpdateCrmDealMutation, useUpdateCrmCompanyMutation } from "@/lib/services/crmApi";
import { LEAD_STATUSES, PIPELINE_STAGES } from "@/constants/crmProspecting";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { getApiErrorMessage } from "@/utils/errorMessages";
import type { CrmDeal } from "@/types/crm";
import CrmConvertToClientModal from "./CrmConvertToClientModal";
import CrmActivityTimeline from "./CrmActivityTimeline";
import CrmTaskList from "./CrmTaskList";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dealId: string | null;
  onDeleteRequest: (deal: CrmDeal) => void;
  canDelete?: boolean;
}

const STATUS_COLORS: Record<string, "info" | "success" | "error"> = {
  open: "info",
  won: "success",
  lost: "error",
};

export default function CrmDealDetailModal({ isOpen, onClose, dealId, onDeleteRequest, canDelete }: Props) {
  const t = useTranslations("crm.deals");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showLostReason, setShowLostReason] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [showConvert, setShowConvert] = useState(false);

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const { data: deal, isLoading, refetch } = useGetCrmDealByIdQuery(dealId ?? "", { skip: !isOpen || !dealId });
  const [updateDeal, { isLoading: isUpdating }] = useUpdateCrmDealMutation();
  const [updateCompany, { isLoading: isUpdatingLead }] = useUpdateCrmCompanyMutation();
  const tp = useTranslations("crm.prospecting");

  // Statut du lead / étape pipeline : valeurs du PROSPECT, modifiées ici et répercutées sur sa fiche
  const handleLeadChange = async (patch: { lead_status?: string; pipeline_stage?: string }) => {
    if (!deal) return;
    try {
      await updateCompany({ id: deal.crm_company_id, data: patch }).unwrap();
      await refetch();
      addToast("success", t("toasts.updateSuccess"));
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.updateError")));
    }
  };

  const handleMarkWon = async () => {
    if (!dealId) return;
    try {
      await updateDeal({ id: dealId, data: { status: "won" } }).unwrap();
      addToast("success", t("toasts.updateSuccess"));
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.updateError")));
    }
  };

  const handleMarkLost = async () => {
    if (!dealId) return;
    try {
      await updateDeal({ id: dealId, data: { status: "lost", lost_reason: lostReason } }).unwrap();
      addToast("success", t("toasts.updateSuccess"));
      setShowLostReason(false);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.updateError")));
    }
  };

  if (!isOpen || !dealId) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="p-6 sm:p-8 pb-0">
        {isLoading || !deal ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{deal.title}</h2>
              <Badge color={STATUS_COLORS[deal.status]} variant="light" size="sm">
                {t(`detail.status.${deal.status}`)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{deal.crmCompany?.name}</p>
          </>
        )}
      </div>

      {deal && (
        <div className="max-h-[65vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar space-y-5">
          {deal.description && <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{deal.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {deal.estimated_value != null && (
              <div><span className="text-gray-400">{t("form.fields.estimatedValue")}: </span>{deal.estimated_value.toLocaleString()} {deal.currency}</div>
            )}
            <div><span className="text-gray-400">{t("form.fields.stage")}: </span>{deal.current_stage}</div>
            {deal.expected_close_date && (
              <div><span className="text-gray-400">{t("form.fields.expectedCloseDate")}: </span>{deal.expected_close_date}</div>
            )}
            {deal.responsible && (
              <div><span className="text-gray-400">{t("detail.responsible")}: </span>{`${deal.responsible.first_name || ""} ${deal.responsible.last_name || ""}`.trim()}</div>
            )}
          </div>

          {deal.crmCompany && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 dark:border-gray-700">
              <div>
                <label className="mb-1 block text-xs text-gray-400">{tp("fields.leadStatus")}</label>
                <select
                  value={(deal.crmCompany.lead_status as string) || "Nouveau"}
                  disabled={isUpdatingLead}
                  onChange={(e) => handleLeadChange({ lead_status: e.target.value })}
                  className="h-10 w-full appearance-none rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{tp(`leadStatus.${s.key}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">{tp("fields.pipelineStage")}</label>
                <select
                  value={(deal.crmCompany.pipeline_stage as string) || "Prospection"}
                  disabled={isUpdatingLead}
                  onChange={(e) => handleLeadChange({ pipeline_stage: e.target.value })}
                  className="h-10 w-full appearance-none rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{tp(`pipelineStage.${s.key}`)}</option>
                  ))}
                </select>
              </div>
              <p className="col-span-full text-xs text-gray-400">{tp("syncHint")}</p>
            </div>
          )}

          {deal.contacts && deal.contacts.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t("detail.contacts")}</h3>
              <div className="space-y-2">
                {deal.contacts.map((c) => (
                  <div key={c.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {c.first_name} {c.last_name}
                      {c.position ? <span className="font-normal text-gray-500"> · {c.position}</span> : null}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {c.email && <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>}
                      {c.email && c.phone ? " · " : ""}
                      {c.phone && <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {deal.status === "lost" && deal.lost_reason && (
            <p className="text-sm text-error-600 dark:text-error-400 rounded-lg bg-error-50 dark:bg-error-500/10 p-3">{deal.lost_reason}</p>
          )}

          {deal.status === "open" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleMarkWon} disabled={isUpdating} className="bg-green-600 hover:bg-green-700">
                {t("detail.markWon")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowLostReason((v) => !v)} disabled={isUpdating}>
                {t("detail.markLost")}
              </Button>
            </div>
          )}

          {showLostReason && (
            <div className="space-y-2">
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={2}
                placeholder={t("detail.lostReasonPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" className="text-error-500 border-error-300" onClick={handleMarkLost} disabled={isUpdating}>
                  {t("detail.markLost")}
                </Button>
              </div>
            </div>
          )}

          {deal.status === "won" && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {deal.crmCompany?.converted_client_id ? (
                <p className="text-sm text-success-600 dark:text-success-400">{t("detail.alreadyConverted")}</p>
              ) : (
                <Button onClick={() => setShowConvert(true)} className="bg-brand-600 hover:bg-brand-700">
                  {t("detail.convertButton")}
                </Button>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <CrmTaskList crmCompanyId={deal.crm_company_id} crmDealId={deal.id} />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <CrmActivityTimeline crmCompanyId={deal.crm_company_id} crmDealId={deal.id} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        {canDelete && deal && (
          <button
            type="button"
            onClick={() => { onDeleteRequest(deal); onClose(); }}
            className="inline-flex items-center gap-1.5 text-sm text-error-500 hover:text-error-600"
          >
            <Trash2 size={16} strokeWidth={1.8} />
          </button>
        )}
        <Button variant="outline" onClick={onClose} className="ms-auto">{t("form.buttons.cancel")}</Button>
      </div>

      {deal && (
        <CrmConvertToClientModal
          isOpen={showConvert}
          onClose={() => setShowConvert(false)}
          dealId={deal.id}
          onSuccess={onClose}
        />
      )}
    </Modal>
  );
}
