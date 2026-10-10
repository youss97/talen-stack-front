"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface PermanentDeleteCompanyModalProps {
  isOpen: boolean;
  companyName: string;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function PermanentDeleteCompanyModal({
  isOpen,
  companyName,
  onClose,
  onConfirm,
  isLoading = false,
}: PermanentDeleteCompanyModalProps) {
  const t = useTranslations("companies.list.permanentDeleteModal");
  const [typed, setTyped] = useState("");

  // Repartir d'un champ vide à chaque ouverture
  useEffect(() => {
    if (isOpen) setTyped("");
  }, [isOpen, companyName]);

  const canConfirm = typed.trim() === companyName.trim() && !isLoading;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-lg">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full text-error-500 bg-error-50 dark:bg-error-500/15 mb-4">
            <AlertTriangle size={24} strokeWidth={1.8} className="icon-glow" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t("title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("message", { name: companyName })}
          </p>

          <ul className="w-full text-start text-sm text-gray-600 dark:text-gray-300 mb-4 list-disc ps-5 space-y-1">
            <li>{t("items.users")}</li>
            <li>{t("items.clients")}</li>
            <li>{t("items.cvs")}</li>
            <li>{t("items.requests")}</li>
            <li>{t("items.applications")}</li>
            <li>{t("items.crm")}</li>
            <li>{t("items.other")}</li>
          </ul>

          <p className="text-sm font-medium text-error-600 dark:text-error-400 mb-4">
            {t("irreversible")}
          </p>

          <div className="w-full text-start mb-6">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
              {t("typeNameLabel", { name: companyName })}
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 bg-error-500 hover:bg-error-600 text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} strokeWidth={1.8} className="icon-glow animate-spin" />
                  {t("deleting")}
                </span>
              ) : (
                t("confirm")
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
