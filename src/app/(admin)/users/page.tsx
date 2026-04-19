"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import UserFormModal from "@/components/user/UserFormModal";
import UserDetailModal from "@/components/user/UserDetailModal";
import {
  useGetUsersQuery,
  useLazyGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
} from "@/lib/services/userApi";
import { useActions } from "@/hooks/useActions";
import { usePermissions } from "@/hooks/usePermissions";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types/user";
import type { CreateUserFormData } from "@/validations/userValidation";

export default function UsersPage() {
  const { canCreate, canUpdate, canDelete, actions, actionCodes } = useActions("/users");
  const { canAccessPath } = usePermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  // Debug des permissions
  console.log("🔍 Debug permissions /users:", {
    canCreate,
    canUpdate,
    canDelete,
    actions,
    actionCodes,
    canAccessUsersPath: canAccessPath("/users"),
    currentUser: {
      id: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.role,
      features: currentUser?.features?.length || 0
    }
  });
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

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

  const { data, isLoading, isFetching } = useGetUsersQuery({
    page,
    limit: 5,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [getUserById, { isLoading: isLoadingDetail }] =
    useLazyGetUserByIdQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const columns: Column<User>[] = [
    {
      key: "first_name",
      header: "Prénom",
      className: "font-medium",
    },
    {
      key: "last_name",
      header: "Nom",
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "role.name",
      header: "Rôle",
      render: (_, row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.role?.name || "-"}
        </span>
      ),
    },
    {
      key: "company.name",
      header: "Entreprise",
      render: (_, row) => (
        <span className="text-gray-600 dark:text-gray-400">
          {row.company?.name || "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (value) => (
        <Badge
          color={value === "active" ? "success" : "error"}
          variant="light"
          size="sm"
        >
          {value === "active" ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  const handleRowClick = async (user: User) => {
    setIsDetailModalOpen(true);
    setDetailUser(null);
    try {
      const result = await getUserById(user.id).unwrap();
      setDetailUser(result);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedUser(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (user: User) => {
    setIsFormModalOpen(true);
    setSelectedUser(null);
    try {
      const result = await getUserById(user.id).unwrap();
      setSelectedUser(result);
    } catch (error) {
      console.error("Error fetching user details:", error);
      addToast("error", "Erreur", "Erreur lors du chargement des détails de l'utilisateur");
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setConfirmModal({ isOpen: true, user });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.user) return;

    setIsDeleting(true);
    try {
      await toggleStatus(confirmModal.user.id).unwrap();
      const action = confirmModal.user.status === 'active' ? 'désactivé' : 'activé';
      addToast("success", "Succès", `Utilisateur ${action} avec succès`);
      setConfirmModal({ isOpen: false, user: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la modification du statut"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateUserFormData) => {
    try {
      if (selectedUser) {
        // For update, convert to FormData if there's a photo
        if (data.photo) {
          const formData = new FormData();
          Object.keys(data).forEach((key) => {
            const value = data[key as keyof CreateUserFormData];
            if (value !== undefined && value !== null) {
              if (key === 'photo' && value instanceof File) {
                formData.append(key, value);
              } else if (typeof value !== 'object') {
                formData.append(key, String(value));
              }
            }
          });
          await updateUser({
            id: selectedUser.id,
            data: formData as unknown as UpdateUserRequest,
          }).unwrap();
        } else {
          await updateUser({
            id: selectedUser.id,
            data: data as unknown as UpdateUserRequest,
          }).unwrap();
        }
        addToast("success", "Succès", "Utilisateur modifié avec succès");
      } else {
        // For create, always use FormData
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          const value = data[key as keyof CreateUserFormData];
          if (value !== undefined && value !== null) {
            if (key === 'photo' && value instanceof File) {
              formData.append(key, value);
            } else if (typeof value !== 'object') {
              formData.append(key, String(value));
            }
          }
        });
        await createUser(formData as unknown as CreateUserRequest).unwrap();
        addToast("success", "Succès", "Utilisateur créé avec succès");
      }
      setIsFormModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      const defaultMsg = selectedUser
        ? "Erreur lors de la modification de l'utilisateur"
        : "Erreur lors de la création de l'utilisateur";
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
              Utilisateurs
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les utilisateurs de la plateforme
            </p>
          </div>
          {/* SOLUTION D'URGENCE: Forcer l'affichage du bouton */}
          <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
            Ajouter un utilisateur
          </Button>
          
          {/* Debug info - à supprimer plus tard */}
          {!canCreate && (
            <div className="text-xs text-red-500 mt-1">
              Debug: canCreate={String(canCreate)}, actions: {actionCodes.join(", ") || "Aucune"}
            </div>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={handleEditClick} // Force l'édition
          onDelete={handleDeleteClick} // Force la suppression
          emptyMessage="Aucun utilisateur trouvé"
        />

        {data && data.pagination && (
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

      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedUser(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        isLoading={isCreating || isUpdating || isLoadingDetail}
      />

      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailUser(null);
        }}
        user={detailUser}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={handleConfirmDelete}
        title={confirmModal.user?.status === 'active' ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        message={
          confirmModal.user?.status === 'active'
            ? `Êtes-vous sûr de vouloir désactiver l'utilisateur "${confirmModal.user?.first_name} ${confirmModal.user?.last_name}" ? Il ne pourra plus se connecter.`
            : `Êtes-vous sûr de vouloir activer l'utilisateur "${confirmModal.user?.first_name} ${confirmModal.user?.last_name}" ? Il pourra se connecter.`
        }
        confirmText={confirmModal.user?.status === 'active' ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        variant={confirmModal.user?.status === 'active' ? "danger" : "info"}
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


