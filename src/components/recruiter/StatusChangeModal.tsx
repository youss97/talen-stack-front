"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newStatus: string, note: string) => Promise<void>;
  currentStatus: string;
  isLoading?: boolean;
  availableStatuses: Array<{ value: string; label: string; color: string }>;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  onSubmit,
  currentStatus,
  isLoading = false,
  availableStatuses,
}: StatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState("");

  // Réinitialiser les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus);
      setNote("");
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newStatus === currentStatus) {
      alert("Veuillez sélectionner un nouveau statut");
      return;
    }
    
    try {
      await onSubmit(newStatus, note);
      setNote("");
      setNewStatus(currentStatus); // Reset au statut actuel
    } catch (error) {
      // L'erreur est gérée dans le composant parent
      console.error("Erreur dans StatusChangeModal:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Changer le statut
          </h2>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          {/* Statut actuel */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Statut actuel :</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {availableStatuses.find(s => s.value === currentStatus)?.label || currentStatus}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau statut <span className="text-red-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              required
            >
              {availableStatuses.map((status) => (
                <option 
                  key={status.value} 
                  value={status.value}
                  disabled={status.value === currentStatus}
                >
                  {status.label} {status.value === currentStatus ? '(actuel)' : ''}
                </option>
              ))}
            </select>
            {newStatus === currentStatus && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Veuillez sélectionner un nouveau statut différent du statut actuel
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Note (optionnelle)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              placeholder="Ajoutez une note sur ce changement de statut..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || newStatus === currentStatus}
            variant={newStatus === currentStatus ? "outline" : "primary"}
          >
            {isLoading ? "Enregistrement..." : "Changer le statut"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
