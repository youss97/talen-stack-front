"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import type { User } from "@/types/auth";

type UserRecord = User & Record<string, unknown>;
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (responsibleId: string | null) => Promise<void>;
  currentResponsible?: { id: string; first_name?: string; last_name?: string; email?: string } | null;
  entityLabel?: string;
  isLoading?: boolean;
}

export default function AssignModal({
  isOpen,
  onClose,
  onAssign,
  currentResponsible,
  entityLabel = "cet élément",
  isLoading = false,
}: AssignModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentResponsible?.id || "");

  const initialUser = currentResponsible
    ? [{
        id: currentResponsible.id,
        first_name: currentResponsible.first_name || "",
        last_name: currentResponsible.last_name || "",
        email: currentResponsible.email || `${currentResponsible.first_name} ${currentResponsible.last_name}`.trim(),
      }] as unknown as UserRecord[]
    : [] as UserRecord[];

  const handleSubmit = async () => {
    await onAssign(selectedUserId || null);
    onClose();
  };

  const handleRemove = async () => {
    await onAssign(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Affecter un responsable
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Sélectionnez un utilisateur pour prendre en charge {entityLabel}.
        </p>

        <InfiniteSelect<UserRecord>
          label="Responsable"
          value={selectedUserId}
          onChange={setSelectedUserId}
          useInfiniteQuery={useGetUsersForSelectInfiniteQuery as any}
          itemLabelKey="email"
          itemValueKey="id"
          placeholder="Sélectionner un utilisateur..."
          emptyMessage="Aucun utilisateur trouvé"
          initialSelectedItems={initialUser}
        />

        <div className="flex justify-between gap-3 mt-6">
          {currentResponsible && (
            <Button variant="outline" onClick={handleRemove} disabled={isLoading} className="text-error-500 border-error-300">
              Retirer l&apos;affectation
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || !selectedUserId}>
              {isLoading ? "Affectation..." : "Affecter"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
