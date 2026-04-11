"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useGetContractTypesQuery, useCreateContractTypeMutation, useUpdateContractTypeMutation, useDeleteContractTypeMutation } from "@/lib/services/contractTypeApi";
import DataTable from "@/components/tables/DataTable";
import type { Column } from "@/components/tables/DataTable";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { Modal } from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Pagination from "@/components/tables/Pagination";

interface ContractType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export default function ContractTypesPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ContractType | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: ContractType | null }>({
    isOpen: false,
    type: null,
  });

  const { data, isLoading, refetch } = useGetContractTypesQuery({ page, limit, search });
  const [createType, { isLoading: isCreating }] = useCreateContractTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateContractTypeMutation();
  const [deleteType, { isLoading: isDeleting }] = useDeleteContractTypeMutation();

  const addToast = useCallback((variant: "success" | "error" | "warning" | "info", title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    is_active: true,
  });

  const handleOpenCreate = () => {
    setSelectedType(null);
    setFormData({ name: "", is_active: true });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (type: ContractType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      is_active: type.is_active,
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedType) {
        await updateType({ id: selectedType.id, data: formData }).unwrap();
        addToast("success", "Succès", "Type de contrat modifié avec succès");
      } else {
        await createType(formData).unwrap();
        addToast("success", "Succès", "Type de contrat créé avec succès");
      }
      setIsFormModalOpen(false);
      refetch();
    } catch (error: any) {
      addToast("error", "Erreur", error?.data?.message || "Une erreur est survenue");
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.type) return;
    try {
      await deleteType(confirmModal.type.id).unwrap();
      addToast("success", "Succès", "Type de contrat supprimé avec succès");
      setConfirmModal({ isOpen: false, type: null });
      refetch();
    } catch (error: any) {
      addToast("error", "Erreur", error?.data?.message || "Erreur lors de la suppression");
    }
  };

  const columns: Column<ContractType>[] = [
    {
      key: "name",
      header: "Nom",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "is_active",
      header: "Statut",
      render: (value) => (
        <Badge variant="solid" color={value ? "success" : "gray"}>
          {value ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/settings"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Paramètres
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-800 dark:text-white/90">Types de Contrats</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Types de Contrats
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez les types de contrats (CDI, CDD, Freelance, etc.)
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
          </div>
          <Button onClick={handleOpenCreate}>
            Créer un type de contrat
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onEdit={handleOpenEdit}
          onDelete={(row) => setConfirmModal({ isOpen: true, type: row })}
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

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            {selectedType ? "Modifier le type de contrat" : "Créer un type de contrat"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom</Label>
              <InputField
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: CDI, CDD, Freelance"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                Actif
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)} type="button">
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={handleDelete}
        title="Supprimer le type de contrat"
        message={`Êtes-vous sûr de vouloir supprimer le type de contrat "${confirmModal.type?.name}" ?`}
        confirmText="Supprimer"
        isLoading={isDeleting}
      />
    </>
  );
}
