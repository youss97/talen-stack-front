"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star, Trash2, Plus, Lock, Mail } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import {
  useGetCrmCompanyByIdQuery,
  useCreateCrmContactMutation,
  useUpdateCrmContactMutation,
  useDeleteCrmContactMutation,
} from "@/lib/services/crmApi";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import CrmActivityTimeline from "./CrmActivityTimeline";
import CrmTaskList from "./CrmTaskList";
import CrmFollowupEmailModal from "./CrmFollowupEmailModal";
import CrmConvertToClientModal from "./CrmConvertToClientModal";
import type { CrmContact } from "@/types/crm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  crmCompanyId: string | null;
}

const STAGE_COLORS: Record<string, "info" | "success" | "error"> = {
  prospect: "info",
  client: "success",
  perdu: "error",
};

export default function CrmCompanyDetailModal({ isOpen, onClose, crmCompanyId }: Props) {
  const t = useTranslations("crm.companies");
  const tFollowup = useTranslations("crm.followupEmail");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ first_name: "", last_name: "", position: "", email: "", phone: "" });
  const [followupContact, setFollowupContact] = useState<CrmContact | null>(null);
  const [showConvert, setShowConvert] = useState(false);

  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const { data: company, isLoading } = useGetCrmCompanyByIdQuery(crmCompanyId ?? "", { skip: !isOpen || !crmCompanyId });
  const [createContact, { isLoading: isCreatingContact }] = useCreateCrmContactMutation();
  const [updateContact] = useUpdateCrmContactMutation();
  const [deleteContact] = useDeleteCrmContactMutation();

  const handleAddContact = async () => {
    if (!crmCompanyId || !contactForm.first_name || !contactForm.last_name) return;
    try {
      await createContact({ crmCompanyId, data: contactForm }).unwrap();
      addToast("success", t("toasts.contactAdded"));
      setContactForm({ first_name: "", last_name: "", position: "", email: "", phone: "" });
      setShowAddContact(false);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.contactError")));
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    if (!crmCompanyId) return;
    await updateContact({ id: contactId, crmCompanyId, data: { is_primary: true } }).unwrap().catch(() => {
      addToast("error", t("toasts.contactError"));
    });
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!crmCompanyId) return;
    await deleteContact({ id: contactId, crmCompanyId }).unwrap().catch(() => {
      addToast("error", t("toasts.contactError"));
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="p-6 sm:p-8 pb-0">
        {isLoading || !company ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{company.name}</h2>
                <Badge color={STAGE_COLORS[company.stage] || "info"} variant="light" size="sm">
                  {t(`list.stage.${company.stage}`)}
                </Badge>
              </div>
              {company.converted_client_id ? (
                <span className="text-xs font-medium text-success-600 dark:text-success-400">{t("convertToClient.alreadyConverted")}</span>
              ) : (
                <Button size="sm" onClick={() => setShowConvert(true)} className="bg-brand-600 hover:bg-brand-700">
                  {t("convertToClient.button")}
                </Button>
              )}
            </div>
            {company.industry && <p className="text-sm text-gray-500 dark:text-gray-400">{company.industry}</p>}
          </>
        )}
      </div>

      {company && (
        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {company.address && <div><span className="text-gray-400">{t("form.fields.address")}: </span>{company.address}</div>}
            {company.city && <div><span className="text-gray-400">{t("form.fields.city")}: </span>{company.city}</div>}
            {company.source && <div><span className="text-gray-400">{t("form.fields.source")}: </span>{company.source}</div>}
            {company.responsible && (
              <div>
                <span className="text-gray-400">{t("list.columns.responsible")}: </span>
                {`${company.responsible.first_name || ""} ${company.responsible.last_name || ""}`.trim()}
              </div>
            )}
          </div>

          {company.internal_note && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 inline-flex items-center gap-1.5">
                <Lock size={14} strokeWidth={1.8} />
                {t("form.fields.internalNote")}
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3">
                {company.internal_note}
              </p>
            </div>
          )}

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("contacts.title")}</h3>
              <button
                type="button"
                onClick={() => setShowAddContact((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <Plus size={14} strokeWidth={1.8} />
                {t("contacts.addButton")}
              </button>
            </div>

            {showAddContact && (
              <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={t("contacts.fields.firstName")} value={contactForm.first_name}
                    onChange={(e) => setContactForm((f) => ({ ...f, first_name: e.target.value }))} />
                  <Input placeholder={t("contacts.fields.lastName")} value={contactForm.last_name}
                    onChange={(e) => setContactForm((f) => ({ ...f, last_name: e.target.value }))} />
                </div>
                <Input placeholder={t("contacts.fields.position")} value={contactForm.position}
                  onChange={(e) => setContactForm((f) => ({ ...f, position: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="email" placeholder={t("contacts.fields.email")} value={contactForm.email}
                    onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))} />
                  <Input placeholder={t("contacts.fields.phone")} value={contactForm.phone}
                    onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleAddContact} disabled={isCreatingContact || !contactForm.first_name || !contactForm.last_name}>
                    {t("contacts.add")}
                  </Button>
                </div>
              </div>
            )}

            {(company.contacts || []).length === 0 ? (
              <p className="text-sm text-gray-400">{t("contacts.empty")}</p>
            ) : (
              <div className="space-y-2">
                {(company.contacts || []).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-1.5">
                        {contact.is_primary && <Star size={14} strokeWidth={1.8} className="text-amber-400 fill-amber-400" />}
                        {contact.first_name} {contact.last_name}
                        {contact.position && <span className="text-gray-400 font-normal"> — {contact.position}</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {[contact.email, contact.phone].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {contact.email && (
                        <button type="button" onClick={() => setFollowupContact(contact)} title={tFollowup("button")}>
                          <Mail size={16} strokeWidth={1.8} className="text-gray-300 hover:text-brand-500" />
                        </button>
                      )}
                      {!contact.is_primary && (
                        <button type="button" onClick={() => handleSetPrimary(contact.id)} title={t("contacts.primary")}>
                          <Star size={16} strokeWidth={1.8} className="text-gray-300 hover:text-amber-400" />
                        </button>
                      )}
                      <button type="button" onClick={() => handleRemoveContact(contact.id)}>
                        <Trash2 size={16} strokeWidth={1.8} className="text-gray-400 hover:text-error-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opportunités liées */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("deals.title")}</h3>
            {(company.deals || []).length === 0 ? (
              <p className="text-sm text-gray-400">{t("deals.empty")}</p>
            ) : (
              <div className="space-y-2">
                {(company.deals || []).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
                    <span className="font-medium text-gray-800 dark:text-white">{deal.title}</span>
                    <span className="text-gray-500 dark:text-gray-400">{deal.current_stage}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <CrmTaskList crmCompanyId={company.id} />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <CrmActivityTimeline crmCompanyId={company.id} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>{t("close")}</Button>
      </div>

      {company && followupContact && (
        <CrmFollowupEmailModal
          isOpen={!!followupContact}
          onClose={() => setFollowupContact(null)}
          crmCompanyId={company.id}
          contactId={followupContact.id}
          defaultRecipientEmail={followupContact.email || ""}
          defaultRecipientName={`${followupContact.first_name} ${followupContact.last_name}`.trim()}
          onSent={() => addToast("success", t("toasts.updateSuccess"))}
        />
      )}

      {company && (
        <CrmConvertToClientModal
          isOpen={showConvert}
          onClose={() => setShowConvert(false)}
          mode="company"
          crmCompanyId={company.id}
          onSuccess={() => { setShowConvert(false); addToast("success", t("toasts.updateSuccess")); }}
        />
      )}
    </Modal>
  );
}
