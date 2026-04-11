'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';

interface RenewIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    new_end_date: string;
    renewal_period_months: number;
    renewal_notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  currentEndDate?: string;
  integrationDate?: string;
}

export default function RenewIntegrationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  currentEndDate,
  integrationDate,
}: RenewIntegrationModalProps) {
  const [formData, setFormData] = useState({
    new_end_date: '',
    renewal_period_months: 12,
    renewal_notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Calculer la période actuelle
  const calculateCurrentPeriod = () => {
    if (!integrationDate || !currentEndDate) return 0;
    
    const start = new Date(integrationDate);
    const end = new Date(currentEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    return diffMonths;
  };

  const currentPeriodMonths = calculateCurrentPeriod();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Calculer la nouvelle date de fin basée sur la même période
      const newEndDate = new Date();
      if (currentEndDate) {
        const currentEnd = new Date(currentEndDate);
        newEndDate.setTime(currentEnd.getTime() + (currentPeriodMonths * 30 * 24 * 60 * 60 * 1000));
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 12);
      }

      setFormData({
        new_end_date: newEndDate.toISOString().split('T')[0],
        renewal_period_months: currentPeriodMonths || 12,
        renewal_notes: '',
      });
      setError(null);
    }
  }, [isOpen, currentEndDate, currentPeriodMonths]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.new_end_date) {
      setError('Veuillez sélectionner une nouvelle date de fin');
      return;
    }

    // Vérifier que la nouvelle date est après la date actuelle
    const newDate = new Date(formData.new_end_date);
    const today = new Date();
    if (newDate <= today) {
      setError('La nouvelle date de fin doit être dans le futur');
      return;
    }

    try {
      await onSubmit({
        new_end_date: formData.new_end_date,
        renewal_period_months: formData.renewal_period_months,
        renewal_notes: formData.renewal_notes.trim() || undefined,
      });
      onClose();
    } catch (error: any) {
      setError(error?.message || 'Erreur lors du renouvellement');
    }
  };

  const handleDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, new_end_date: currentDateString });
  };

  const handlePeriodChange = (months: number) => {
    setFormData({ ...formData, renewal_period_months: months });
    
    // Recalculer la date de fin basée sur la période sélectionnée
    if (currentEndDate) {
      const currentEnd = new Date(currentEndDate);
      const newEndDate = new Date(currentEnd);
      newEndDate.setMonth(newEndDate.getMonth() + months);
      setFormData(prev => ({
        ...prev,
        renewal_period_months: months,
        new_end_date: newEndDate.toISOString().split('T')[0],
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="text-2xl">🔄</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Renouveler l'intégration
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

          <div className="space-y-6">
            {/* Informations actuelles */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <span>ℹ️</span>
                Période actuelle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Date d'intégration:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {integrationDate ? new Date(integrationDate).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Date de fin actuelle:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {currentEndDate ? new Date(currentEndDate).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Durée actuelle:</span>
                  <span className="ml-2 text-blue-900 dark:text-blue-100">
                    {currentPeriodMonths} mois
                  </span>
                </div>
              </div>
            </div>

            {/* Sélection de la période de renouvellement */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📅</span>
                Période de renouvellement
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label>Durée du renouvellement</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {[6, 12, 18, 24].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => handlePeriodChange(months)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          formData.renewal_period_months === months
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {months} mois
                      </button>
                    ))}
                  </div>
                  
                  {/* Option personnalisée */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={formData.renewal_period_months}
                      onChange={(e) => handlePeriodChange(parseInt(e.target.value) || 12)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">mois (personnalisé)</span>
                  </div>
                </div>

                <div>
                  <DatePicker
                    id="new_end_date"
                    label="Nouvelle date de fin *"
                    placeholder="Sélectionner la nouvelle date de fin"
                    onChange={handleDateChange}
                    defaultDate={formData.new_end_date || undefined}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cette date sera la nouvelle échéance de l'intégration
                  </p>
                </div>
              </div>
            </div>

            {/* Notes de renouvellement */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📝</span>
                Notes de renouvellement
              </h3>
              
              <div>
                <Label htmlFor="renewal_notes">Notes (optionnel)</Label>
                <textarea
                  id="renewal_notes"
                  value={formData.renewal_notes}
                  onChange={(e) => setFormData({ ...formData, renewal_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Raisons du renouvellement, conditions particulières, objectifs pour la nouvelle période..."
                />
              </div>
            </div>

            {/* Avertissement */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Attention : Renouvellement unique
                  </p>
                  <p className="text-amber-700 dark:text-amber-300">
                    Cette intégration ne peut être renouvelée qu'une seule fois. Assurez-vous que les dates et la période correspondent à vos besoins.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.new_end_date} 
              variant="primary"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Renouvellement...' : '🔄 Renouveler'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}