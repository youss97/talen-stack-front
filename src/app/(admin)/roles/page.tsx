"use client";
import { useState, useCallback, useEffect } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import RoleFormModal from "@/components/role/RoleFormModal";
import RoleDetailModal from "@/components/role/RoleDetailModal";
import {
  useGetRolesQuery,
  useLazyGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignActionsToRoleMutation,
} from "@/lib/services/roleApi";
import { useVerifyUserQuery } from "@/lib/services/authApi"; // Import pour forcer le refetch des permissions
import { triggerRoleUpdateEvent, triggerRolePermissionsUpdateEvent } from "@/components/auth/PermissionsRefresher";
import { useActions } from "@/hooks/useActions";
import type { Role, RoleWithFeatures } from "@/types/role";
import type { CreateRoleFormData } from "@/validations/roleValidation";

export default function RolesPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/roles");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithFeatures | null>(null);
  const [detailRole, setDetailRole] = useState<RoleWithFeatures | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    role: Role | null;
  }>({ isOpen: false, role: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Hook pour forcer le refetch des permissions utilisateur
  const { refetch: refetchUserPermissions } = useVerifyUserQuery();

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetRolesQuery({
    page,
    limit: 5, // Standardisé à 5 pour toutes les pages
    search: debouncedSearch || undefined,
  });

  const [getRoleById, { isLoading: isLoadingDetail }] = useLazyGetRoleByIdQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [assignActions] = useAssignActionsToRoleMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const columns: Column<Role>[] = [
    {
      key: "name",
      header: "Nom",
      className: "font-medium",
    },
    {
      key: "description",
      header: "Description",
      render: (value) => (
        <span className="truncate max-w-[300px] block">
          {(value as string) || "-"}
        </span>
      ),
    },
    {
      key: "is_protected",
      header: "Statut",
      render: (value, row) => {
        const role = row as Role;
        if (role.is_protected) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              🔒 Protégé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✏️ Modifiable
          </span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Date de création",
      render: (value) => {
        if (!value) return "-";
        const date = new Date(value as string);
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
  ];

  const handleViewClick = async (role: Role) => {
    setIsDetailModalOpen(true);
    setDetailRole(null);
    try {
      const result = await getRoleById(role.id).unwrap();
      setDetailRole(result);
    } catch (error) {
      console.error("Error fetching role details:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (role: Role) => {
    try {
      const result = await getRoleById(role.id).unwrap();
      setSelectedRole(result);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Error fetching role details:", error);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setConfirmModal({ isOpen: true, role });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.role) return;

    setIsDeleting(true);
    try {
      await deleteRole(confirmModal.role.id).unwrap();
      addToast("success", "Succès", "Rôle supprimé avec succès");
      setConfirmModal({ isOpen: false, role: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression du rôle"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateRoleFormData, actionIds: string[]) => {
    console.log('🔧 handleFormSubmit called with:', { data, actionIds: actionIds.length });
    
    try {
      if (selectedRole) {
        console.log('📝 Updating existing role:', selectedRole.id);
        
        // Mise à jour du rôle et des actions en parallèle pour éviter les problèmes de séquence
        const promises = [];
        
        // Toujours mettre à jour le rôle (nom/description)
        promises.push(
          updateRole({
            id: selectedRole.id,
            data: {
              name: data.name,
              description: data.description,
            },
          }).unwrap()
        );

        // Toujours assigner les actions lors de l'édition (même si tableau vide)
        promises.push(
          assignActions({
            id: selectedRole.id,
            data: { actionIds },
          }).unwrap()
        );

        console.log('⏳ Executing update and assign actions in parallel...');
        await Promise.all(promises);
        console.log('✅ Both operations completed successfully');

        // Forcer le refetch des permissions utilisateur pour mettre à jour le sidebar
        console.log('🔄 Refreshing user permissions...');
        await refetchUserPermissions();
        console.log('✅ User permissions refreshed');

        // Déclencher l'événement pour notifier les autres composants
        triggerRolePermissionsUpdateEvent();

        addToast("success", "Succès", "Rôle modifié avec succès");
      } else {
        console.log('📝 Creating new role');
        
        // Création d'un nouveau rôle
        const newRole = await createRole({
          name: data.name,
          description: data.description,
        }).unwrap();

        console.log('✅ Role created:', newRole.id);

        // Assigner les actions seulement si il y en a
        if (actionIds.length > 0) {
          console.log('📝 Assigning actions to new role...');
          await assignActions({
            id: newRole.id,
            data: { actionIds },
          }).unwrap();
          console.log('✅ Actions assigned successfully');
        } else {
          console.log('📝 No actions to assign');
        }

        addToast("success", "Succès", "Rôle créé avec succès");
      }
      setIsFormModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      console.error('❌ Error in handleFormSubmit:', error);
      
      const defaultMsg = selectedRole
        ? "Erreur lors de la modification du rôle"
        : "Erreur lors de la création du rôle";

      // Afficher une erreur plus détaillée
      let errorMessage = defaultMsg;
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = error.data as any;
        if (errorData?.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        }
      }

      addToast("error", "Erreur", errorMessage);
      addToast("error", "Erreur", getErrorMessage(error, defaultMsg));
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Rôles et permissions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les rôles et leurs permissions
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              Ajouter un rôle
            </Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <input
            type="text"
            placeholder="Rechercher un rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
          />
        </div>

        <DataTable
          columns={columns}
          data={data?.data && Array.isArray(data.data) ? data.data : []}
          isLoading={isLoading || isFetching}
          onView={handleViewClick}
          onEdit={canUpdate ? (role: Role) => {
            // Ne pas permettre l'édition des rôles protégés
            if (role.is_protected) {
              addToast("warning", "Attention", "Ce rôle est protégé et ne peut pas être modifié");
              return;
            }
            handleEditClick(role);
          } : undefined}
          onDelete={canDelete ? (role: Role) => {
            // Ne pas permettre la suppression des rôles protégés
            if (role.is_protected) {
              addToast("warning", "Attention", "Ce rôle est protégé et ne peut pas être supprimé");
              return;
            }
            handleDeleteClick(role);
          } : undefined}
          emptyMessage="Aucun rôle trouvé"
        />

        {data && data.pagination && data.pagination.total >= 0 && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              totalItems={data.pagination.total}
              itemsPerPage={data.pagination.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <RoleFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleFormSubmit}
        role={selectedRole}
        isLoading={isCreating || isUpdating}
      />

      <RoleDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailRole(null);
        }}
        role={detailRole}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, role: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer le rôle"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${confirmModal.role?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4.16667V15.8333M4.16667 10H15.8333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


