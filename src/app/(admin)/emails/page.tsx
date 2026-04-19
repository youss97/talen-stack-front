"use client";

import React, { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import EmailFormModal from "@/components/email/EmailFormModal";
import EmailDetailModal from "@/components/email/EmailDetailModal";
import { useGetEmailsQuery, useDeleteEmailMutation } from "@/lib/services/emailApi";
import type { Email } from "@/types/email";
import { useModal } from "@/hooks/useModal";
import { useActions } from "@/hooks/useActions";

const EmailsPage = () => {
  const { canCreate, canDelete } = useActions("/emails");
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    email: Email | null;
  }>({ isOpen: false, email: null });
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

  const { data, isLoading, refetch } = useGetEmailsQuery({
    page,
    limit,
    search,
    status: statusFilter,
  });

  const [deleteEmail] = useDeleteEmailMutation();

  const {
    isOpen: isFormOpen,
    openModal: openForm,
    closeModal: closeForm,
  } = useModal();

  const {
    isOpen: isDetailOpen,
    openModal: openDetail,
    closeModal: closeDetail,
  } = useModal();

  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const handleDelete = (email: Email) => {
    setConfirmModal({ isOpen: true, email });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.email) return;

    setIsDeleting(true);
    try {
      await deleteEmail(confirmModal.email.id).unwrap();
      addToast("success", "Succès", "Email supprimé avec succès");
      setConfirmModal({ isOpen: false, email: null });
      refetch();
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression de l'email"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    openDetail();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"; label: string }> = {
      draft: { color: "light", label: "Brouillon" },
      sent: { color: "success", label: "Envoyé" },
      failed: { color: "error", label: "Échoué" },
      scheduled: { color: "warning", label: "Programmé" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const columns: Column<Email>[] = [
    {
      key: "sender",
      header: "Expéditeur",
      render: (_, email) => (
        <div className="text-sm">
          <p className="font-medium">{email.sender.first_name} {email.sender.last_name}</p>
          <p className="text-gray-500 dark:text-gray-400">{email.sender.email}</p>
        </div>
      ),
    },
    {
      key: "recipients",
      header: "Destinataires",
      render: (_, email) => (
        <div className="text-sm">
          <p className="font-medium">{email.total_recipients} destinataire(s)</p>
          <p className="text-gray-500 dark:text-gray-400">
            Envoyés: {email.sent_count} | Échoués: {email.failed_count}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (_, email) => getStatusBadge(email.status),
    },
    {
      key: "sent_at",
      header: "Date d'envoi",
      render: (_, email) => (
        <span className="text-sm">
          {email.sent_at
            ? new Date(email.sent_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Créé le",
      render: (_, email) => (
        <span className="text-sm">
          {new Date(email.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
              Gestion des Emails
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Envoyez des emails en masse aux candidats, clients, utilisateurs et managers
            </p>
          </div>
          {canCreate && (
            <Button onClick={openForm} startIcon={<PlusIcon />}>Nouvel Email</Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher par sujet..."
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
                <option value="draft">Brouillon</option>
                <option value="sent">Envoyé</option>
                <option value="failed">Échoué</option>
                <option value="scheduled">Programmé</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onView={handleViewEmail}
          onDelete={canDelete ? handleDelete : undefined}
          emptyMessage="Aucun email trouvé"
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

      <EmailFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSuccess={() => {
          refetch();
          closeForm();
        }}
      />

      <EmailDetailModal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        email={selectedEmail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, email: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'email"
        message={`Êtes-vous sûr de vouloir supprimer l'email "${confirmModal.email?.subject}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

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

export default EmailsPage;
