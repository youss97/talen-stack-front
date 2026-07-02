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
import RoleChangeModal from "@/components/user/RoleChangeModal";
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
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function UsersPage() {
  const { canCreate, canUpdate, canDelete, actions, actionCodes } = useActions("/users");
  const { canAccessPath } = usePermissions();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  // Robust self-detection — l'auth peut exposer id, userId ou sub selon la source du token
  const isSelf = (row: { id?: string | number; email?: string }) => {
    const cu = currentUser as any;
    if (!cu) return false;
    const cuId = cu.id ?? cu.userId ?? cu.sub;
    if (cuId != null && row.id != null && String(row.id) === String(cuId)) return true;
    if (cu.email && row.email && cu.email.toLowerCase() === row.email.toLowerCase()) return true;
    return false;
  };

  // Le rôle admin est attribué par le super admin → non modifiable depuis la gestion des utilisateurs
  const isAdminRole = (row: User) => {
    const code = (row.role?.code || "").toUpperCase();
    return code.includes("ADMIN_") || code === "ADMIN" || code === "SUPER_ADMIN";
  };

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
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [quickTogglingId, setQuickTogglingId] = useState<string | null>(null);
  const [roleModal, setRoleModal] = useState<{ isOpen: boolean; user: User | null }>({
    isOpen: false,
    user: null,
  });
  const [isChangingRole, setIsChangingRole] = useState(false);

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
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [getUserById, { isLoading: isLoadingDetail }] =
    useLazyGetUserByIdQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleQuickToggle = async (user: User) => {
    if (isSelf(user)) return;
    setQuickTogglingId(user.id);
    try {
      await toggleStatus(user.id).unwrap();
      const action = user.status === "active" ? "bloqué" : "activé";
      addToast("success", "Succès", `Compte ${action} avec succès`);
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la modification du statut"));
    } finally {
      setQuickTogglingId(null);
    }
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
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (user: User) => {
    setFormError(null);
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

  const handleChangeRoleClick = (user: User) => {
    if (isAdminRole(user)) {
      addToast("warning", "Action non autorisée", "Le rôle admin est attribué par le super admin et ne peut pas être modifié ici.");
      return;
    }
    setRoleModal({ isOpen: true, user });
  };

  const handleRoleSubmit = async (roleId: string) => {
    if (!roleModal.user) return;
    setIsChangingRole(true);
    try {
      await updateUser({
        id: roleModal.user.id,
        data: { role_id: roleId } as UpdateUserRequest,
      }).unwrap();
      addToast("success", "Succès", "Rôle modifié avec succès");
      setRoleModal({ isOpen: false, user: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la modification du rôle"));
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    if (isSelf(user)) {
      addToast("warning", "Action non autorisée", "Vous ne pouvez pas modifier le statut de votre propre compte.");
      return;
    }
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
      const msg = getErrorMessage(error, defaultMsg);
      setFormError(msg);
      addToast("error", "Erreur", msg);
    }
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Utilisateurs
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
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
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canDeleteRow={(row) => !isSelf(row)}
          customActions={[
            {
              label: "Modifier le rôle",
              icon: <RoleIcon />,
              color: "primary",
              onClick: (row) => handleChangeRoleClick(row),
              hidden: (row) => isAdminRole(row),
            },
            {
              label: "Bloquer",
              icon: <LockIcon />,
              color: "warning",
              onClick: (row) => handleQuickToggle(row),
              hidden: (row) => row.status !== "active" || isSelf(row),
            },
            {
              label: "Activer",
              icon: <UnlockIcon />,
              color: "success",
              onClick: (row) => handleQuickToggle(row),
              hidden: (row) => row.status === "active" || isSelf(row),
            },
          ]}
          emptyMessage="Aucun utilisateur trouvé"
        />

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
      </div>

      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedUser(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        user={selectedUser}
        isLoading={isCreating || isUpdating || isLoadingDetail}
        serverError={formError}
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

      <RoleChangeModal
        isOpen={roleModal.isOpen}
        onClose={() => setRoleModal({ isOpen: false, user: null })}
        user={roleModal.user}
        onSubmit={handleRoleSubmit}
        isLoading={isChangingRole}
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4.16667V15.8333M4.16667 10H15.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
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


