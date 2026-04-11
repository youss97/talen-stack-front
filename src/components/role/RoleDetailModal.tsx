"use client";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { RoleWithFeatures } from "@/types/role";

interface RoleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleWithFeatures | null;
  isLoading?: boolean;
}

export default function RoleDetailModal({
  isOpen,
  onClose,
  role,
  isLoading = false,
}: RoleDetailModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {role?.name || "Détails du rôle"}
        </h2>
        {role?.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {role.description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : role ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions attribuées
              </h3>

              {!role.features || role.features.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune permission attribuée</p>
              ) : (
                <div className="space-y-4">
                  {role.features.map((feature) => (
                    <div
                      key={feature.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {feature.name}
                        </p>
                      </div>

                      {feature.pages && feature.pages.length > 0 && (
                        <div className="p-4 space-y-3">
                          {feature.pages.map((page) => (
                            <div key={page.id}>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                {page.name}
                                {page.path && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({page.path})
                                  </span>
                                )}
                              </p>

                              {page.actions && page.actions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 ml-4">
                                  {page.actions.map((action) => (
                                    <Badge
                                      key={action.id}
                                      color="light"
                                      variant="solid"
                                      size="sm"
                                    >
                                      {action.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}