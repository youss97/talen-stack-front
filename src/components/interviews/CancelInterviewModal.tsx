"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type { Interview } from "@/types/interview";

interface CancelInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
  interview: Interview | null;
}

export default function CancelInterviewModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  interview,
}: CancelInterviewModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Veuillez indiquer la raison de l'annulation");
      return;
    }

    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (err) {
      setError("Erreur lors de l'annulation de l'entretien");
    }
  };

  if (!interview) return null;

  const interviewDate = new Date(interview.scheduled_date);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            ❌ Annuler l'entretien
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Entretien du {interviewDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} à {interviewDate.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg">⚠️</span>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Attention</p>
                <p className="mt-1">
                  Cette action annulera définitivement l'entretien. Un email sera automatiquement 
                  envoyé au candidat et aux invités pour les informer de l'annulation.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Raison de l'annulation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ex: Candidat indisponible, report de la décision, etc."
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Garder l'entretien
          </Button>
          <Button type="submit" variant="danger" disabled={isLoading}>
            {isLoading ? "Annulation..." : "Confirmer l'annulation"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}