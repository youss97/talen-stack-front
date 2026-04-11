'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import type { Recruiter } from '@/types/recruiter';

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { subject: string; message: string; recipients: ('candidate' | 'client')[] }) => Promise<void>;
  selectedCandidates: Recruiter[];
  isLoading?: boolean;
}

export default function BulkEmailModal({
  isOpen,
  onClose,
  onSend,
  selectedCandidates,
  isLoading = false,
}: BulkEmailModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipients: ['candidate'] as ('candidate' | 'client')[],
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.subject.trim()) {
      setError('Le sujet est requis');
      return;
    }

    if (!formData.message.trim()) {
      setError('Le message est requis');
      return;
    }

    if (formData.recipients.length === 0) {
      setError('Veuillez sélectionner au moins un destinataire');
      return;
    }

    try {
      await onSend(formData);
      onClose();
      // Reset form
      setFormData({
        subject: '',
        message: '',
        recipients: ['candidate'],
      });
    } catch (error: any) {
      setError(error?.message || 'Erreur lors de l\'envoi des emails');
    }
  };

  const handleRecipientChange = (recipient: 'candidate' | 'client', checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipient]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        recipients: prev.recipients.filter(r => r !== recipient)
      }));
    }
  };

  const candidateCount = selectedCandidates.length;
  const clientCount = new Set(selectedCandidates.map(c => c.request?.client?.id).filter(Boolean)).size;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">📧</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Envoyer un email groupé
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

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Candidatures sélectionnées :</strong> {candidateCount}
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Clients concernés :</strong> {clientCount}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destinataires */}
          <div>
            <Label>Destinataires</Label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recipients.includes('candidate')}
                  onChange={(e) => handleRecipientChange('candidate', e.target.checked)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Candidats ({candidateCount})
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.recipients.includes('client')}
                  onChange={(e) => handleRecipientChange('client', e.target.checked)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Clients ({clientCount})
                </span>
              </label>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <Label htmlFor="subject">
              Sujet <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Mise à jour sur votre candidature"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="message"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              placeholder="Votre message..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" onClick={onClose} variant="outline">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Envoyer'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}