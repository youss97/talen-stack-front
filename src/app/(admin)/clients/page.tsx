"use client";
import { useState, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import ClientFormModal from "@/components/client/ClientFormModal";
import ClientDetailModal from "@/components/client/ClientDetailModal";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useLazyGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useToggleClientStatusMutation,
} from "@/lib/services/clientApi";
import { useActions } from "@/hooks/useActions";
import type { Client, CreateClientRequest, UpdateClientRequest } from "@/types/client";
import type { CreateClientFormData } from "@/validations/clientValidation";

export default function ClientsPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/clients");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({ isOpen: false, client: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 5;

  const { data, isLoading, isFetching } = useGetClientsQuery({
    page,
    limit,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const { data: selectedClient, isLoading: isLoadingDetail } =
    useGetClientByIdQuery(selectedClientId!, {
      skip: !selectedClientId,
    });

  const [getClientById, { isLoading: isLoadingClient }] = useLazyGetClientByIdQuery();
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const [toggleStatus] = useToggleClientStatusMutation();

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

  const handleAddClick = () => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (client: Client) => {
    setIsFormModalOpen(true);
    setEditingClient(null);
    
    try {
      const fullData = await getClientById(client.id).unwrap();
      setEditingClient(fullData);
    } catch (error) {
      console.error("Error loading client data:", error);
      addToast("error", "Erreur", "Impossible de charger les données du client");
      setIsFormModalOpen(false);
    }
  };

  const handleViewClick = (client: Client) => {
    setSelectedClientId(client.id);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setConfirmModal({ isOpen: true, client });
  };

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.client) return;

    setIsDeleting(true);
    try {
      await toggleStatus(confirmModal.client.id).unwrap();
      const action = confirmModal.client.status === 'active' ? 'désactivé' : 'activé';
      addToast("success", "Succès", `Client ${action} avec succès`);
      setConfirmModal({ isOpen: false, client: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la modification du statut"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData: CreateClientFormData) => {
    try {
      if (editingClient) {
        const updateData: UpdateClientRequest = {
          name: formData.name,
          siret: formData.siret,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
        };
        await updateClient({
          id: editingClient.id,
          data: updateData,
        }).unwrap();
        addToast("success", "Succès", "Client modifié avec succès");
      } else {
        // Create FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("siret", formData.siret);
        formDataToSend.append("address", formData.address);
        formDataToSend.append("city", formData.city);
        formDataToSend.append("postal_code", formData.postal_code || "");
        formDataToSend.append("country", formData.country);
        formDataToSend.append("phone", formData.phone);
        formDataToSend.append("email", formData.email);
        formDataToSend.append("status", formData.status);
        formDataToSend.append("adminEmail", formData.adminEmail);
        formDataToSend.append("adminPassword", formData.adminPassword);
        formDataToSend.append("adminFirstName", formData.adminFirstName);
        formDataToSend.append("adminLastName", formData.adminLastName);
        
        if (formData.adminPhone) {
          formDataToSend.append("adminPhone", formData.adminPhone);
        }
        if (formData.adminPosition) {
          formDataToSend.append("adminPosition", formData.adminPosition);
        }
        
        if (formData.logo) {
          formDataToSend.append("logo", formData.logo);
        }
        if (formData.adminPhoto) {
          formDataToSend.append("adminPhoto", formData.adminPhoto);
        }
        
        await createClient(formDataToSend as unknown as CreateClientRequest).unwrap();
        addToast("success", "Succès", "Client créé avec succès");
      }
      setIsFormModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      const defaultMsg = editingClient
        ? "Erreur lors de la modification du client"
        : "Erreur lors de la création du client";
      addToast("error", "Erreur", getErrorMessage(error, defaultMsg));
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: "Nom",
      className: "font-medium",
    },
    {
      key: "company_email",
      header: "Email",
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_phone",
      header: "Téléphone",
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_city",
      header: "Ville",
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_country",
      header: "Pays",
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (value) => (
        <Badge
          variant="light"
          color={value === "active" ? "success" : "error"}
        >
          {value === "active" ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  const clients = data?.data || [];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/95">
              Liste des clients
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez vos clients et leurs administrateurs
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>Ajouter un client</Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par nom, industrie, contact ou email..."
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

        <DataTable<Client>
          columns={columns}
          data={clients}
          isLoading={isLoading || isFetching}
          onView={handleViewClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          emptyMessage="Aucun client trouvé"
        />

        {data && data.meta && (
          <div className="p-5 border-t border-gray-100 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              totalItems={data.meta.total}
              itemsPerPage={data.meta.limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingClient(null);
        }}
        onSubmit={handleFormSubmit}
        client={editingClient}
        isLoading={isCreating || isUpdating || isLoadingClient}
      />

      <ClientDetailModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedClientId(null);
        }}
        client={selectedClient || null}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        title={confirmModal.client?.status === 'active' ? "Désactiver le client" : "Activer le client"}
        message={
          confirmModal.client?.status === 'active'
            ? `Êtes-vous sûr de vouloir désactiver le client "${confirmModal.client?.name}" ? Tous ses managers seront également désactivés et ne pourront plus se connecter.`
            : `Êtes-vous sûr de vouloir activer le client "${confirmModal.client?.name}" ? Il pourra se connecter.`
        }
        confirmText={confirmModal.client?.status === 'active' ? "Désactiver" : "Activer"}
        cancelText="Annuler"
        variant={confirmModal.client?.status === 'active' ? "danger" : "info"}
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