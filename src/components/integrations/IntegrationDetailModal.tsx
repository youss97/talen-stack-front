'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useGetIntegrationByIdQuery,
  useDeleteIntegrationMutation,
  useValidateTrialPeriodMutation,
  useCompleteIntegrationMutation,
  useRecordDepartureMutation,
  useRenewIntegrationMutation,
  useUpdateEvaluationNotesMutation,
} from '@/lib/services/integrationApi';
import { IntegrationStatus, TrialPeriodStatus } from '@/types/integration';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/modal/ConfirmModal';
import { useToast } from '@/hooks/useToast';
import RenewIntegrationModal from './RenewIntegrationModal';
import EvaluationNotesModal from './EvaluationNotesModal';
import Label from '@/components/form/Label';

interface IntegrationDetailModalProps {
  integrationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function IntegrationDetailModal({
  integrationId,
  isOpen,
  onClose,
  onSuccess,
}: IntegrationDetailModalProps) {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showValidateTrialModal, setShowValidateTrialModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDepartureModal, setShowDepartureModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  
  const [trialNotes, setTrialNotes] = useState('');
  const [finalRating, setFinalRating] = useState(5);
  const [finalEvaluation, setFinalEvaluation] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureReason, setDepartureReason] = useState('');

  const { success: showSuccess, error: showError } = useToast();

  const { data: integration, isLoading } = useGetIntegrationByIdQuery(integrationId);
  const [deleteIntegration] = useDeleteIntegrationMutation();
  const [validateTrialPeriod] = useValidateTrialPeriodMutation();
  const [completeIntegration] = useCompleteIntegrationMutation();
  const [recordDeparture] = useRecordDepartureMutation();
  const [renewIntegration] = useRenewIntegrationMutation();
  const [updateEvaluationNotes] = useUpdateEvaluationNotesMutation();

  const handleDelete = async () => {
    try {
      await deleteIntegration(integrationId).unwrap();
      showSuccess(t('modals.detail.toasts.deleteSuccess'));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      showError(t('modals.detail.toasts.deleteError'));
    }
  };

  const handleValidateTrial = async (validated: boolean) => {
    try {
      await validateTrialPeriod({
        id: integrationId,
        validated,
        notes: trialNotes,
      }).unwrap();
      setShowValidateTrialModal(false);
      setTrialNotes('');
      showSuccess(validated ? t('modals.detail.toasts.trialValidated') : t('modals.detail.toasts.trialInvalidated'));
      onSuccess?.();
    } catch (error) {
      console.error('Erreur:', error);
      showError(t('modals.detail.toasts.trialError'));
    }
  };

  const handleComplete = async () => {
    try {
      await completeIntegration({
        id: integrationId,
        finalRating,
        finalEvaluation,
      }).unwrap();
      setShowCompleteModal(false);
      showSuccess(t('modals.detail.toasts.completeSuccess'));
      onSuccess?.();
    } catch (error) {
      console.error('Erreur:', error);
      showError(t('modals.detail.toasts.completeError'));
    }
  };

  const handleDeparture = async () => {
    try {
      await recordDeparture({
        id: integrationId,
        departureDate,
        reason: departureReason,
      }).unwrap();
      setShowDepartureModal(false);
      showSuccess(t('modals.detail.toasts.departureSuccess'));
      onSuccess?.();
    } catch (error) {
      console.error('Erreur:', error);
      showError(t('modals.detail.toasts.departureError'));
    }
  };

  const handleRenewal = async (data: {
    new_end_date: string;
    renewal_period_months: number;
    renewal_notes?: string;
  }) => {
    try {
      await renewIntegration({
        id: integrationId,
        ...data,
      }).unwrap();
      setShowRenewalModal(false);
      showSuccess(t('modals.detail.toasts.renewSuccess'));
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur:', error);
      showError(error?.data?.message || t('modals.detail.toasts.renewError'));
    }
  };

  const handleEvaluationNotes = async (data: {
    evaluation_notes: string;
    performance_rating?: number;
    evaluation_date?: string;
  }) => {
    try {
      await updateEvaluationNotes({
        id: integrationId,
        ...data,
      }).unwrap();
      setShowEvaluationModal(false);
      showSuccess(t('modals.detail.toasts.evaluationSuccess'));
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur:', error);
      showError(error?.data?.message || t('modals.detail.toasts.evaluationError'));
    }
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

  const getStatusLabel = (status: IntegrationStatus) => {
    const labels = {
      in_progress: t('statuses.in_progress'),
      completed: t('statuses.completed'),
      failed: t('statuses.failed'),
    };
    return labels[status];
  };

  const getTrialStatusLabel = (status: TrialPeriodStatus) => {
    const labels = {
      in_progress: t('trialStatuses.in_progress'),
      validated: t('trialStatuses.validated'),
      not_validated: t('trialStatuses.not_validated'),
    };
    return labels[status];
  };

  const getContractTypeLabel = (type: string) => {
    const labels: any = {
      cdi: t('contractTypes.cdi'),
      cdd: t('contractTypes.cdd'),
      freelance: t('contractTypes.freelance'),
      interim: t('contractTypes.interim'),
      stage: t('contractTypes.stage'),
      alternance: t('contractTypes.alternance'),
    };
    return labels[type] || type;
  };

  if (isLoading || !integration) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="p-6">{t('modals.detail.loading')}</div>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {t('modals.detail.title')}
            </h2>

          {/* Informations principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('modals.detail.generalSection.title')}
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.candidate')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.application?.cv?.first_name}{' '}
                    {integration.application?.cv?.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.client')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.client?.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.position')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.position}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.integrationDate')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {formatDate(integration.integration_date)}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.contractType')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {getContractTypeLabel(integration.contract_type)}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.generalSection.status')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {getStatusLabel(integration.status)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('modals.detail.salarySection.title')}
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {integration.salary && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.salarySection.monthlySalary')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {formatCurrency(integration.salary, integration.currency)}
                    </p>
                  </div>
                )}
                {integration.daily_rate && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.salarySection.dailyRate')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {formatCurrency(integration.daily_rate, integration.currency)}{t('modals.detail.salarySection.perDay')}
                    </p>
                  </div>
                )}
                {integration.hr_manager && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.salarySection.hrManager')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {integration.hr_manager.first_name} {integration.hr_manager.last_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Période d'essai */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {t('modals.detail.trialSection.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.trialSection.duration')}</span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                  {integration.trial_period_duration || '-'} {t('modals.detail.trialSection.days')}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.trialSection.endDate')}</span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                  {integration.trial_period_end_date
                    ? formatDate(integration.trial_period_end_date)
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.trialSection.status')}</span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                  {getTrialStatusLabel(integration.trial_period_status)}
                </p>
              </div>
            </div>
            {integration.trial_period_notes && (
              <div className="mt-3 sm:mt-4">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.trialSection.notes')}</span>
                <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                  {integration.trial_period_notes}
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {integration.notes && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('modals.detail.notesSection.title')}
              </h3>
              <p className="text-sm sm:text-base text-gray-900 dark:text-white">{integration.notes}</p>
            </div>
          )}

          {/* Départ */}
          {integration.departure_date && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('modals.detail.departureSection.title')}
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.departureSection.date')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {formatDate(integration.departure_date)}
                  </p>
                </div>
                {integration.departure_reason && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.departureSection.reason')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {integration.departure_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Évaluation finale */}
          {(integration.final_rating || integration.evaluation_notes || integration.performance_rating) && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('modals.detail.evaluationSection.title')}
              </h3>
              <div className="space-y-3">
                {integration.performance_rating && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.evaluationSection.performance')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {integration.performance_rating}/5 {'⭐'.repeat(integration.performance_rating)}
                    </p>
                  </div>
                )}
                {integration.evaluation_notes && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.evaluationSection.evaluationNotes')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                      {integration.evaluation_notes}
                    </p>
                  </div>
                )}
                {integration.final_rating && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.evaluationSection.finalRating')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                      {integration.final_rating}/5 ⭐
                    </p>
                  </div>
                )}
                {integration.final_evaluation && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.evaluationSection.finalEvaluation')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {integration.final_evaluation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Renouvellement */}
          {integration.is_renewed && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('modals.detail.renewalSection.title')}
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.renewalSection.renewalDate')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.renewal_date ? formatDate(integration.renewal_date) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.renewalSection.period')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.renewal_period_months} {t('modals.detail.renewalSection.months')}
                  </p>
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.renewalSection.newEndDate')}</span>
                  <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
                    {integration.new_end_date ? formatDate(integration.new_end_date) : '-'}
                  </p>
                </div>
                {integration.renewal_notes && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('modals.detail.renewalSection.notes')}</span>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">
                      {integration.renewal_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Actions spécifiques selon le statut */}
            {integration.status === IntegrationStatus.IN_PROGRESS &&
              integration.trial_period_status === TrialPeriodStatus.IN_PROGRESS && (
                <Button
                  onClick={() => setShowValidateTrialModal(true)}
                  variant="outline"
                  className="text-xs sm:text-sm text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  {t('modals.detail.actions.trialPeriod')}
                </Button>
              )}

            {integration.status === IntegrationStatus.IN_PROGRESS && (
              <>
                <Button
                  onClick={() => setShowEvaluationModal(true)}
                  variant="outline"
                  className="text-xs sm:text-sm text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  {t('modals.detail.actions.evaluationNotes')}
                </Button>

                {!integration.is_renewed && (
                  <Button
                    onClick={() => setShowRenewalModal(true)}
                    variant="outline"
                    className="text-xs sm:text-sm text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    {t('modals.detail.actions.renew')}
                  </Button>
                )}

                <Button
                  onClick={() => setShowCompleteModal(true)}
                  variant="primary"
                  className="text-xs sm:text-sm"
                >
                  {t('modals.detail.actions.complete')}
                </Button>

                <Button
                  onClick={() => setShowDepartureModal(true)}
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  {t('modals.detail.actions.departure')}
                </Button>
              </>
            )}

            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="ms-auto text-xs sm:text-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              {t('modals.detail.actions.delete')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={t('modals.detail.deleteConfirm.title')}
        message={t('modals.detail.deleteConfirm.message')}
      />

      {/* Modal validation période d'essai */}
      {showValidateTrialModal && (
        <Modal isOpen={showValidateTrialModal} onClose={() => setShowValidateTrialModal(false)} className="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⏱️</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('modals.detail.validateTrialModal.title')}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="trial_notes">{t('modals.detail.validateTrialModal.notesLabel')}</Label>
                <textarea
                  id="trial_notes"
                  value={trialNotes}
                  onChange={(e) => setTrialNotes(e.target.value)}
                  placeholder={t('modals.detail.validateTrialModal.notesPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowValidateTrialModal(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                onClick={() => handleValidateTrial(false)}
                variant="outline"
                className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50"
              >
                {t('modals.detail.validateTrialModal.invalidate')}
              </Button>
              <Button
                onClick={() => handleValidateTrial(true)}
                variant="primary"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {t('modals.detail.validateTrialModal.validate')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal marquer comme terminée */}
      {showCompleteModal && (
        <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} className="max-w-lg">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">✅</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('modals.detail.completeModal.title')}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="final_rating">{t('modals.detail.completeModal.finalRatingLabel')}</Label>
                <select
                  id="final_rating"
                  value={finalRating}
                  onChange={(e) => setFinalRating(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={1}>⭐ 1 - {t('ratingLabels.1')}</option>
                  <option value={2}>⭐⭐ 2 - {t('ratingLabels.2')}</option>
                  <option value={3}>⭐⭐⭐ 3 - {t('ratingLabels.3')}</option>
                  <option value={4}>⭐⭐⭐⭐ 4 - {t('ratingLabels.4')}</option>
                  <option value={5}>⭐⭐⭐⭐⭐ 5 - {t('ratingLabels.5')}</option>
                </select>
              </div>

              <div>
                <Label htmlFor="final_evaluation">{t('modals.detail.completeModal.finalEvaluationLabel')}</Label>
                <textarea
                  id="final_evaluation"
                  value={finalEvaluation}
                  onChange={(e) => setFinalEvaluation(e.target.value)}
                  placeholder={t('modals.detail.completeModal.finalEvaluationPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => setShowCompleteModal(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                onClick={handleComplete}
                variant="primary"
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              >
                {t('modals.detail.completeModal.confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal enregistrer départ */}
      {showDepartureModal && (
        <Modal isOpen={showDepartureModal} onClose={() => setShowDepartureModal(false)} className="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📤</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('modals.detail.departureModal.title')}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="departure_date">
                  {t('modals.detail.departureModal.dateLabel')} <span className="text-red-500">*</span>
                </Label>
                <input
                  type="date"
                  id="departure_date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="departure_reason">{t('modals.detail.departureModal.reasonLabel')}</Label>
                <textarea
                  id="departure_reason"
                  value={departureReason}
                  onChange={(e) => setDepartureReason(e.target.value)}
                  placeholder={t('modals.detail.departureModal.reasonPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => {
                  setShowDepartureModal(false);
                  setDepartureDate('');
                  setDepartureReason('');
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {tc('actions.cancel')}
              </Button>
              <Button
                onClick={handleDeparture}
                variant="primary"
                disabled={!departureDate}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                {t('modals.detail.departureModal.confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de renouvellement */}
      <RenewIntegrationModal
        isOpen={showRenewalModal}
        onClose={() => setShowRenewalModal(false)}
        onSubmit={handleRenewal}
        currentEndDate={integration?.trial_period_end_date || integration?.new_end_date}
        integrationDate={integration?.integration_date}
      />

      {/* Modal des notes d'évaluation */}
      <EvaluationNotesModal
        isOpen={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        onSubmit={handleEvaluationNotes}
        currentNotes={integration?.evaluation_notes}
        currentRating={integration?.performance_rating}
        title={t('modals.evaluationNotes.defaultTitle')}
      />
    </>
  );
}
