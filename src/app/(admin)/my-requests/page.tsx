"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGetManagerRequestsQuery, useCreateManagerRequestMutation } from "@/lib/services/clientManagerApi";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import ManagerRequestFormModal from "@/components/applicationRequest/ManagerRequestFormModal";
import { ToastContainer, type ToastItem } from "@/components/ui/toast/Toast";

export default function MyRequestsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contractTypeFilter, setContractTypeFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (variant: "success" | "error" | "warning" | "info", title: string, message?: string) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const debouncedSearch = useDebounce(search, 500);
  const [createManagerRequest, { isLoading: isCreating }] = useCreateManagerRequestMutation();

  const { data, isLoading, isFetching } = useGetManagerRequestsQuery({
    page,
    limit: 5,
    search: debouncedSearch,
    status: statusFilter || undefined,
    contract_type: contractTypeFilter || undefined,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      in_progress: { label: "En cours", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
      standby: { label: "Standby", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
      filled: { label: "Comblée", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
      abandoned: { label: "Abandonnée", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      urgent: { label: "Urgent", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
      high: { label: "Haute", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
      normal: { label: "Normale", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
      low: { label: "Basse", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300" },
    };

    const config = priorityConfig[priority] || { label: priority, className: "bg-gray-100 text-gray-800" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const handleCreateSubmit = async (formData: any) => {
    try {
      await createManagerRequest(formData).unwrap();
      addToast("success", "Succès", "Offre créée avec succès");
      setIsFormOpen(false);
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || "Erreur lors de la création de l'offre";
      addToast("error", "Erreur", msg);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Offres de Recrutement
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos offres et consultez les candidats proposés
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          + Nouvelle offre
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <InputField
              placeholder="Rechercher par titre, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="">Tous les statuts</option>
              <option value="in_progress">En cours</option>
              <option value="standby">Standby</option>
              <option value="filled">Comblée</option>
              <option value="abandoned">Abandonnée</option>
            </select>
          </div>
          <div>
            <select
              value={contractTypeFilter}
              onChange={(e) => setContractTypeFilter(e.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            >
              <option value="">Tous les contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Freelance">Freelance</option>
              <option value="Stage">Stage</option>
              <option value="Alternance">Alternance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.data.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucune offre trouvée
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {search || statusFilter || contractTypeFilter
              ? "Essayez de modifier vos filtres"
              : "Aucune offre de recrutement pour le moment"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data.map((request) => (
            <div
              key={request.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.title}
                    </h3>
                    {getStatusBadge(request.status)}
                    {request.priority && getPriorityBadge(request.priority)}
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Référence: {request.reference}
                  </p>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{request.contract_type}</span>
                    </div>

                    {request.location && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{request.location}</span>
                      </div>
                    )}

                    {request.min_experience && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {request.min_experience}
                          {request.max_experience && `-${request.max_experience}`} ans
                        </span>
                      </div>
                    )}
                  </div>

                  {request.required_skills && request.required_skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {request.required_skills.slice(0, 5).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {request.required_skills.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          +{request.required_skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col items-end gap-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-brand-600 dark:text-brand-400">
                      {request.candidates_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {request.candidates_count === 1 ? "Candidat" : "Candidats"}
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push(`/my-requests/${request.id}/candidates`)}
                    size="sm"
                    disabled={request.candidates_count === 0}
                  >
                    Voir les candidats
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination && (
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-lg">
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            totalItems={data.pagination.total}
            itemsPerPage={data.pagination.limit}
            onPageChange={setPage}
          />
        </div>
      )}

      <ManagerRequestFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateSubmit}
        isLoading={isCreating}
      />
    </div>
  );
}
