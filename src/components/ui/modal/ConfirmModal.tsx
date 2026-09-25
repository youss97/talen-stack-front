"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Modal } from "./index";
import Button from "../button/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  isLoading = false,
}) => {
  const t = useTranslations("common");
  const resolvedConfirmText = confirmText ?? t("actions.confirm");
  const resolvedCancelText = cancelText ?? t("actions.cancel");
  const variantClasses: Record<"danger" | "warning" | "info", { icon: string; button: string }> = {
    danger: {
      icon: "text-error-500 bg-error-50 dark:bg-error-500/15",
      button: "bg-error-500 hover:bg-error-600 text-white",
    },
    warning: {
      icon: "text-warning-500 bg-warning-50 dark:bg-warning-500/15",
      button: "bg-warning-500 hover:bg-warning-600 text-white",
    },
    info: {
      icon: "text-blue-500 bg-blue-50 dark:bg-blue-500/15",
      button: "bg-blue-500 hover:bg-blue-600 text-white",
    },
  };

  const icons = {
    danger: <AlertCircle size={24} strokeWidth={1.8} className="icon-glow" />,
    warning: <AlertTriangle size={24} strokeWidth={1.8} className="icon-glow" />,
    info: <Info size={24} strokeWidth={1.8} className="icon-glow" />,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-md">
      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className={`p-3 rounded-full ${variantClasses[variant].icon} mb-4`}>
            {icons[variant]}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {message}
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {resolvedCancelText}
            </Button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${variantClasses[variant].button}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} strokeWidth={1.8} className="icon-glow animate-spin" />
                  {t("status.loading")}
                </span>
              ) : resolvedConfirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
