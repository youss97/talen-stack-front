"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import type { CV } from "@/types/cv";

interface CVStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string, comment: string) => void;
  cv: CV | null;
  isLoading?: boolean;
}

export default function CVStatusModal({
  isOpen,
  onClose,
  onConfirm,
  cv,
  isLoading = false,
}: CVStatusModalProps) {
  const t = useTranslations("cvs");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Réinitialiser avec le statut actuel du CV ou vide
      setSelectedStatus(cv?.status || "");
      setComment("");
    }
  }, [cv, isOpen]);

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus, comment);
    }
  };

  const handleClose = () => {
    setSelectedStatus("");
    setComment("");
    onClose();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
      case "reviewed":
      case "shortlisted":
      case "interviewed":
      case "hired":
      case "rejected":
      case "archived":
        return t(`status.${status}`);
      default:
        return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {t("statusModal.title")}
        </h2>
        {cv && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {cv.candidate_first_name} {cv.candidate_last_name}
          </p>
        )}

        <div className="space-y-5">
          <div>
            <Label>
              {t("statusModal.newStatusLabel")} <span className="text-error-500">*</span>
            </Label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            >
              <option value="">{t("statusModal.selectStatusPlaceholder")}</option>
              <option value="new">{t("status.new")}</option>
              <option value="reviewed">{t("status.reviewed")}</option>
              <option value="shortlisted">{t("status.shortlisted")}</option>
              <option value="interviewed">{t("status.interviewed")}</option>
              <option value="hired">{t("status.hired")}</option>
              <option value="rejected">{t("status.rejected")}</option>
              <option value="archived">{t("status.archived")}</option>
            </select>
          </div>

          <div>
            <Label>{t("statusModal.commentLabel")}</Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("statusModal.commentPlaceholder")}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("statusModal.commentHint")}
            </p>
          </div>

          {cv?.status && selectedStatus && selectedStatus !== cv.status && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">{t("statusModal.changeLabel")}</span>{" "}
                {getStatusLabel(cv.status)} → {getStatusLabel(selectedStatus)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("statusModal.buttons.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || isLoading}
          >
            {isLoading ? t("statusModal.buttons.updating") : t("statusModal.buttons.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
