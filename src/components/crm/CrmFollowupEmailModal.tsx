"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { useSendCrmFollowupEmailMutation } from "@/lib/services/crmApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  crmCompanyId: string;
  contactId?: string;
  defaultRecipientEmail?: string;
  defaultRecipientName?: string;
  onSent?: () => void;
}

export default function CrmFollowupEmailModal({
  isOpen,
  onClose,
  crmCompanyId,
  contactId,
  defaultRecipientEmail,
  defaultRecipientName,
  onSent,
}: Props) {
  const t = useTranslations("crm.followupEmail");
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail || "");
  const [recipientName, setRecipientName] = useState(defaultRecipientName || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [sendEmail, { isLoading }] = useSendCrmFollowupEmailMutation();

  useEffect(() => {
    if (isOpen) {
      setRecipientEmail(defaultRecipientEmail || "");
      setRecipientName(defaultRecipientName || "");
      setSubject("");
      setMessage("");
      setError(null);
    }
  }, [isOpen, defaultRecipientEmail, defaultRecipientName]);

  const handleSend = async () => {
    if (!recipientEmail || !subject || !message) return;
    setError(null);
    try {
      await sendEmail({
        id: crmCompanyId,
        data: { recipientEmail, recipientName: recipientName || undefined, subject, message, contact_id: contactId },
      }).unwrap();
      onSent?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, t("error")));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t("title")}</h2>

        {error && <p className="text-sm text-error-500">{error}</p>}

        <Input type="email" placeholder={t("recipientEmail")} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
        <Input placeholder={t("recipientName")} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
        <Input placeholder={t("subjectPlaceholder")} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={t("messagePlaceholder")}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={handleSend} disabled={isLoading || !recipientEmail || !subject || !message}>
            {isLoading ? t("sending") : t("send")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
