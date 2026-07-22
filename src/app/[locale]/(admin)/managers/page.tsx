"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import ManagerFormModal from "@/components/manager/ManagerFormModal";
import ManagerDetailModal from "@/components/manager/ManagerDetailModal";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useActions } from "@/hooks/useActions";
import type { Manager } from "@/types/client";
import type { CreateManagerFormData } from "@/validations/managerValidation";
import {
  useGetClientManagersQuery,
  useCreateManagerForClientMutation,
  useUpdateManagerMutation,
  useToggleManagerStatusMutation,
  useRemoveManagerFromClientMutation,
  useGetClientsForSelectInfiniteQuery,
  useGetClientByIdQuery,
} from "@/lib/services/clientApi";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function ManagersPage() {
  const t = useTranslations("managers");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/managers");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [viewManager, setViewManager] = useState<Manager | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
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
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    managerId: string | null;
    managerName: string;
  }>({
    isOpen: false,
    managerId: null,
    managerName: "",
  });
  const [isRemoving, setIsRemoving] = useState(false);

  // Get managers for selected client
  const { data, isLoading, isFetching } = useGetClientManagersQuery(
    {
      clientId: selectedClientId,
      page,
      limit,
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
  const [removeManagerFromClient] = useRemoveManagerFromClientMutation();
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

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleViewClick = (manager: Manager) => {
    setViewManager(manager);
    setIsViewModalOpen(true);
  };

  const columns: Column<Manager>[] = [
    {
      key: "displayName",
      header: t("list.columns.collaborator"),
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
      header: t("list.columns.email"),
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
      header: t("list.columns.phone"),
      render: (_value, row) => {
        const manager = row as any;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {manager.phone || '-'}
          </div>
        );
      },
    },
    {
      key: "status",
      header: t("list.columns.status"),
      render: (_value, row) => {
        const manager = row as any;
        const status = manager.status || "active";

        let color: "success" | "warning" | "error" = "success";
        let label = t("list.status.active");

        if (status === "active") {
          color = "success";
          label = t("list.status.active");
        } else if (status === "inactive") {
          color = "warning";
          label = t("list.status.inactive");
        } else {
          color = "error";
          label = t("list.status.blocked");
        }

        return <Badge variant="light" color={color}>{label}</Badge>;
      },
    },
    {
      key: "creatorName",
      header: t("list.columns.createdBy"),
      render: (_value, row) => {
        const manager = row as any;
        return (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {manager.creatorName || "—"}
          </div>
        );
      },
    },
  ];

  const handleCreateManager = async (formData: CreateManagerFormData) => {
    if (!selectedClientId) {
      addToast("error", t("toasts.selectClientFirstTitle"), t("toasts.selectClientFirstMessage"));
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
        addToast("success", t("toasts.updateSuccess"));
      } else {
        // Mode création
        await createManager({
          clientId: selectedClientId,
          managerData: formDataToSend,
        }).unwrap();
        addToast("success", t("toasts.createSuccess"));
      }

      setIsFormModalOpen(false);
      setSelectedManager(null);
    } catch (error) {
      const message = getErrorMessage(
        error,
        selectedManager ? t("toasts.updateError") : t("toasts.createError")
      );
      addToast("error", t("toasts.errorTitle"), message);
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

  const handleToggleClick = (manager: Manager) => {
    const mgr = manager as any;
    setConfirmModal({
      isOpen: true,
      managerId: mgr.id,
      managerName: mgr.displayName || `${mgr.firstName || ''} ${mgr.lastName || ''}`.trim() || t("detail.defaultName"),
      managerStatus: mgr.status || 'active',
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.managerId || !selectedClientId) return;

    setIsTogglingStatus(true);
    try {
      await toggleStatus({
        clientId: selectedClientId,
        managerId: confirmModal.managerId,
      }).unwrap();
      const successMessage = confirmModal.managerStatus === 'active'
        ? t("toasts.managerDeactivatedSuccess")
        : t("toasts.managerActivatedSuccess");
      addToast("success", successMessage);
      setConfirmModal({ isOpen: false, managerId: null, managerName: "", managerStatus: "active" });
    } catch (error) {
      const message = getErrorMessage(error, t("toasts.statusToggleError"));
      addToast("error", t("toasts.errorTitle"), message);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteClick = (manager: Manager) => {
    const mgr = manager as any;
    setConfirmDeleteModal({
      isOpen: true,
      managerId: mgr.id,
      managerName: mgr.displayName || `${mgr.firstName || ''} ${mgr.lastName || ''}`.trim() || t("detail.defaultName"),
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteModal.managerId || !selectedClientId) return;

    setIsRemoving(true);
    try {
      await removeManagerFromClient({
        clientId: selectedClientId,
        managerId: confirmDeleteModal.managerId,
      }).unwrap();
      addToast("success", t("toasts.managerDeletedSuccess"));
      setConfirmDeleteModal({ isOpen: false, managerId: null, managerName: "" });
    } catch (error) {
      const message = getErrorMessage(error, t("toasts.managerDeleteError"));
      addToast("error", t("toasts.errorTitle"), message);
    } finally {
      setIsRemoving(false);
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
            {t("list.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("list.subtitle")}
          </p>
        </div>
        {canCreate && selectedClientId && canToggleManagerStatus && (
          <Button onClick={handleAddClick}>
            + {t("list.addButton")}
          </Button>
        )}
      </div>

      {/* Client Selection Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-md">
          <InfiniteSelect
            label={t("list.clientSelect.label")}
            value={selectedClientId}
            onChange={(value) => {
              setSelectedClientId(value);
              setPage(1);
            }}
            useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
            itemLabelKey="name"
            itemValueKey="id"
            placeholder={t("list.clientSelect.placeholder")}
            emptyMessage={t("list.clientSelect.emptyMessage")}
          />
        </div>
      </div>

      {selectedClientId ? (
        <>
          {/* Table */}
          {selectedClient?.status === 'inactive' && (
              <div className="mb-4 rounded-xl p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800">
                <div className="flex items-center gap-2 text-warning-800 dark:text-warning-200">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">
                    {t("list.clientInactiveWarning")}
                  </span>
                </div>
              </div>
            )}
            <DataTable
              columns={columns}
              data={data?.data || []}
              isLoading={isLoading}
              emptyMessage={t("list.emptyState.noManagers")}
              onView={handleViewClick}
              onEdit={canUpdate && canToggleManagerStatus ? handleEditClick : undefined}
              onDelete={canDelete && canToggleManagerStatus ? handleDeleteClick : undefined}
              customActions={canUpdate && canToggleManagerStatus ? [
                {
                  label: t("confirm.deactivateTitle"),
                  icon: <LockIcon />,
                  color: "warning",
                  onClick: (row) => handleToggleClick(row),
                  hidden: (row) => (row as any).status !== "active",
                },
                {
                  label: t("confirm.activateTitle"),
                  icon: <UnlockIcon />,
                  color: "success",
                  onClick: (row) => handleToggleClick(row),
                  hidden: (row) => (row as any).status === "active",
                },
              ] : undefined}
            />

          {/* Pagination */}
          {data && data.pagination && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
              <Pagination
                currentPage={page}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.total}
                itemsPerPage={data.pagination.limit}
                onPageChange={setPage}
                onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }}
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
            {t("list.emptyState.noClientTitle")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("list.emptyState.noClientSubtitle")}
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

      <ManagerDetailModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewManager(null);
        }}
        manager={viewManager}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, managerId: null, managerName: "", managerStatus: "active" })
        }
        onConfirm={handleConfirmToggle}
        title={confirmModal.managerStatus === 'active' ? t("confirm.deactivateTitle") : t("confirm.activateTitle")}
        message={
          confirmModal.managerStatus === 'active'
            ? t("confirm.deactivateMessage", { name: confirmModal.managerName })
            : t("confirm.activateMessage", { name: confirmModal.managerName })
        }
        confirmText={confirmModal.managerStatus === 'active' ? t("confirm.deactivateConfirm") : t("confirm.activateConfirm")}
        cancelText={tc("actions.cancel")}
        variant={confirmModal.managerStatus === 'active' ? "danger" : "info"}
        isLoading={isTogglingStatus}
      />

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, managerId: null, managerName: "" })}
        onConfirm={handleConfirmDelete}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage", { name: confirmDeleteModal.managerName })}
        confirmText={t("confirm.deleteConfirm")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isRemoving}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 018 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}
