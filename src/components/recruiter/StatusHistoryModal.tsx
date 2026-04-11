"use client";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { ApplicationStatusHistory } from "@/types/recruiter";

interface StatusHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ApplicationStatusHistory[];
  isLoading?: boolean;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
}

export default function StatusHistoryModal({
  isOpen,
  onClose,
  history,
  isLoading = false,
  getStatusLabel,
  getStatusColor,
}: StatusHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Historique des statuts
        </h2>
      </div>

      <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0 last:pb-0"
              >
                <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900" />
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.old_status && (
                        <>
                          <Badge
                            color={getStatusColor(item.old_status) as "success" | "error" | "warning" | "info" | "light"}
                            variant="light"
                            size="sm"
                          >
                            {getStatusLabel(item.old_status)}
                          </Badge>
                          <span className="text-gray-400">→</span>
                        </>
                      )}
                      <Badge
                        color={getStatusColor(item.new_status) as "success" | "error" | "warning" | "info" | "light"}
                        variant="light"
                        size="sm"
                      >
                        {getStatusLabel(item.new_status)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.changed_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {item.note && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {item.note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Par:</span>
                    <span className="font-medium">
                      {item.changed_by.first_name} {item.changed_by.last_name}
                    </span>
                    {item.changed_by.role && (
                      <>
                        <span>•</span>
                        <span>{item.changed_by.role.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun historique disponible
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}
