"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import type { User } from "@/types/auth";

type UserRecord = User & Record<string, unknown>;
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (responsibleIds: string[]) => Promise<void>;
  currentResponsibles?: Array<{ id: string; first_name?: string; last_name?: string; email?: string }> | null;
  /** @deprecated use currentResponsibles */
  currentResponsible?: { id: string; first_name?: string; last_name?: string; email?: string } | null;
  entityLabel?: string;
  isLoading?: boolean;
}

export default function AssignModal({
  isOpen,
  onClose,
  onAssign,
  currentResponsibles,
  currentResponsible,
  entityLabel = "cet élément",
  isLoading = false,
}: AssignModalProps) {
  // Support both the new array prop and the legacy single prop
  const initial = currentResponsibles
    ? currentResponsibles
    : currentResponsible
    ? [currentResponsible]
    : [];

  const [selected, setSelected] = useState<UserRecord[]>(initial as UserRecord[]);

  useEffect(() => {
    const init = currentResponsibles
      ? currentResponsibles
      : currentResponsible
      ? [currentResponsible]
      : [];
    setSelected(init as UserRecord[]);
  }, [isOpen]);

  const handleAdd = (id: string, item?: UserRecord) => {
    if (!item || selected.some(u => u.id === id)) return;
    setSelected(prev => [...prev, item]);
  };

  const handleRemoveChip = (id: string) => {
    setSelected(prev => prev.filter(u => u.id !== id));
  };

  const handleSubmit = async () => {
    await onAssign(selected.map(u => u.id as string));
    onClose();
  };

  const handleClear = async () => {
    await onAssign([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Affecter des responsables
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Sélectionnez un ou plusieurs utilisateurs pour prendre en charge {entityLabel}.
        </p>

        <InfiniteSelect<UserRecord>
          label="Ajouter un responsable"
          value=""
          onChange={handleAdd}
          useInfiniteQuery={useGetUsersForSelectInfiniteQuery as any}
          itemLabelKey="email"
          itemValueKey="id"
          placeholder="Rechercher un utilisateur..."
          emptyMessage="Aucun utilisateur trouvé"
        />

        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map(u => {
              const name = u.first_name || u.last_name
                ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                : String(u.email || u.id);
              return (
                <span
                  key={u.id as string}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm font-medium border border-brand-200 dark:border-brand-500/30"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(u.id as string)}
                    className="ml-0.5 text-brand-500 hover:text-brand-900 text-lg leading-none"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="flex justify-between gap-3 mt-6">
          {initial.length > 0 && (
            <Button variant="outline" onClick={handleClear} disabled={isLoading} className="text-error-500 border-error-300">
              Retirer toutes les affectations
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Affectation..." : "Affecter"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
