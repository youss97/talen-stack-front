"use client";
import { useState } from "react";
import { ChevronDown, LayoutTemplate } from "lucide-react";
import TemplatePickerModal from "@/components/email/TemplatePickerModal";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipients: ('candidate' | 'client')[], subject: string, message: string, cc: string[], bcc: string[]) => Promise<void>;
  isLoading?: boolean;
  candidateEmail?: string;
  clientEmail?: string;
  candidateName?: string;
  clientName?: string;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export default function SendEmailModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  candidateEmail,
  clientEmail,
  candidateName,
  clientName,
}: SendEmailModalProps) {
  const t = useTranslations("recruiterModals");
  const tc = useTranslations("common");
  const [recipients, setRecipients] = useState<('candidate' | 'client')[]>(['candidate']);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  // Destinataires additionnels en copie (chips)
  const [showCC, setShowCC] = useState(false);
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [showBCC, setShowBCC] = useState(false);
  const [bccList, setBccList] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");

  const handleRecipientToggle = (recipient: 'candidate' | 'client') => {
    setRecipients(prev => {
      if (prev.includes(recipient)) {
        // Retirer le destinataire (mais garder au moins un)
        const newRecipients = prev.filter(r => r !== recipient);
        return newRecipients.length > 0 ? newRecipients : prev;
      } else {
        // Ajouter le destinataire
        return [...prev, recipient];
      }
    });
  };

  const addChip = (input: string, setInput: (v: string) => void, list: string[], setList: (v: string[]) => void) => {
    const parts = input.split(/[,;\s\n]+/).map(s => s.trim()).filter(Boolean);
    const valid = parts.filter(e => isValidEmail(e) && !list.includes(e));
    if (valid.length === 0) return;
    setList([...list, ...valid]);
    setInput("");
  };

  const removeChip = (email: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.filter(e => e !== email));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError(t("sendEmail.errors.fillAllFields"));
      return;
    }

    if (recipients.length === 0) {
      setError(t("sendEmail.errors.selectRecipient"));
      return;
    }

    if (recipients.includes('candidate') && !candidateEmail) {
      setError(t("sendEmail.errors.candidateEmailMissing"));
      return;
    }

    if (recipients.includes('client') && !clientEmail) {
      setError(t("sendEmail.errors.clientEmailMissing"));
      return;
    }

    try {
      await onSubmit(recipients, subject, message, ccList, bccList);
      setSubject("");
      setMessage("");
      setRecipients(['candidate']);
      setCcList([]);
      setBccList([]);
      setShowCC(false);
      setShowBCC(false);
    } catch (err) {
      setError(t("sendEmail.errors.sendFailed"));
    }
  };

  const getRecipientEmails = () => {
    return recipients.map(r => r === 'candidate' ? candidateEmail : clientEmail).filter(Boolean).join(', ');
  };

  const ChipList = ({ items, onRemove, colorClass }: { items: string[]; onRemove: (e: string) => void; colorClass: string }) =>
    items.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map(email => (
          <span key={email} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
            {email}
            <button type="button" onClick={() => onRemove(email)} className="ms-0.5 hover:opacity-70 text-sm leading-none">×</button>
          </span>
        ))}
      </div>
    ) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {t("sendEmail.title")}
          </h2>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Sélection des destinataires (checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("sendEmail.recipientsLabel")}
            </label>
            <div className="space-y-2">
              {candidateEmail && (
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={recipients.includes('candidate')}
                    onChange={() => handleRecipientToggle('candidate')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                  />
                  <div className="ms-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("sendEmail.candidate")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {candidateName && <span>{candidateName} - </span>}
                      {candidateEmail}
                    </div>
                  </div>
                </label>
              )}

              {clientEmail && (
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={recipients.includes('client')}
                    onChange={() => handleRecipientToggle('client')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                  />
                  <div className="ms-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {t("sendEmail.client")}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {clientName && <span>{clientName} - </span>}
                      {clientEmail}
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Aperçu des destinataires */}
          {recipients.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">{t("sendEmail.previewLabel")}</span> {getRecipientEmails()}
              </p>
            </div>
          )}

          {/* CC */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <button
              type="button"
              onClick={() => setShowCC(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                CC
              </span>
              {showCC ? t("sendEmail.ccHideLabel") : t("sendEmail.ccShowLabel")}
              {ccList.length > 0 && !showCC && (
                <span className="ms-1 text-xs text-blue-600 dark:text-blue-400">({ccList.length})</span>
              )}
              <ChevronDown className={`icon-glow w-4 h-4 transition-transform ${showCC ? "rotate-180" : ""}`} size={16} strokeWidth={1.8} />
            </button>

            {showCC && (
              <div className="mt-3 ps-3 border-s-2 border-blue-100 dark:border-blue-500/20">
                <Label>CC</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputField
                      placeholder={t("sendEmail.ccPlaceholder")}
                      value={ccInput}
                      onChange={e => setCcInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === "," || e.key === ";") {
                          e.preventDefault();
                          addChip(ccInput, setCcInput, ccList, setCcList);
                        }
                      }}
                      onPaste={e => {
                        e.preventDefault();
                        addChip(e.clipboardData.getData("text"), setCcInput, ccList, setCcList);
                      }}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addChip(ccInput, setCcInput, ccList, setCcList)}>
                    {t("sendEmail.ccAddButton")}
                  </Button>
                </div>
                <ChipList
                  items={ccList}
                  onRemove={e => removeChip(e, ccList, setCcList)}
                  colorClass="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                />
              </div>
            )}
          </div>

          {/* CCI (BCC) */}
          <div>
            <button
              type="button"
              onClick={() => setShowBCC(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                CCI
              </span>
              {showBCC ? t("sendEmail.bccHideLabel") : t("sendEmail.bccShowLabel")}
              {bccList.length > 0 && !showBCC && (
                <span className="ms-1 text-xs text-gray-500">({bccList.length})</span>
              )}
              <ChevronDown className={`icon-glow w-4 h-4 transition-transform ${showBCC ? "rotate-180" : ""}`} size={16} strokeWidth={1.8} />
            </button>

            {showBCC && (
              <div className="mt-3 ps-3 border-s-2 border-gray-100 dark:border-gray-700">
                <Label>CCI</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <InputField
                      placeholder={t("sendEmail.bccPlaceholder")}
                      value={bccInput}
                      onChange={e => setBccInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" || e.key === "," || e.key === ";") {
                          e.preventDefault();
                          addChip(bccInput, setBccInput, bccList, setBccList);
                        }
                      }}
                      onPaste={e => {
                        e.preventDefault();
                        addChip(e.clipboardData.getData("text"), setBccInput, bccList, setBccList);
                      }}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => addChip(bccInput, setBccInput, bccList, setBccList)}>
                    {t("sendEmail.ccAddButton")}
                  </Button>
                </div>
                <ChipList
                  items={bccList}
                  onRemove={e => removeChip(e, bccList, setBccList)}
                  colorClass="bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                />
              </div>
            )}
          </div>

          {/* Sujet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("sendEmail.subjectLabel")}
              </label>
              <button
                type="button"
                onClick={() => setIsTemplatePickerOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                <LayoutTemplate size={14} strokeWidth={1.8} className="icon-glow" />
                {t("sendEmail.chooseTemplate")}
              </button>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              placeholder={t("sendEmail.subjectPlaceholder")}
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("sendEmail.messageLabel")}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              style={{ minHeight: '200px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 resize-none"
              placeholder={t("sendEmail.messagePlaceholder")}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("sendEmail.messageHint")}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("sendEmail.sending") : t("sendEmail.sendButton")}
          </Button>
        </div>
      </form>
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        type="APPLICATION_MANUAL"
        title={t("sendEmail.chooseTemplate")}
        onConfirm={({ subject: tplSubject, body_html }) => {
          setSubject(tplSubject);
          setMessage(body_html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").trim());
          setIsTemplatePickerOpen(false);
        }}
      />
    </Modal>
  );
}
