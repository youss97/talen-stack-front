'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGetIntegrationByIdQuery, useUpdateIntegrationMutation } from '@/lib/services/integrationApi';
import { ContractType, IntegrationStatus, TrialPeriodStatus } from '@/types/integration';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import { getApiErrorMessage } from '@/utils/errorMessages';

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
  const t = useTranslations('integrations.agendaModal');
  const tInt = useTranslations('integrations');
  const tc = useTranslations('common');
  const [error, setError] = useState<string | null>(null);
  // 6.3 — Marquer l'intégration Réussie/Échouée avec un motif
  const [outcomeMode, setOutcomeMode] = useState<null | 'completed' | 'failed'>(null);
  const [motif, setMotif] = useState('');
  const [updateIntegration, { isLoading: isSaving }] = useUpdateIntegrationMutation();

  const { data: integration, isLoading } = useGetIntegrationByIdQuery(integrationId, {
    skip: !integrationId || !isOpen,
  });

  // Populate form when integration data is loaded
  useEffect(() => {
    if (integration) {
      setError(null);
    }
  }, [integration]);

  // Réinitialiser le panneau d'action à la fermeture / changement
  useEffect(() => {
    if (!isOpen) {
      setOutcomeMode(null);
      setMotif('');
    }
  }, [isOpen]);

  const submitOutcome = async () => {
    if (!outcomeMode || !integration) return;
    if (!motif.trim()) {
      setError(t('outcome.motifRequiredError'));
      return;
    }
    setError(null);
    try {
      const data =
        outcomeMode === 'completed'
          ? { status: IntegrationStatus.COMPLETED, final_evaluation: motif.trim() }
          : { status: IntegrationStatus.FAILED, departure_reason: motif.trim() };
      await updateIntegration({ id: integration.id, data }).unwrap();
      setOutcomeMode(null);
      setMotif('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, t('outcome.updateErrorDefault')));
    }
  };

  const getStatusBadge = (status: IntegrationStatus) => {
    const styles = {
      in_progress: 'info',
      completed: 'success',
      failed: 'error',
    };

    const labels = {
      in_progress: tInt('statuses.in_progress'),
      completed: tInt('statuses.completed'),
      failed: tInt('statuses.failed'),
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
      in_progress: tInt('trialStatuses.in_progress'),
      validated: tInt('trialStatuses.validated'),
      not_validated: tInt('trialStatuses.not_validated'),
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
      currency: currency || 'MAD',
    }).format(amount);
  };
  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
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
            <p className="text-red-600 dark:text-red-400">{t('notFound')}</p>
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
              {t('title')}
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
              {t('candidateSection.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('candidateSection.name')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_first_name || integration.application?.cv?.first_name} {integration.application?.cv?.candidate_last_name || integration.application?.cv?.last_name}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('candidateSection.email')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_email || integration.application?.cv?.email}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('candidateSection.recruitment')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.request?.title}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('candidateSection.client')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.client?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Informations intégration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">💼 {t('positionSection.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('positionSection.position')}</span>
                    <span className="ms-2 font-medium">{integration.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('positionSection.contractType')}</span>
                    <span className="ms-2 font-medium">{integration.contract_type?.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{t('positionSection.integrationDate')}</span>
                    <span className="ms-2 font-medium">
                      {integration.integration_date ? (() => { const d = new Date(integration.integration_date); return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('fr-FR'); })() : '-'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">💰 {t('salarySection.title')}</h4>
                <div className="space-y-2 text-sm">
                  {integration.salary && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('salarySection.monthlySalary')}</span>
                      <span className="ms-2 font-medium">{formatCurrency(integration.salary, integration.currency)}</span>
                    </div>
                  )}
                  {integration.daily_rate && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{t('salarySection.dailyRate')}</span>
                      <span className="ms-2 font-medium">{formatCurrency(integration.daily_rate, integration.currency)}{t('salarySection.perDay')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 {t('statusesSection.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('statusesSection.integration')}</span>
                    {getStatusBadge(integration.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('statusesSection.trialPeriod')}</span>
                    {getTrialStatusBadge(integration.trial_period_status)}
                  </div>
                  {integration.is_renewed && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('statusesSection.renewal')}</span>
                      <Badge variant="light" color="info" size="sm">
                        {t('statusesSection.renewed')}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Évaluations et notes */}
              {(integration.evaluation_notes || integration.performance_rating) && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">📊 {t('evaluationSection.title')}</h4>
                  <div className="space-y-2 text-sm">
                    {integration.performance_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('evaluationSection.performance')}</span>
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
                        <span className="text-gray-600 dark:text-gray-400">{t('evaluationSection.notes')}</span>
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
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">📝 {t('notesSection.title')}</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {integration.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6.3 — Actions : marquer Réussie / Échouée avec motif */}
      <div className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 p-4 sm:p-6">
        {outcomeMode ? (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('outcome.motifLabel')} {outcomeMode === 'completed' ? t('outcome.motifCompletedSuffix') : t('outcome.motifFailedSuffix')}
              <span className="text-error-500"> *</span>
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder={t('outcome.motifPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setOutcomeMode(null); setMotif(''); setError(null); }} disabled={isSaving}>
                {tc('actions.cancel')}
              </Button>
              <Button onClick={submitOutcome} disabled={isSaving}>
                {isSaving ? t('outcome.saving') : t('outcome.confirm')}
              </Button>
            </div>
          </div>
        ) : integration.status === IntegrationStatus.IN_PROGRESS ? (
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={() => { setOutcomeMode('failed'); setError(null); }}>
              {t('outcome.markFailed')}
            </Button>
            <Button onClick={() => { setOutcomeMode('completed'); setError(null); }}>
              {t('outcome.markCompleted')}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-end">
            {integration.status === IntegrationStatus.COMPLETED ? t('outcome.closedCompleted') : t('outcome.closedFailed')}
          </p>
        )}
      </div>
    </Modal>
  );
}
