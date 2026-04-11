"use client";
import { useState, useEffect } from "react";
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
        return "Nouveau";
      case "reviewed":
        return "Examiné";
      case "shortlisted":
        return "Présélectionné";
      case "interviewed":
        return "Interviewé";
      case "hired":
        return "Embauché";
      case "rejected":
        return "Rejeté";
      case "archived":
        return "Archivé";
      default:
        return status;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Changer le statut du CV
        </h2>
        {cv && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {cv.candidate_first_name} {cv.candidate_last_name}
          </p>
        )}

        <div className="space-y-5">
          <div>
            <Label>
              Nouveau statut <span className="text-error-500">*</span>
            </Label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            >
              <option value="">Sélectionner un statut...</option>
              <option value="new">Nouveau</option>
              <option value="reviewed">Examiné</option>
              <option value="shortlisted">Présélectionné</option>
              <option value="interviewed">Interviewé</option>
              <option value="hired">Embauché</option>
              <option value="rejected">Rejeté</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div>
            <Label>Commentaire (optionnel)</Label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajouter un commentaire sur ce changement de statut..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Ce commentaire sera enregistré dans l'historique du CV
            </p>
          </div>

          {cv?.status && selectedStatus && selectedStatus !== cv.status && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Changement:</span>{" "}
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
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStatus || isLoading}
          >
            {isLoading ? "Mise à jour..." : "Confirmer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
