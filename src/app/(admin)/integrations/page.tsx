'use client';

import { useState, useCallback } from 'react';
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Pagination from "@/components/tables/Pagination";
import { useGetIntegrationsQuery, useGetStatisticsQuery } from '@/lib/services/integrationApi';
import { IntegrationStatus, TrialPeriodStatus, Integration } from '@/types/integration';
import CreateIntegrationModal from '@/components/integrations/CreateIntegrationModal';
import IntegrationDetailModal from '@/components/integrations/IntegrationDetailModal';
import EditIntegrationModal from '@/components/integrations/EditIntegrationModal';

export default function IntegrationsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | ''>('');
  const [trialFilter, setTrialFilter] = useState<TrialPeriodStatus | ''>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  const { data, isLoading, isFetching } = useGetIntegrationsQuery({
    page,
    limit,
    status: statusFilter || undefined,
    trialPeriodStatus: trialFilter || undefined,
  });

  const { data: stats } = useGetStatisticsQuery();

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    addToast('success', 'Succès', 'Intégration créée avec succès');
  };

  const handleDetailSuccess = () => {
    addToast('success', 'Succès', 'Action effectuée avec succès');
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    const styles = {
      in_progress: 'info',
      completed: 'success',
      failed: 'error',
    };

    const labels = {
      in_progress: 'En cours',
      completed: 'Terminée',
      failed: 'Échec',
    };

    return (
      <Badge
        variant="light"
        color={styles[status] as "success" | "error" | "warning" | "info"}
        size="sm"
      >
        {labels[status]}
      </Badge>
    );
  };

  const getTrialStatusBadge = (status: TrialPeriodStatus) => {
    const styles = {
      in_progress: 'warning',
      validated: 'success',
      not_validated: 'error',
    };

    const labels = {
      in_progress: 'En cours',
      validated: 'Validée',
      not_validated: 'Non validée',
    };

    return (
      <Badge
        variant="light"
        color={styles[status] as "success" | "error" | "warning" | "info"}
        size="sm"
      >
        {labels[status]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const columns = [
    {
      key: "id" as keyof Integration,
      header: "Candidat",
      render: (_value: unknown, row?: Integration) => {
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row?.application?.cv?.candidate_first_name || row?.application?.cv?.first_name} {row?.application?.cv?.candidate_last_name || row?.application?.cv?.last_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row?.application?.cv?.candidate_email || row?.application?.cv?.email}
            </div>
          </div>
        );
      },
    },
    {
      key: "client" as keyof Integration,
      header: "Client",
      render: (_value: unknown, row?: Integration) => {
        return row?.client?.name || "-";
      },
    },
    {
      key: "position" as keyof Integration,
      header: "Poste",
    },
    {
      key: "integration_date" as keyof Integration,
      header: "Date",
      render: (value: unknown) => formatDate(value as string),
    },
    {
      key: "salary" as keyof Integration,
      header: "Salaire/TJM",
      render: (_value: unknown, row?: Integration) => {
        if (row?.salary) {
          return formatCurrency(row.salary, row.currency);
        }
        if (row?.daily_rate) {
          return `${formatCurrency(row.daily_rate, row.currency)}/j`;
        }
        return '-';
      },
    },
    {
      key: "trial_period_status" as keyof Integration,
      header: "Période d'essai",
      render: (value: unknown) => getTrialStatusBadge(value as TrialPeriodStatus),
    },
    {
      key: "status" as keyof Integration,
      header: "Statut",
      render: (value: unknown) => getStatusBadge(value as IntegrationStatus),
    },
  ];

  const integrations = data?.data || [];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/95">
              Gestion des Intégrations
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Suivez les intégrations des candidats embauchés et leur période d'essai
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} startIcon={<PlusIcon />}>
            Nouvelle intégration
          </Button>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total intégrations</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </div>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span className="text-xl">📊</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">En cours</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.by_status.in_progress}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xl">⏳</span>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400">Terminées</div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.by_status.completed}
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <span className="text-xl">✅</span>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Taux de réussite PE</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.trial_period.success_rate}%
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-xl">🎯</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as IntegrationStatus | '');
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              >
                <option value="">Tous les statuts</option>
                <option value="in_progress">🔄 En cours</option>
                <option value="completed">✅ Terminée</option>
                <option value="failed">❌ Échec</option>
              </select>
            </div>
            <div>
              <select
                value={trialFilter}
                onChange={(e) => {
                  setTrialFilter(e.target.value as TrialPeriodStatus | '');
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              >
                <option value="">Toutes les périodes</option>
                <option value="in_progress">⏳ En cours</option>
                <option value="validated">✅ Validée</option>
                <option value="not_validated">❌ Non validée</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTrialFilter('');
                  setPage(1);
                }}
                className="h-11 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                🔄 Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <DataTable<Integration>
          columns={columns}
          data={integrations}
          isLoading={isLoading || isFetching}
          onView={(integration) => {
            setSelectedIntegrationId(integration.id);
            setIsDetailModalOpen(true);
          }}
          onEdit={(integration) => {
            setSelectedIntegrationId(integration.id);
            setIsEditModalOpen(true);
          }}
          emptyMessage="Aucune intégration trouvée"
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

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateIntegrationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {selectedIntegrationId && isDetailModalOpen && (
        <IntegrationDetailModal
          integrationId={selectedIntegrationId}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedIntegrationId(null);
          }}
          onSuccess={handleDetailSuccess}
        />
      )}

      {selectedIntegrationId && isEditModalOpen && (
        <EditIntegrationModal
          integrationId={selectedIntegrationId}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIntegrationId(null);
          }}
          onSuccess={() => {
            addToast('success', 'Succès', 'Intégration modifiée avec succès');
          }}
        />
      )}
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