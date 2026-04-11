"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import ManagerFormModal from "@/components/manager/ManagerFormModal";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useActions } from "@/hooks/useActions";
import type { Manager } from "@/types/manager";
import type { CreateManagerFormData } from "@/validations/managerValidation";
import {
  useGetClientManagersQuery,
  useCreateManagerForClientMutation,
  useUpdateManagerMutation,
  useToggleManagerStatusMutation,
  useGetClientsForSelectInfiniteQuery,
  useGetClientByIdQuery,
} from "@/lib/services/clientApi";

export default function ManagersPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/managers");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    managerId: string | null;
    managerName: string;
    managerStatus: string;
  }>({
    isOpen: false,
    managerId: null,
    managerName: "",
    managerStatus: "active",
  });

  // Get managers for selected client
  const { data, isLoading, isFetching } = useGetClientManagersQuery(
    {
      clientId: selectedClientId,
      page,
      limit: 5,
      search: search || undefined,
      status: statusFilter || undefined,
    },
    { skip: !selectedClientId }
  );

  // Get selected client info to check status
  const { data: selectedClient } = useGetClientByIdQuery(selectedClientId, {
    skip: !selectedClientId,
  });

  const [createManager, { isLoading: isCreating }] = useCreateManagerForClientMutation();
  const [updateManager, { isLoading: isUpdating }] = useUpdateManagerMutation();
  const [toggleStatus] = useToggleManagerStatusMutation();
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message?: string
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const columns: Column<Manager>[] = [
    {
      key: "displayName",
      header: "Manager",
      className: "font-medium",
      render: (_value, row) => {
        const manager = row as any;
        const name = manager.displayName || `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || 'N/A';
        const position = manager.position;
        
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{name}</div>
            {position && (
              <div className="text-sm text-gray-500 dark:text-gray-400">{position}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      render: (_value, row) => {
        const manager = row as any;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {manager.email || '-'}
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Téléphone",
      render: (_value, row) => {
        const manager = row as any;
        // Les données sont dans row.manager.phone car l'API retourne { manager: { ... } }
        const phone = manager.manager?.phone || manager.phone;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {phone || '-'}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      render: (_value, row) => {
        const manager = row as any;
        const status = manager.status || "active";
        
        let color: "success" | "warning" | "error" = "success";
        let label = "Actif";
        
        if (status === "active") {
          color = "success";
          label = "Actif";
        } else if (status === "inactive") {
          color = "warning";
          label = "Inactif";
        } else {
          color = "error";
          label = "Bloqué";
        }
        
        return <Badge variant="light" color={color}>{label}</Badge>;
      },
    },
  ];

  const handleCreateManager = async (formData: CreateManagerFormData) => {
    if (!selectedClientId) {
      addToast("error", "Erreur", "Veuillez sélectionner un client");
      return;
    }

    try {
      // Créer un FormData pour envoyer le fichier
      const formDataToSend = new FormData();
      formDataToSend.append("first_name", formData.first_name);
      formDataToSend.append("last_name", formData.last_name);
      formDataToSend.append("email", formData.email);
      
      // En mode édition, le mot de passe est optionnel
      if (formData.password) {
        formDataToSend.append("password", formData.password);
      }
      
      if (formData.phone) {
        formDataToSend.append("phone", formData.phone);
      }
      if (formData.position) {
        formDataToSend.append("position", formData.position);
      }
      // N'ajouter la photo que si elle existe
      if (formData.photo && formData.photo instanceof File) {
        formDataToSend.append("photo", formData.photo);
      }

      if (selectedManager) {
        // Mode édition
        await updateManager({
          clientId: selectedClientId,
          managerId: selectedManager.id,
          managerData: formDataToSend,
        }).unwrap();
        addToast("success", "Manager modifié avec succès");
      } else {
        // Mode création
        await createManager({
          clientId: selectedClientId,
          managerData: formDataToSend,
        }).unwrap();
        addToast("success", "Manager créé avec succès");
      }
      
      setIsFormModalOpen(false);
      setSelectedManager(null);
    } catch (error) {
      const message = getErrorMessage(
        error,
        selectedManager ? "Erreur lors de la modification du manager" : "Erreur lors de la création du manager"
      );
      addToast("error", "Erreur", message);
    }
  };

  const handleEditClick = (manager: Manager) => {
    setSelectedManager(manager);
    setIsFormModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedManager(null);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (manager: Manager) => {
    const mgr = manager as any;
    setConfirmModal({
      isOpen: true,
      managerId: mgr.id,
      managerName: mgr.displayName || `${mgr.firstName || ''} ${mgr.lastName || ''}`.trim() || 'Manager',
      managerStatus: mgr.status || 'active',
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.managerId || !selectedClientId) return;

    setIsTogglingStatus(true);
    try {
      await toggleStatus({
        clientId: selectedClientId,
        managerId: confirmModal.managerId,
      }).unwrap();
      const action = confirmModal.managerStatus === 'active' ? 'désactivé' : 'activé';
      addToast("success", `Manager ${action} avec succès`);
      setConfirmModal({ isOpen: false, managerId: null, managerName: "", managerStatus: "active" });
    } catch (error) {
      const message = getErrorMessage(error, "Erreur lors de la modification du statut");
      addToast("error", "Erreur", message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Vérifier si on peut modifier le status des managers
  const canToggleManagerStatus = selectedClient?.status === 'active';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Managers
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez les managers assignés aux clients
          </p>
        </div>
        {canCreate && selectedClientId && canToggleManagerStatus && (
          <Button onClick={handleAddClick}>
            + Ajouter un Manager
          </Button>
        )}
      </div>

      {/* Client Selection Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sélectionner un client
          </label>
          <InfiniteSelect
            value={selectedClientId}
            onChange={(value) => {
              setSelectedClientId(value);
              setPage(1);
            }}
            useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
            itemLabelKey="name"
            itemValueKey="id"
            placeholder="Choisir un client..."
            emptyMessage="Aucun client trouvé"
          />
        </div>
      </div>

      {selectedClientId ? (
        <>
          {/* Table Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {selectedClient?.status === 'inactive' && (
              <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border-b border-warning-200 dark:border-warning-800">
                <div className="flex items-center gap-2 text-warning-800 dark:text-warning-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    Ce client est désactivé. Vous devez d'abord activer le client pour pouvoir gérer ses managers.
                  </span>
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={data?.data || []}
              isLoading={isLoading}
              emptyMessage="Aucun manager trouvé pour ce client"
              onEdit={canUpdate && canToggleManagerStatus ? handleEditClick : undefined}
              onDelete={canDelete && canToggleManagerStatus ? handleDeleteClick : undefined}
            />
          </div>

          {/* Pagination */}
          {data && data.meta && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                totalItems={data.meta.total}
                itemsPerPage={data.meta.limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Sélectionnez un client
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choisissez un client pour voir et gérer ses managers
          </p>
        </div>
      )}

      {/* Modals */}
      <ManagerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedManager(null);
        }}
        onSubmit={handleCreateManager}
        manager={selectedManager}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, managerId: null, managerName: "", managerStatus: "active" })
        }
        onConfirm={handleConfirmDelete}
        title={confirmModal.managerStatus === 'active' ? "Désactiver le manager" : "Activer le manager"}
        message={
          confirmModal.managerStatus === 'active'
            ? `Êtes-vous sûr de vouloir désactiver ${confirmModal.managerName} ? Il ne pourra plus se connecter.`
            : `Êtes-vous sûr de vouloir activer ${confirmModal.managerName} ? Il pourra se connecter.`
        }
        confirmText={confirmModal.managerStatus === 'active' ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        variant={confirmModal.managerStatus === 'active' ? "danger" : "info"}
        isLoading={isTogglingStatus}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
