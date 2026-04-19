"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import ContractTypeFormModal from "@/components/contractType/ContractTypeFormModal";
import ContractTypeDetailModal from "@/components/contractType/ContractTypeDetailModal";
import {
  useGetContractTypesQuery,
  useLazyGetContractTypeByIdQuery,
  useCreateContractTypeMutation,
  useUpdateContractTypeMutation,
  useDeleteContractTypeMutation,
} from "@/lib/services/contractTypeApi";
import { useActions } from "@/hooks/useActions";
import type { ContractType } from "@/types/contractType";
import type { ContractTypeFormData } from "@/validations/contractTypeValidation";

export default function ContractTypesPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/contract-types");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState<ContractType | null>(null);
  const [detailContractType, setDetailContractType] = useState<ContractType | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    contractType: ContractType | null;
  }>({ isOpen: false, contractType: null });
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

  const { data, isLoading, isFetching } = useGetContractTypesQuery({
    page,
    limit: 5,
    search: search || undefined,
  });

  const [getContractTypeById, { isLoading: isLoadingDetail }] =
    useLazyGetContractTypeByIdQuery();
  const [createContractType, { isLoading: isCreating }] = useCreateContractTypeMutation();
  const [updateContractType, { isLoading: isUpdating }] = useUpdateContractTypeMutation();
  const [deleteContractType] = useDeleteContractTypeMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const columns: Column<ContractType>[] = [
    {
      key: "name",
      header: "Nom",
      className: "font-medium",
    },
    {
      key: "description",
      header: "Description",
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
  ];

  const handleRowClick = async (contractType: ContractType) => {
    setIsDetailModalOpen(true);
    setDetailContractType(null);
    try {
      const result = await getContractTypeById(contractType.id).unwrap();
      setDetailContractType(result);
    } catch (error) {
      console.error("Error fetching contract type details:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedContractType(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (contractType: ContractType) => {
    setIsFormModalOpen(true);
    setSelectedContractType(null);
    try {
      const result = await getContractTypeById(contractType.id).unwrap();
      setSelectedContractType(result);
    } catch (error) {
      console.error("Error fetching contract type details:", error);
      addToast("error", "Erreur", "Erreur lors du chargement des détails du type de contrat");
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteClick = (contractType: ContractType) => {
    setConfirmModal({ isOpen: true, contractType });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.contractType) return;

    setIsDeleting(true);
    try {
      await deleteContractType(confirmModal.contractType.id).unwrap();
      addToast("success", "Succès", "Type de contrat supprimé avec succès");
      setConfirmModal({ isOpen: false, contractType: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression du type de contrat"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: ContractTypeFormData) => {
    try {
      if (selectedContractType) {
        await updateContractType({
          id: selectedContractType.id,
          data,
        }).unwrap();
        addToast("success", "Succès", "Type de contrat modifié avec succès");
      } else {
        await createContractType(data).unwrap();
        addToast("success", "Succès", "Type de contrat créé avec succès");
      }
      setIsFormModalOpen(false);
      setSelectedContractType(null);
    } catch (error) {
      const defaultMsg = selectedContractType
        ? "Erreur lors de la modification du type de contrat"
        : "Erreur lors de la création du type de contrat";
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
              Types de contrat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les types de contrat de la plateforme
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              Ajouter un type de contrat
            </Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <input
              type="text"
              placeholder="Rechercher un type de contrat..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading || isFetching}
          onView={handleRowClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          emptyMessage="Aucun type de contrat trouvé"
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

      <ContractTypeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedContractType(null);
        }}
        onSubmit={handleFormSubmit}
        contractType={selectedContractType}
        isLoading={isCreating || isUpdating || isLoadingDetail}
      />

      <ContractTypeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailContractType(null);
        }}
        contractType={detailContractType}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, contractType: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer le type de contrat"
        message={`Êtes-vous sûr de vouloir supprimer le type de contrat "${confirmModal.contractType?.name}" ? Cette action est irréversible.`}
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
