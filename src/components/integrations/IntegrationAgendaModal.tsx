'use client';

import { useState, useEffect } from 'react';
import { useGetIntegrationByIdQuery } from '@/lib/services/integrationApi';
import { ContractType, IntegrationStatus, TrialPeriodStatus } from '@/types/integration';
import { Modal } from '@/components/ui/modal';
import Badge from '@/components/ui/badge/Badge';

interface IntegrationAgendaModalProps {
  integrationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function IntegrationAgendaModal({
  integrationId,
  isOpen,
  onClose,
  onSuccess,
}: IntegrationAgendaModalProps) {
  const [error, setError] = useState<string | null>(null);

  const { data: integration, isLoading } = useGetIntegrationByIdQuery(integrationId, {
    skip: !integrationId || !isOpen,
  });

  // Populate form when integration data is loaded
  useEffect(() => {
    if (integration) {
      setError(null);
    }
  }, [integration]);

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

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Chargement des détails...</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (!integration) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Intégration non trouvée</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Détails de l'intégration
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Pas d'actions spécifiques dans l'agenda - seulement consultation */}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Vue en lecture seule avec actions spécifiques */}
        <div className="space-y-6">
          {/* Informations candidat */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <span>👤</span>
              Candidat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Nom:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_first_name || integration.application?.cv?.first_name} {integration.application?.cv?.candidate_last_name || integration.application?.cv?.last_name}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Email:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_email || integration.application?.cv?.email}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Recrutement:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.request?.title}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Client:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.client?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Informations intégration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">💼 Poste</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Position:</span>
                    <span className="ml-2 font-medium">{integration.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Type de contrat:</span>
                    <span className="ml-2 font-medium">{integration.contract_type?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date d'intégration:</span>
                    <span className="ml-2 font-medium">
                      {new Date(integration.integration_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">💰 Rémunération</h4>
                <div className="space-y-2 text-sm">
                  {integration.salary && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Salaire mensuel:</span>
                      <span className="ml-2 font-medium">{formatCurrency(integration.salary, integration.currency)}</span>
                    </div>
                  )}
                  {integration.daily_rate && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">TJM:</span>
                      <span className="ml-2 font-medium">{formatCurrency(integration.daily_rate, integration.currency)}/jour</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 Statuts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Intégration:</span>
                    {getStatusBadge(integration.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Période d'essai:</span>
                    {getTrialStatusBadge(integration.trial_period_status)}
                  </div>
                  {integration.is_renewed && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Renouvellement:</span>
                      <Badge variant="light" color="info" size="sm">
                        Renouvelée
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Évaluations et notes */}
              {(integration.evaluation_notes || integration.performance_rating) && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 Évaluation</h4>
                  <div className="space-y-2 text-sm">
                    {integration.performance_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Performance:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">
                            {'⭐'.repeat(integration.performance_rating)}
                            {'☆'.repeat(5 - integration.performance_rating)}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {integration.performance_rating}/5
                          </span>
                        </div>
                      </div>
                    )}
                    {integration.evaluation_notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                        <p className="mt-1 text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                          {integration.evaluation_notes.length > 100 
                            ? `${integration.evaluation_notes.substring(0, 100)}...` 
                            : integration.evaluation_notes
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {integration.notes && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">📝 Notes</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {integration.notes}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de consultation uniquement - pas d'actions dans l'agenda */}
    </Modal>
  );
}