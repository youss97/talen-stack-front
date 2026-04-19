"use client";
import { useState, useCallback } from "react";
import DataTable, { type Column } from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import CompanyFormModal from "@/components/company/CompanyFormModal";
import CompanyDetailModal from "@/components/company/CompanyDetailModal";
import {
  useGetCompaniesQuery,
  useLazyGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from "@/lib/services/companyApi";
import { useActions } from "@/hooks/useActions";
import type { Company } from "@/types/company";
import type { CreateCompanyFormData } from "@/validations/companyValidation";

export default function CompaniesPage() {
  const { canCreate, canUpdate, canDelete } = useActions("/companies");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    company: Company | null;
  }>({ isOpen: false, company: null });
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

  const { data, isLoading, isFetching } = useGetCompaniesQuery({
    page,
    limit: 5,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [getCompanyById, { isLoading: isLoadingDetail }] =
    useLazyGetCompanyByIdQuery();
  const [createCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();

  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error && typeof error === "object") {
      const err = error as { data?: { message?: string }; message?: string };
      return err.data?.message || err.message || defaultMessage;
    }
    return defaultMessage;
  };

  const columns: Column<Company>[] = [
    {
      key: "name",
      header: "Nom",
      className: "font-medium",
    },
    {
      key: "siret",
      header: "SIRET",
    },
    {
      key: "city",
      header: "Ville",
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "phone",
      header: "Téléphone",
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

  const handleViewClick = async (company: Company) => {
    setIsViewModalOpen(true);
    setViewCompany(null);
    try {
      const result = await getCompanyById(company.id).unwrap();
      setViewCompany(result);
    } catch (error) {
      console.error("Error fetching company details:", error);
    }
  };

  const handleAddClick = () => {
    setSelectedCompany(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = async (company: Company) => {
    setIsFormModalOpen(true);
    setSelectedCompany(null);
    try {
      const result = await getCompanyById(company.id).unwrap();
      setSelectedCompany(result);
    } catch (error) {
      console.error("Error fetching company details:", error);
      addToast("error", "Erreur", "Erreur lors du chargement des détails de l'entreprise");
      setIsFormModalOpen(false);
    }
  };

  const handleDeleteClick = (company: Company) => {
    setConfirmModal({ isOpen: true, company });
  };

  const handleConfirmDelete = async () => {
    if (!confirmModal.company) return;

    setIsDeleting(true);
    try {
      await deleteCompany(confirmModal.company.id).unwrap();
      addToast("success", "Succès", "Entreprise supprimée avec succès");
      setConfirmModal({ isOpen: false, company: null });
    } catch (error) {
      addToast("error", "Erreur", getErrorMessage(error, "Erreur lors de la suppression de l'entreprise"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (data: CreateCompanyFormData) => {
    try {
      if (selectedCompany) {
        // For update, exclude admin fields and only send company data
        const { adminEmail, adminPassword, adminFirstName, adminLastName, adminPhoto, ...companyData } = data;
        
        // Always use FormData for updates to handle file uploads properly
        const formData = new FormData();
        Object.keys(companyData).forEach((key) => {
          const value = companyData[key as keyof typeof companyData];
          if (value !== undefined && value !== null) {
            if (key === 'logo' && value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === 'string' && key === 'logo' && value.startsWith('http')) {
              // Si c'est une URL Cloudinary, l'envoyer comme string
              formData.append('logo_url', value);
            } else if (typeof value !== 'object') {
              formData.append(key, String(value));
            }
          }
        });
        
        await updateCompany({
          id: selectedCompany.id,
          data: formData,
        }).unwrap();
        
        addToast("success", "Succès", "Entreprise modifiée avec succès");
      } else {
        // For create, always use FormData with all fields including admin
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          const value = data[key as keyof CreateCompanyFormData];
          if (value !== undefined && value !== null) {
            if ((key === 'logo' || key === 'adminPhoto') && value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === 'string' && (key === 'logo' || key === 'adminPhoto') && value.startsWith('http')) {
              // Si c'est une URL Cloudinary, l'envoyer avec un suffixe _url
              formData.append(`${key}_url`, value);
            } else if (typeof value !== 'object') {
              formData.append(key, String(value));
            }
          }
        });
        await createCompany(formData).unwrap();
        addToast("success", "Succès", "Entreprise créée avec succès");
      }
      setIsFormModalOpen(false);
      setSelectedCompany(null);
    } catch (error) {
      const defaultMsg = selectedCompany
        ? "Erreur lors de la modification de l'entreprise"
        : "Erreur lors de la création de l'entreprise";
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
              Entreprises
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les entreprises de la plateforme
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleAddClick} startIcon={<PlusIcon />}>
              Ajouter une entreprise
            </Button>
          )}
        </div>

        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher une entreprise..."
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
          onView={handleViewClick}
          onEdit={canUpdate ? handleEditClick : undefined}
          onDelete={canDelete ? handleDeleteClick : undefined}
          emptyMessage="Aucune entreprise trouvée"
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

      <CompanyFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedCompany(null);
        }}
        onSubmit={handleFormSubmit}
        company={selectedCompany}
        isLoading={isCreating || isUpdating || isLoadingDetail}
      />

      <CompanyDetailModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewCompany(null);
        }}
        company={viewCompany}
        isLoading={isLoadingDetail}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, company: null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'entreprise"
        message={`Êtes-vous sûr de vouloir supprimer l'entreprise "${confirmModal.company?.name}" ? Cette action est irréversible.`}
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


