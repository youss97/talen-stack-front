"use client";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  useDeleteClientMutation,
} from "@/lib/services/clientApi";
import { useActions } from "@/hooks/useActions";
import type { Client, CreateClientRequest, UpdateClientRequest } from "@/types/client";
import type { CreateClientFormData } from "@/validations/clientValidation";
import { getImageUrl } from "@/utils/imageHelper";
import { getApiErrorMessage } from "@/utils/errorMessages";

export default function ClientsPage() {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const { canCreate, canUpdate, canDelete } = useActions("/clients");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({ isOpen: false, client: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    client: Client | null;
  }>({ isOpen: false, client: null });
  const [isRemoving, setIsRemoving] = useState(false);

  const [limit, setLimit] = useState(5);

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
  const [deleteClient] = useDeleteClientMutation();

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
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (client: Client) => {
    setFormError(null);
    setIsFormModalOpen(true);
    setEditingClient(null);
    
    try {
      const fullData = await getClientById(client.id).unwrap();
      setEditingClient(fullData);
    } catch (error) {
      console.error("Error loading client data:", error);
      addToast("error", tc("status.error"), t("toasts.loadClientError"));
      setIsFormModalOpen(false);
    }
  };

  const handleViewClick = (client: Client) => {
    setSelectedClientId(client.id);
    setIsViewModalOpen(true);
  };

  const handleToggleClick = (client: Client) => {
    setConfirmModal({ isOpen: true, client });
  };

  const getErrorMessage = (error: unknown, defaultMessage: string): string =>
    getApiErrorMessage(error, defaultMessage);

  const handleConfirmToggle = async () => {
    if (!confirmModal.client) return;

    setIsDeleting(true);
    try {
      await toggleStatus(confirmModal.client.id).unwrap();
      const action = confirmModal.client.status === 'active' ? t("toasts.toggleDeactivated") : t("toasts.toggleActivated");
      addToast("success", tc("status.success"), action);
      setConfirmModal({ isOpen: false, client: null });
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.toggleError")));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setConfirmDeleteModal({ isOpen: true, client });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteModal.client) return;

    setIsRemoving(true);
    try {
      await deleteClient(confirmDeleteModal.client.id).unwrap();
      addToast("success", tc("status.success"), t("toasts.deleteSuccess"));
      setConfirmDeleteModal({ isOpen: false, client: null });
    } catch (error) {
      addToast("error", tc("status.error"), getErrorMessage(error, t("toasts.deleteError")));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleFormSubmit = async (formData: CreateClientFormData) => {
    try {
      if (editingClient) {
        const updateData: UpdateClientRequest = {
          name: formData.name,
          ice: formData.ice,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          status: formData.status,
        };
        await updateClient({ id: editingClient.id, data: updateData }).unwrap();
        addToast("success", tc("status.success"), t("toasts.updateSuccess"));
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        if (formData.ice) formDataToSend.append("ice", formData.ice);
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
        if (formData.adminPhone) formDataToSend.append("adminPhone", formData.adminPhone);
        if (formData.adminPosition) formDataToSend.append("adminPosition", formData.adminPosition);

        const logo = (formData as any).logo;
        const adminPhoto = (formData as any).adminPhoto;
        if (logo instanceof File) {
          formDataToSend.append("logo", logo);
        } else if (typeof logo === "string" && logo.startsWith("http")) {
          formDataToSend.append("logo_url", logo);
        }
        if (adminPhoto instanceof File) {
          formDataToSend.append("adminPhoto", adminPhoto);
        } else if (typeof adminPhoto === "string" && adminPhoto.startsWith("http")) {
          formDataToSend.append("adminPhoto_url", adminPhoto);
        }

        await createClient(formDataToSend as unknown as CreateClientRequest).unwrap();
        addToast("success", tc("status.success"), t("toasts.createSuccess"));
      }
      setIsFormModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      const defaultMsg = editingClient
        ? t("toasts.updateError")
        : t("toasts.createError");
      { const _m = getErrorMessage(error, defaultMsg); setFormError(_m); addToast("error", tc("status.error"), _m); }
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: t("list.columns.name"),
      className: "font-medium",
      render: (value, row) => {
        const logoSrc = getImageUrl(row.company_logo_path as string | undefined);
        return (
          <div className="flex items-center gap-2.5">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={value as string}
                className="h-8 w-8 rounded-md object-contain border border-gray-100 bg-white shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-md bg-brand-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand-600">
                  {(value as string)?.[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
            )}
            <span className="font-medium text-gray-800 dark:text-white">{value as string}</span>
          </div>
        );
      },
    },
    {
      key: "company_email",
      header: t("list.columns.email"),
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_phone",
      header: t("list.columns.phone"),
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_city",
      header: t("list.columns.city"),
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "company_country",
      header: t("list.columns.country"),
      render: (value) => (
        <span>{(value as string) || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t("list.columns.status"),
      render: (value) => {
        const statusMap: Record<string, { label: string; color: "success" | "error" | "warning" }> = {
          active: { label: t("list.status.active"), color: "success" },
          inactive: { label: t("list.status.inactive"), color: "error" },
          deleted: { label: t("list.status.deleted"), color: "error" },
        };
        const { label, color } = statusMap[value as string] ?? { label: String(value), color: "error" };
        return <Badge color={color} variant="light" size="sm">{label}</Badge>;
      },
    },
  ];

  const clients = data?.data || [];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("list.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("list.subtitle")}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>{t("list.addButton")}</Button>
          )}
        </div>

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder={t("list.searchPlaceholder")}
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
                <option value="">{t("list.filters.allStatuses")}</option>
                <option value="active">{t("list.status.active")}</option>
                <option value="inactive">{t("list.status.inactive")}</option>
                <option value="deleted">{t("list.status.deleted")}</option>
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
          canDeleteRow={(row) => row.status !== "deleted"}
          customActions={canUpdate ? [
            {
              label: t("list.rowActions.deactivate"),
              icon: <LockIcon />,
              color: "warning",
              onClick: (row) => handleToggleClick(row),
              hidden: (row) => row.status !== "active",
            },
            {
              label: t("list.rowActions.activate"),
              icon: <UnlockIcon />,
              color: "success",
              onClick: (row) => handleToggleClick(row),
              hidden: (row) => row.status === "active" || row.status === "deleted",
            },
          ] : undefined}
          emptyMessage={t("list.emptyState")}
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

      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingClient(null);
          setFormError(null);
        }}
        onSubmit={handleFormSubmit}
        client={editingClient}
        isLoading={isCreating || isUpdating || isLoadingClient}
        serverError={formError}
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
        onConfirm={handleConfirmToggle}
        title={confirmModal.client?.status === 'active' ? t("confirm.deactivateTitle") : t("confirm.activateTitle")}
        message={
          confirmModal.client?.status === 'active'
            ? t("confirm.deactivateMessage", { name: confirmModal.client?.name || "" })
            : t("confirm.activateMessage", { name: confirmModal.client?.name || "" })
        }
        confirmText={confirmModal.client?.status === 'active' ? t("confirm.deactivateConfirm") : t("confirm.activateConfirm")}
        cancelText={tc("actions.cancel")}
        variant={confirmModal.client?.status === 'active' ? "danger" : "info"}
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={confirmDeleteModal.isOpen}
        onClose={() => setConfirmDeleteModal({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage", { name: confirmDeleteModal.client?.name || "" })}
        confirmText={t("confirm.deleteConfirm")}
        cancelText={tc("actions.cancel")}
        variant="danger"
        isLoading={isRemoving}
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