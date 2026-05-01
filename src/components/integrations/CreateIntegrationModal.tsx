'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { useCreateIntegrationMutation } from '@/lib/services/integrationApi';
import { ContractType } from '@/types/integration';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';
import AutocompletePaginated from '@/components/ui/autocomplete/Autocomplete';
import { useLazySearchApplicationsForAutocompleteQuery, useGetApplicationsQuery } from '@/lib/services/applicationApi';
import CurrencySelector from '@/components/ui/currency-selector/CurrencySelector';
import { formatCurrency } from '@/lib/currencies';

interface CreateIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateIntegrationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateIntegrationModalProps) {
  const [formData, setFormData] = useState({
    application_id: '',
    position: '',
    integration_date: '',
    salary_type: 'monthly', // 'monthly' ou 'daily'
    salary: '',
    daily_rate: '',
    currency: 'MAD', // Devise par défaut
    contract_type: ContractType.CDI,
    trial_period_duration: '',
    trial_period_end_date: '',
    notes: '',
  });

  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [createIntegration, { isLoading }] = useCreateIntegrationMutation();
  
  // Hook pour la recherche paginée - Fallback temporaire
  const [searchApplications] = useLazySearchApplicationsForAutocompleteQuery();
  const { data: applicationsData, isLoading: applicationsLoading } = useGetApplicationsQuery({ 
    page: 1, 
    limit: 1000
  });
  
  // État pour la candidature sélectionnée
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Fonction de recherche pour l'autocomplete - Version fallback
  const handleSearch = async (searchTerm: string, page: number) => {
    try {
      console.log('🔍 Recherche fallback:', { searchTerm, page });
      
      // Utiliser les données déjà chargées comme fallback
      if (applicationsData?.data) {
        const applications = applicationsData.data;
        
        // Filtrer les candidatures actives
        const activeApplications = applications.filter((app: any) => 
          app.workflow_status === 'active' || (!app.workflow_status && app.status !== 'withdrawn')
        );
        
        // Filtrer par terme de recherche
        let filteredApps = activeApplications;
        if (searchTerm && searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          filteredApps = activeApplications.filter((app: any) => {
            const candidateName = `${app.cv?.candidate_first_name || ''} ${app.cv?.candidate_last_name || ''}`.toLowerCase();
            const position = (app.request?.title || '').toLowerCase();
            const clientName = (app.request?.client?.name || '').toLowerCase();
            const reference = (app.request?.reference || '').toLowerCase();
            
            return candidateName.includes(searchLower) || 
                   position.includes(searchLower) || 
                   clientName.includes(searchLower) || 
                   reference.includes(searchLower);
          });
        }
        
        // Pagination côté client
        const pageSize = 20;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedApps = filteredApps.slice(startIndex, endIndex);
        
        console.log('✅ Résultat fallback:', { 
          total: filteredApps.length, 
          page, 
          returned: paginatedApps.length 
        });

        return {
          data: paginatedApps.map((app: any) => ({
            value: app.id,
            label: `${app.cv?.candidate_first_name || 'Prénom'} ${app.cv?.candidate_last_name || 'Nom'}`,
            subtitle: `${app.request?.title || 'Poste'} - ${app.request?.client?.name || 'Client'} (${app.request?.reference || 'Ref'})`
          })),
          hasMore: endIndex < filteredApps.length,
          total: filteredApps.length,
        };
      }
      
      // Si pas de données, essayer l'endpoint de recherche
      const result = await searchApplications({
        search: searchTerm,
        page,
        limit: 20,
        active_only: true,
      }).unwrap();

      console.log('✅ Résultat recherche API:', result);

      return {
        data: result.data.map((app: any) => ({
          value: app.id,
          label: app.candidate_name,
          subtitle: `${app.position} - ${app.client_name} (${app.reference})`
        })),
        hasMore: result.pagination.hasMore,
        total: result.pagination.total,
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      console.error('❌ Détails de l\'erreur:', JSON.stringify(error, null, 2));
      
      // Vérifier si c'est une erreur RTK Query
      if (error && typeof error === 'object' && 'status' in error) {
        const rtkError = error as { status: unknown; data?: unknown };
        console.error('❌ Status:', rtkError.status);
        console.error('❌ Data:', rtkError.data);
      }
      
      return {
        data: [],
        hasMore: false,
        total: 0,
      };
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        application_id: '',
        position: '',
        integration_date: '',
        salary_type: 'monthly',
        salary: '',
        daily_rate: '',
        currency: 'MAD',
        contract_type: ContractType.CDI,
        trial_period_duration: '',
        trial_period_end_date: '',
        notes: '',
      });
      setError(null);
    }
  }, [isOpen]);

  // Auto-fill position when application is selected
  useEffect(() => {
    if (selectedApplication && !formData.position) {
      setFormData(prev => ({
        ...prev,
        position: selectedApplication.request?.title || ''
      }));
    }
  }, [selectedApplication, formData.position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedApplication) {
      setError('Veuillez sélectionner une candidature');
      return;
    }

    // Vérifier que le client_id est disponible
    const clientId = selectedApplication.request?.client?.id;
    if (!clientId) {
      setError('Impossible de récupérer les informations du client. Veuillez sélectionner une autre candidature.');
      return;
    }

    try {
      const payload: any = {
        application_id: formData.application_id,
        client_id: clientId, // Client déduit de la candidature
        position: formData.position,
        integration_date: formData.integration_date,
        contract_type: formData.contract_type,
      };

      // Responsable RH = utilisateur connecté
      if (currentUser?.first_name && currentUser?.last_name) {
        payload.hr_manager_name = `${currentUser.first_name} ${currentUser.last_name}`;
      }

      // Ajouter les champs optionnels seulement s'ils ont des valeurs
      if (formData.salary_type === 'monthly' && formData.salary && parseFloat(formData.salary) > 0) {
        payload.salary = parseFloat(formData.salary);
      }
      if (formData.salary_type === 'daily' && formData.daily_rate && parseFloat(formData.daily_rate) > 0) {
        payload.daily_rate = parseFloat(formData.daily_rate);
      }
      if (formData.currency) {
        payload.currency = formData.currency;
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

      console.log('Payload envoyé:', payload);
      console.log('Client ID utilisé:', clientId);
      
      await createIntegration(payload).unwrap();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error?.data?.message || 'Erreur lors de la création de l\'intégration');
    }
  };

  const handleIntegrationDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, integration_date: currentDateString });
  };

  const handleTrialEndDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, trial_period_end_date: currentDateString });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔗</span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Nouvelle intégration
          </h2>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-500">❌</span>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <div className="space-y-6">
            {/* Section Candidature */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👤</span>
                Candidature
              </h3>
              
              <div>
                <Label htmlFor="application_id">
                  Sélectionner une candidature <span className="text-red-500">*</span>
                </Label>
                <AutocompletePaginated
                  onSearch={handleSearch}
                  value={formData.application_id}
                  onChange={async (value, option) => {
                    setFormData({ ...formData, application_id: value });
                    
                    if (option && value) {
                      try {
                        // Récupérer les détails complets de la candidature
                        const applicationDetails = applicationsData?.data?.find(app => app.id === value);
                        
                        if (applicationDetails) {
                          console.log('Détails de la candidature trouvés:', applicationDetails);
                          setSelectedApplication(applicationDetails);
                        } else {
                          console.log('Candidature non trouvée dans les données locales, utilisation des données de l\'option');
                          // Fallback avec les données de l'option
                          setSelectedApplication({
                            id: value,
                            cv: {
                              candidate_first_name: option.label.split(' ')[0],
                              candidate_last_name: option.label.split(' ').slice(1).join(' '),
                            },
                            request: {
                              title: option.subtitle?.split(' - ')[0],
                              client: {
                                id: null, // Sera récupéré via API si nécessaire
                                name: option.subtitle?.split(' - ')[1]?.split(' (')[0],
                              },
                              reference: option.subtitle?.match(/\(([^)]+)\)$/)?.[1],
                            }
                          });
                        }
                      } catch (error) {
                        console.error('Erreur lors de la récupération des détails:', error);
                        setSelectedApplication(null);
                      }
                    } else {
                      setSelectedApplication(null);
                    }
                  }}
                  placeholder="Rechercher un candidat..."
                  required
                  noOptionsMessage="Aucune candidature trouvée"
                  searchPlaceholder="Tapez le nom du candidat ou le poste..."
                  minSearchLength={2}
                  pageSize={20}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Seules les candidatures actives sont affichées. Le recrutement et le client seront automatiquement déduits.
                </p>
              </div>

              {/* Informations déduites */}
              {selectedApplication && (
                <div className={`border rounded-lg p-3 ${
                  selectedApplication.request?.client?.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-sm ${
                      selectedApplication.request?.client?.id 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {selectedApplication.request?.client?.id ? 'ℹ️' : '⚠️'}
                    </span>
                    <div className="text-sm">
                      <p className={`font-medium ${
                        selectedApplication.request?.client?.id 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-yellow-900 dark:text-yellow-100'
                      }`}>
                        {selectedApplication.request?.client?.id 
                          ? 'Informations automatiques' 
                          : 'Informations partielles'
                        }
                      </p>
                      <p className={`mt-1 ${
                        selectedApplication.request?.client?.id 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <strong>Candidat:</strong> {selectedApplication.cv?.candidate_first_name} {selectedApplication.cv?.candidate_last_name}
                      </p>
                      <p className={`${
                        selectedApplication.request?.client?.id 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <strong>Recrutement:</strong> {selectedApplication.request?.title} ({selectedApplication.request?.reference})
                      </p>
                      <p className={`${
                        selectedApplication.request?.client?.id 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <strong>Client:</strong> {selectedApplication.request?.client?.name}
                        {selectedApplication.request?.client?.id && (
                          <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                            ✓ ID disponible
                          </span>
                        )}
                        {!selectedApplication.request?.client?.id && (
                          <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                            ⚠️ ID manquant
                          </span>
                        )}
                      </p>
                      <p className={`${
                        selectedApplication.request?.client?.id 
                          ? 'text-blue-700 dark:text-blue-300' 
                          : 'text-yellow-700 dark:text-yellow-300'
                      }`}>
                        <strong>Responsable RH:</strong> {currentUser?.first_name} {currentUser?.last_name} (utilisateur connecté)
                      </p>
                      {!selectedApplication.request?.client?.id && (
                        <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-2 italic">
                          Certaines informations du client ne sont pas disponibles. Veuillez sélectionner une autre candidature si le problème persiste.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Poste et Dates */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>💼</span>
                Informations du Poste
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">
                    Poste <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="position"
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Développeur Full Stack"
                  />
                </div>

                <div>
                  <Label htmlFor="contract_type">
                    Type de contrat <span className="text-red-500">*</span>
                  </Label>
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
                      // Reset les valeurs quand on change de type
                      salary: '',
                      daily_rate: ''
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">💼 Salaire mensuel</option>
                    <option value="daily">🔄 TJM (Freelance)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <CurrencySelector
                    value={formData.currency}
                    onChange={(currencyCode) => setFormData({ ...formData, currency: currencyCode })}
                    placeholder="Sélectionner une devise"
                    className="text-sm"
                  />
                </div>
                
                {formData.salary_type === 'monthly' ? (
                  <div>
                    <Label htmlFor="salary">
                      Salaire mensuel
                      {formData.currency && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({formatCurrency(0, formData.currency).replace('0', '').trim()})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="3750"
                    />
                    {formData.salary && formData.currency && parseFloat(formData.salary) > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Aperçu: {formatCurrency(parseFloat(formData.salary), formData.currency)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="daily_rate">
                      TJM
                      {formData.currency && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({formatCurrency(0, formData.currency).replace('0', '').trim()})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      placeholder="500"
                    />
                    {formData.daily_rate && formData.currency && parseFloat(formData.daily_rate) > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Aperçu: {formatCurrency(parseFloat(formData.daily_rate), formData.currency)}/jour
                      </p>
                    )}
                  </div>
                )}
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
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={
              isLoading || 
              !formData.integration_date || 
              !formData.application_id || 
              !selectedApplication?.request?.client?.id
            } 
            variant="primary"
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Création...' : 'Créer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}