'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGetIntegrationByIdQuery, useUpdateIntegrationMutation } from '@/lib/services/integrationApi';
import { ContractType, IntegrationStatus, TrialPeriodStatus } from '@/types/integration';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';

interface EditIntegrationModalProps {
  integrationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditIntegrationModal({
  integrationId,
  isOpen,
  onClose,
  onSuccess,
}: EditIntegrationModalProps) {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');
  const [formData, setFormData] = useState({
    position: '',
    integration_date: '',
    salary_type: 'monthly',
    salary: '',
    daily_rate: '',
    currency: 'MAD',
    contract_type: ContractType.CDI,
    trial_period_duration: '',
    trial_period_end_date: '',
    status: IntegrationStatus.IN_PROGRESS,
    trial_period_status: TrialPeriodStatus.IN_PROGRESS,
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);

  const { data: integration, isLoading } = useGetIntegrationByIdQuery(integrationId, {
    skip: !integrationId || !isOpen,
  });

  const [updateIntegration, { isLoading: isUpdating }] = useUpdateIntegrationMutation();

  // Populate form when integration data is loaded
  useEffect(() => {
    if (integration) {
      setFormData({
        position: integration.position || '',
        integration_date: integration.integration_date ? new Date(integration.integration_date).toISOString().split('T')[0] : '',
        salary_type: integration.salary ? 'monthly' : 'daily',
        salary: integration.salary?.toString() || '',
        daily_rate: integration.daily_rate?.toString() || '',
        currency: integration.currency || 'MAD',
        contract_type: integration.contract_type || ContractType.CDI,
        trial_period_duration: integration.trial_period_duration?.toString() || '',
        trial_period_end_date: integration.trial_period_end_date ? new Date(integration.trial_period_end_date).toISOString().split('T')[0] : '',
        status: integration.status || IntegrationStatus.IN_PROGRESS,
        trial_period_status: integration.trial_period_status || TrialPeriodStatus.IN_PROGRESS,
        notes: integration.notes || '',
      });
    }
  }, [integration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: any = {
        position: formData.position,
        integration_date: formData.integration_date,
        currency: formData.currency,
        contract_type: formData.contract_type,
        status: formData.status,
        trial_period_status: formData.trial_period_status,
      };

      // Ajouter les champs optionnels
      if (formData.salary_type === 'monthly' && formData.salary && parseFloat(formData.salary) > 0) {
        payload.salary = parseFloat(formData.salary);
        payload.daily_rate = null; // Reset l'autre champ
      }
      if (formData.salary_type === 'daily' && formData.daily_rate && parseFloat(formData.daily_rate) > 0) {
        payload.daily_rate = parseFloat(formData.daily_rate);
        payload.salary = null; // Reset l'autre champ
      }
      if (formData.trial_period_duration && parseInt(formData.trial_period_duration) > 0) {
        payload.trial_period_duration = parseInt(formData.trial_period_duration);
      }
      if (formData.trial_period_end_date) {
        payload.trial_period_end_date = formData.trial_period_end_date;
      }
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      await updateIntegration({ id: integrationId, data: payload }).unwrap();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error?.data?.message || t('modals.edit.updateFailed'));
    }
  };

  const handleIntegrationDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, integration_date: currentDateString });
  };

  const handleTrialEndDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, trial_period_end_date: currentDateString });
  };

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="p-6 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('modals.edit.loading')}</p>
        </div>
      </Modal>
    );
  }

  if (!integration) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{t('modals.edit.notFound')}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="text-2xl">✏️</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('modals.edit.title')}
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Informations candidat (lecture seule) */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <span>👤</span>
              {t('modals.edit.candidateSection.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('modals.edit.candidateSection.name')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_first_name} {integration.application?.cv?.candidate_last_name}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('modals.edit.candidateSection.email')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_email}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('modals.edit.candidateSection.recruitment')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.request?.title}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">{t('modals.edit.candidateSection.client')}</span>
                <span className="ms-2 text-blue-900 dark:text-blue-100">
                  {integration.client?.name}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Poste et Dates */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💼</span>
                {t('modals.edit.positionSection.title')}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">{t('modals.edit.positionSection.position')}</Label>
                  <Input
                    id="position"
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="contract_type">{t('modals.edit.positionSection.contractType')}</Label>
                  <select
                    id="contract_type"
                    required
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as ContractType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cdi">{t('contractTypes.cdi')}</option>
                    <option value="cdd">{t('contractTypes.cdd')}</option>
                    <option value="freelance">{t('contractTypes.freelance')}</option>
                    <option value="interim">{t('contractTypes.interim')}</option>
                    <option value="stage">{t('contractTypes.stage')}</option>
                    <option value="alternance">{t('contractTypes.alternance')}</option>
                  </select>
                </div>
              </div>

              <div>
                <DatePicker
                  id="integration_date"
                  label={t('modals.edit.positionSection.integrationDate')}
                  placeholder={t('modals.edit.positionSection.datePlaceholder')}
                  onChange={handleIntegrationDateChange}
                  defaultDate={formData.integration_date || undefined}
                />
              </div>
            </div>

            {/* Section Rémunération */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💰</span>
                {t('modals.edit.salarySection.title')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salary_type">{t('modals.edit.salarySection.salaryType')}</Label>
                  <select
                    id="salary_type"
                    value={formData.salary_type}
                    onChange={(e) => setFormData({
                      ...formData,
                      salary_type: e.target.value,
                      salary: '',
                      daily_rate: ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">{t('modals.edit.salarySection.monthlyOption')}</option>
                    <option value="daily">{t('modals.edit.salarySection.dailyOption')}</option>
                  </select>
                </div>

                {formData.salary_type === 'monthly' ? (
                  <div>
                    <Label htmlFor="salary">{t('modals.edit.salarySection.monthlySalary')}</Label>
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder={t('modals.edit.salarySection.salaryPlaceholder')}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="daily_rate">{t('modals.edit.salarySection.dailyRate')}</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      placeholder={t('modals.edit.salarySection.dailyRatePlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="currency">{t('modals.edit.salarySection.currency')}</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MAD">MAD (د.م.)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="TND">TND (د.ت)</option>
                    <option value="DZD">DZD (د.ج)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SAR">SAR (﷼)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Statuts */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📊</span>
                {t('modals.edit.statusSection.title')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">{t('modals.edit.statusSection.integrationStatus')}</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as IntegrationStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="in_progress">{t('page.filters.statusInProgress')}</option>
                    <option value="completed">{t('page.filters.statusCompleted')}</option>
                    <option value="failed">{t('page.filters.statusFailed')}</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="trial_period_status">{t('modals.edit.statusSection.trialStatus')}</Label>
                  <select
                    id="trial_period_status"
                    value={formData.trial_period_status}
                    onChange={(e) => setFormData({ ...formData, trial_period_status: e.target.value as TrialPeriodStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="in_progress">{t('page.filters.trialInProgress')}</option>
                    <option value="validated">{t('page.filters.trialValidated')}</option>
                    <option value="not_validated">{t('page.filters.trialNotValidated')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Période d'essai */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>⏱️</span>
                {t('modals.edit.trialSection.title')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_period_duration">{t('modals.edit.trialSection.duration')}</Label>
                  <Input
                    id="trial_period_duration"
                    type="number"
                    min="0"
                    value={formData.trial_period_duration}
                    onChange={(e) => setFormData({ ...formData, trial_period_duration: e.target.value })}
                    placeholder={t('modals.edit.trialSection.durationPlaceholder')}
                  />
                </div>
                <div>
                  <DatePicker
                    id="trial_period_end_date"
                    label={t('modals.edit.trialSection.endDate')}
                    placeholder={t('modals.edit.positionSection.datePlaceholder')}
                    onChange={handleTrialEndDateChange}
                    defaultDate={formData.trial_period_end_date || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Section Notes */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                {t('modals.edit.notesSection.title')}
              </h3>

              <div>
                <Label htmlFor="notes">{t('modals.edit.notesSection.label')}</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('modals.edit.notesSection.placeholder')}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
                {tc('actions.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isUpdating || !formData.integration_date || !formData.position}
                variant="primary"
                className="w-full sm:w-auto"
              >
                {isUpdating ? t('modals.edit.updating') : t('modals.edit.save')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}