'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';

interface EvaluationNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    evaluation_notes: string;
    performance_rating?: number;
    evaluation_date?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  currentNotes?: string;
  currentRating?: number;
  title?: string;
}

export default function EvaluationNotesModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  currentNotes = '',
  currentRating,
  title,
}: EvaluationNotesModalProps) {
  const t = useTranslations('integrations');
  const tc = useTranslations('common');
  const modalTitle = title ?? t('modals.evaluationNotes.defaultTitle');
  const [formData, setFormData] = useState({
    evaluation_notes: '',
    performance_rating: 3,
    evaluation_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        evaluation_notes: currentNotes || '',
        performance_rating: currentRating || 3,
        evaluation_date: new Date().toISOString().split('T')[0],
      });
      setError(null);
    }
  }, [isOpen, currentNotes, currentRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.evaluation_notes.trim()) {
      setError(t('modals.evaluationNotes.errors.noNotes'));
      return;
    }

    try {
      await onSubmit({
        evaluation_notes: formData.evaluation_notes.trim(),
        performance_rating: formData.performance_rating,
        evaluation_date: formData.evaluation_date,
      });
      onClose();
    } catch (error: any) {
      setError(error?.message || t('modals.evaluationNotes.errors.saveFailed'));
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: t('ratingLabels.1'),
      2: t('ratingLabels.2'),
      3: t('ratingLabels.3'),
      4: t('ratingLabels.4'),
      5: t('ratingLabels.5'),
    };
    return labels[rating] || t('ratingLabels.3');
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-600 dark:text-red-400';
    if (rating === 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="text-2xl">📝</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {modalTitle}
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
            {/* Évaluation de performance */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>⭐</span>
                {t('modals.evaluationNotes.performanceSection.title')}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="performance_rating">{t('modals.evaluationNotes.performanceSection.ratingLabel')}</Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      id="performance_rating"
                      min="1"
                      max="5"
                      value={formData.performance_rating}
                      onChange={(e) => setFormData({ ...formData, performance_rating: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <span className="text-2xl">
                        {'⭐'.repeat(formData.performance_rating)}
                        {'☆'.repeat(5 - formData.performance_rating)}
                      </span>
                      <span className={`font-medium ${getRatingColor(formData.performance_rating)}`}>
                        {formData.performance_rating}/5 - {getRatingLabel(formData.performance_rating)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="evaluation_date">{t('modals.evaluationNotes.performanceSection.dateLabel')}</Label>
                  <DatePicker
                    id="evaluation_date"
                    label=""
                    placeholder={t('modals.create.positionSection.datePlaceholder')}
                    onChange={(dates, currentDateString) => {
                      setFormData({ ...formData, evaluation_date: currentDateString });
                    }}
                    defaultDate={formData.evaluation_date || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Notes détaillées */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span>📋</span>
                {t('modals.evaluationNotes.notesSection.title')}
              </h3>

              <div>
                <Label htmlFor="evaluation_notes">{t('modals.evaluationNotes.notesSection.label')} *</Label>
                <textarea
                  id="evaluation_notes"
                  value={formData.evaluation_notes}
                  onChange={(e) => setFormData({ ...formData, evaluation_notes: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t('modals.evaluationNotes.notesSection.placeholder')}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('modals.evaluationNotes.notesSection.helper')}
                  </p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {t('modals.evaluationNotes.notesSection.characterCount', { count: formData.evaluation_notes.length })}
                  </span>
                </div>
              </div>
            </div>

            {/* Conseils d'évaluation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {t('modals.evaluationNotes.tipsSection.title')}
                  </p>
                  <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                    <li>{t('modals.evaluationNotes.tipsSection.tip1')}</li>
                    <li>{t('modals.evaluationNotes.tipsSection.tip2')}</li>
                    <li>{t('modals.evaluationNotes.tipsSection.tip3')}</li>
                    <li>{t('modals.evaluationNotes.tipsSection.tip4')}</li>
                    <li>{t('modals.evaluationNotes.tipsSection.tip5')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
              {tc('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.evaluation_notes.trim()}
              variant="primary"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? t('modals.evaluationNotes.saving') : t('modals.evaluationNotes.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}