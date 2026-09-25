"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface SupportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => Promise<void>;
  isLoading?: boolean;
}

const SupportReportModal: React.FC<SupportReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const tc = useTranslations("common");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setDescription("");
    onClose();
  };

  const handleSubmit = async () => {
    await onSubmit(description);
    setDescription("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} showCloseButton={false} className="max-w-md">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full text-error-500 bg-error-50 dark:bg-error-500/15 mb-4">
            <LifeBuoy size={24} strokeWidth={1.8} className="icon-glow" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {tc("support.modalTitle")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {tc("support.modalSubtitle")}
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={tc("support.modalPlaceholder")}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800 mb-6"
          />
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isLoading}>
              {tc("actions.cancel")}
            </Button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 bg-error-500 hover:bg-error-600 text-white"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} strokeWidth={1.8} className="icon-glow animate-spin" />
                  {tc("support.sending")}
                </span>
              ) : tc("support.modalSubmit")}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SupportReportModal;
