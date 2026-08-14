'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
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
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Plus, BarChart3, Hourglass, CheckCircle2, Target, RotateCcw, XCircle, ListFilter, CircleCheck, CircleX, ChevronDown } from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown/Dropdown';

interface FilterOption<T extends string> {
  value: T | '';
  label: string;
  icon: ReactNode;
}

/** Select "maison" (bouton + Dropdown) — un <select> natif ne peut pas afficher d'icône
 * dans ses <option>, seulement du texte brut. Remplace le <select> pour permettre une
 * icône lucide-react par option, y compris dans la liste ouverte. */
function FilterSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | '';
  onChange: (value: T | '') => void;
  options: FilterOption<T>[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="dropdown-toggle h-11 w-full flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
      >
        <span className="text-gray-400">{selected.icon}</span>
        <span className="flex-1 text-left truncate">{selected.label}</span>
        <ChevronDown size={16} strokeWidth={1.8} className={`icon-glow text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="w-full py-1">
        {options.map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
              option.value === value
                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-gray-400">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </Dropdown>
    </div>
  );
}

export default function IntegrationsPage() {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');
  const currentUser = useSelector((state: RootState) => state.auth.user);
  // Le manager d'une société liée (client) consulte ses intégrations en lecture seule
  const isClientUser = !!currentUser?.company?.parent_company_id;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
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
    addToast('success', tc('status.success'), t('page.toasts.createSuccess'));
  };

  const handleDetailSuccess = () => {
    addToast('success', tc('status.success'), t('page.toasts.actionSuccess'));
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    const styles = {
      in_progress: 'info',
      completed: 'success',
      failed: 'error',
    };

    const labels = {
      in_progress: t('statuses.in_progress'),
      completed: t('statuses.completed'),
      failed: t('statuses.failed'),
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
      in_progress: t('trialStatuses.in_progress'),
      validated: t('trialStatuses.validated'),
      not_validated: t('trialStatuses.not_validated'),
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

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR');
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'MAD',
    }).format(amount);
  };

  const columns = [
    {
      key: "id" as keyof Integration,
      header: t('page.table.candidate'),
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
      header: t('page.table.client'),
      render: (_value: unknown, row?: Integration) => {
        return row?.client?.name || "-";
      },
    },
    {
      key: "position" as keyof Integration,
      header: t('page.table.position'),
    },
    {
      key: "integration_date" as keyof Integration,
      header: t('page.table.date'),
      render: (value: unknown) => formatDate(value as string),
    },
    {
      key: "salary" as keyof Integration,
      header: t('page.table.salary'),
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
      header: t('page.table.trialPeriod'),
      render: (value: unknown) => getTrialStatusBadge(value as TrialPeriodStatus),
    },
    {
      key: "status" as keyof Integration,
      header: t('page.table.status'),
      render: (value: unknown, row?: Integration) => (
        <div className="flex items-center gap-1.5">
          {getStatusBadge(value as IntegrationStatus)}
          {row?.is_draft && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {t('page.table.draft')}
            </span>
          )}
        </div>
      ),
    },
  ];

  const integrations = data?.data || [];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('page.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('page.subtitle')}
            </p>
          </div>
          {!isClientUser && (
            <Button onClick={() => setIsCreateModalOpen(true)} startIcon={<Plus className="icon-glow" size={20} strokeWidth={1.8} />}>
              {t('page.newIntegration')}
            </Button>
          )}
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('page.stats.total')}</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </div>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <BarChart3 size={20} strokeWidth={1.8} className="icon-glow text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">{t('page.stats.inProgress')}</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.by_status.in_progress}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Hourglass size={20} strokeWidth={1.8} className="icon-glow text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600 dark:text-green-400">{t('page.stats.completed')}</div>
                    <div className="text-2xl font-bold text-green-600">
                      {stats.by_status.completed}
                    </div>
                  </div>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 size={20} strokeWidth={1.8} className="icon-glow text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">{t('page.stats.trialSuccessRate')}</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.trial_period.success_rate}%
                    </div>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Target size={20} strokeWidth={1.8} className="icon-glow text-gray-600 dark:text-gray-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FilterSelect<IntegrationStatus>
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: '', label: t('page.filters.allStatuses'), icon: <ListFilter size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: IntegrationStatus.IN_PROGRESS, label: t('page.filters.statusInProgress'), icon: <Hourglass size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: IntegrationStatus.COMPLETED, label: t('page.filters.statusCompleted'), icon: <CheckCircle2 size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: IntegrationStatus.FAILED, label: t('page.filters.statusFailed'), icon: <XCircle size={16} strokeWidth={1.8} className="icon-glow" /> },
              ]}
            />
            <FilterSelect<TrialPeriodStatus>
              value={trialFilter}
              onChange={(v) => { setTrialFilter(v); setPage(1); }}
              options={[
                { value: '', label: t('page.filters.allTrialPeriods'), icon: <ListFilter size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: TrialPeriodStatus.IN_PROGRESS, label: t('page.filters.trialInProgress'), icon: <Hourglass size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: TrialPeriodStatus.VALIDATED, label: t('page.filters.trialValidated'), icon: <CircleCheck size={16} strokeWidth={1.8} className="icon-glow" /> },
                { value: TrialPeriodStatus.NOT_VALIDATED, label: t('page.filters.trialNotValidated'), icon: <CircleX size={16} strokeWidth={1.8} className="icon-glow" /> },
              ]}
            />
            <div>
              <button
                onClick={() => {
                  setStatusFilter('');
                  setTrialFilter('');
                  setPage(1);
                }}
                className="h-11 w-full px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={15} strokeWidth={1.8} className="icon-glow" />
                {t('page.filters.reset')}
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
          onEdit={isClientUser ? undefined : (integration) => {
            setSelectedIntegrationId(integration.id);
            setIsEditModalOpen(true);
          }}
          emptyMessage={t('page.table.empty')}
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
            addToast('success', tc('status.success'), t('page.toasts.editSuccess'));
          }}
        />
      )}
    </div>
  );
}
