'use client';

import { useState, useEffect } from 'react';
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
      setError(error?.data?.message || 'Erreur lors de la mise à jour de l\'intégration');
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
          <p className="text-gray-600 dark:text-gray-400">Chargement des détails...</p>
        </div>
      </Modal>
    );
  }

  if (!integration) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">Intégration non trouvée</p>
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
              Modifier l'intégration
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
              Candidat
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Nom:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_first_name} {integration.application?.cv?.candidate_last_name}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Email:</span>
                <span className="ml-2 text-blue-900 dark:text-blue-100">
                  {integration.application?.cv?.candidate_email}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Poste et Dates */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💼</span>
                Informations du Poste
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Poste *</Label>
                  <Input
                    id="position"
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="contract_type">Type de contrat *</Label>
                  <select
                    id="contract_type"
                    required
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as ContractType })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="cdi">CDI</option>
                    <option value="cdd">CDD</option>
                    <option value="freelance">Freelance</option>
                    <option value="interim">Intérim</option>
                    <option value="stage">Stage</option>
                    <option value="alternance">Alternance</option>
                  </select>
                </div>
              </div>

              <div>
                <DatePicker
                  id="integration_date"
                  label="Date d'intégration *"
                  placeholder="Sélectionner une date"
                  onChange={handleIntegrationDateChange}
                  defaultDate={formData.integration_date || undefined}
                />
              </div>
            </div>

            {/* Section Rémunération */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💰</span>
                Rémunération
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salary_type">Type de rémunération</Label>
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
                    <option value="monthly">💼 Salaire mensuel</option>
                    <option value="daily">🔄 TJM (Freelance)</option>
                  </select>
                </div>
                
                {formData.salary_type === 'monthly' ? (
                  <div>
                    <Label htmlFor="salary">Salaire mensuel</Label>
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="3750"
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="daily_rate">TJM</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="currency">Devise</Label>
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
                Statuts
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Statut d'intégration</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as IntegrationStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="in_progress">🔄 En cours</option>
                    <option value="completed">✅ Terminée</option>
                    <option value="failed">❌ Échec</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="trial_period_status">Statut période d'essai</Label>
                  <select
                    id="trial_period_status"
                    value={formData.trial_period_status}
                    onChange={(e) => setFormData({ ...formData, trial_period_status: e.target.value as TrialPeriodStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="in_progress">⏳ En cours</option>
                    <option value="validated">✅ Validée</option>
                    <option value="not_validated">❌ Non validée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section Période d'essai */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>⏱️</span>
                Période d'essai
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_period_duration">Durée (jours)</Label>
                  <Input
                    id="trial_period_duration"
                    type="number"
                    min="0"
                    value={formData.trial_period_duration}
                    onChange={(e) => setFormData({ ...formData, trial_period_duration: e.target.value })}
                    placeholder="90"
                  />
                </div>
                <div>
                  <DatePicker
                    id="trial_period_end_date"
                    label="Date de fin"
                    placeholder="Sélectionner une date"
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
                Notes
              </h3>
              
              <div>
                <Label htmlFor="notes">Notes sur l'intégration</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notes sur l'intégration, objectifs, points d'attention..."
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating || !formData.integration_date || !formData.position} 
                variant="primary"
                className="w-full sm:w-auto"
              >
                {isUpdating ? 'Mise à jour...' : 'Sauvegarder'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}