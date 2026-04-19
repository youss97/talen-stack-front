'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import DatePicker from '@/components/form/date-picker';
import type { CreateInterviewRequest } from '@/types/interview';

interface CreateInterviewSimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationId: string, data: CreateInterviewRequest) => Promise<void>;
  application?: any; // La candidature sélectionnée
  isLoading?: boolean;
}

export default function CreateInterviewSimpleModal({
  isOpen,
  onClose,
  onSubmit,
  application,
  isLoading = false,
}: CreateInterviewSimpleModalProps) {
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    type: 'online' as 'presential' | 'online',
    location: '',
    meeting_link: '',
    title: '',
    notes: '',
    internal_notes: '',
    invitees_emails: [] as string[],
    send_email_automatically: true,
  });

  const [inviteesInput, setInviteesInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        scheduled_date: '',
        scheduled_time: '',
        duration_minutes: 60,
        type: 'online',
        location: '',
        meeting_link: '',
        title: application ? `Entretien - ${application.request?.title || 'Poste'}` : '',
        notes: '',
        internal_notes: '',
        invitees_emails: [],
        send_email_automatically: true,
      });
      setInviteesInput('');
      setError(null);
    }
  }, [isOpen, application]);

  const handleDateChange = (dates: Date[], currentDateString: string) => {
    setFormData({ ...formData, scheduled_date: currentDateString });
  };

  const handleAddInvitee = () => {
    const email = inviteesInput.trim();
    if (email && !formData.invitees_emails.includes(email)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Email invalide");
        return;
      }
      setFormData(prev => ({
        ...prev,
        invitees_emails: [...prev.invitees_emails, email]
      }));
      setInviteesInput('');
      setError(null);
    }
  };

  const handleRemoveInvitee = (email: string) => {
    setFormData(prev => ({
      ...prev,
      invitees_emails: prev.invitees_emails.filter(e => e !== email)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!application) {
      setError('Aucune candidature sélectionnée');
      return;
    }

    if (!formData.scheduled_date || !formData.scheduled_time) {
      setError('La date et l\'heure sont requises');
      return;
    }

    if (formData.duration_minutes < 15) {
      setError('La durée minimale est de 15 minutes');
      return;
    }

    if (formData.type === 'presential' && !formData.location.trim()) {
      setError('Le lieu est requis pour un entretien présentiel');
      return;
    }

    if (formData.type === 'online' && !formData.meeting_link.trim()) {
      setError('Le lien de réunion est requis pour un entretien en ligne');
      return;
    }

    // Combiner date et heure
    const scheduledDate = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
    
    // Vérifier que la date est dans le futur
    if (scheduledDate <= new Date()) {
      setError('La date de l\'entretien doit être dans le futur');
      return;
    }

    try {
      const createData: CreateInterviewRequest = {
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: formData.duration_minutes,
        type: formData.type,
        location: formData.type === 'presential' ? formData.location : undefined,
        meeting_link: formData.type === 'online' ? formData.meeting_link : undefined,
        notes: formData.notes.trim() || undefined,
        title: formData.title.trim() || undefined,
        internal_notes: formData.internal_notes.trim() || undefined,
        invitees_emails: formData.invitees_emails.length > 0 ? formData.invitees_emails : undefined,
        send_email_automatically: formData.send_email_automatically,
      };

      console.log('Données entretien envoyées:', createData);
      await onSubmit(application.id, createData);
      onClose();
    } catch (error: any) {
      console.error('Erreur:', error);
      setError(error?.message || 'Erreur lors de la création de l\'entretien');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <span className="text-2xl">📅</span>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Organiser un entretien
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section Candidature - Informations affichées */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👤</span>
                Candidature sélectionnée
              </h3>
              
              {application && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Informations de la candidature
                      </p>
                      <p className="text-blue-700 dark:text-blue-300 mt-1">
                        <strong>Candidat:</strong> {application.cv?.candidate_first_name} {application.cv?.candidate_last_name}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Email:</strong> {application.cv?.candidate_email}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Recrutement:</strong> {application.request?.title} ({application.request?.reference})
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Client:</strong> {application.request?.client?.name}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Responsable RH:</strong> {currentUser?.first_name} {currentUser?.last_name} (utilisateur connecté)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section Date et Heure */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📅</span>
                Planification
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <DatePicker
                    id="scheduled_date"
                    label="Date *"
                    placeholder="Sélectionner une date"
                    onChange={handleDateChange}
                    defaultDate={formData.scheduled_date || undefined}
                  />
                </div>

                <div>
                  <Label htmlFor="scheduled_time">
                    Heure <span className="text-red-500">*</span>
                  </Label>
                  <input
                    id="scheduled_time"
                    type="time"
                    required
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="duration_minutes">
                    Durée (minutes) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    placeholder="60"
                  />
                </div>
              </div>
            </div>

            {/* Section Titre */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📝</span>
                Titre et Description
              </h3>
              
              <div>
                <Label htmlFor="title">Titre de l'entretien</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Entretien technique - Développeur Full Stack"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le titre sera utilisé dans l'objet de l'email d'invitation
                </p>
              </div>
            </div>

            {/* Section Type et Lieu */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📍</span>
                Type et Lieu
              </h3>
              
              <div>
                <Label>Type d'entretien <span className="text-red-500">*</span></Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="online"
                      checked={formData.type === 'online'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'online' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      🌐 En ligne
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="presential"
                      checked={formData.type === 'presential'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'presential' })}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      📍 Présentiel
                    </span>
                  </label>
                </div>
              </div>

              {formData.type === 'presential' ? (
                <div>
                  <Label htmlFor="location">
                    Lieu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    required={formData.type === 'presential'}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: 123 Rue de la Paix, Paris"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="meeting_link">
                    Lien de réunion <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="meeting_link"
                    type="url"
                    required={formData.type === 'online'}
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="Ex: https://meet.google.com/abc-defg-hij"
                  />
                </div>
              )}
            </div>

            {/* Section Notes */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📋</span>
                Notes
              </h3>
              
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Entretien technique avec l'équipe de développement"
                />
              </div>

              <div>
                <Label htmlFor="internal_notes">Notes internes - Équipe RH uniquement (optionnel)</Label>
                <textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Candidat recommandé par le manager, profil prioritaire..."
                />
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">🔒</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Ces notes ne sont visibles que par l'équipe RH et ne seront pas partagées avec le candidat ou les invités.
                  </p>
                </div>
              </div>
            </div>

            {/* Section Invités */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span>
                Invités
              </h3>
              
              <div>
                <Label htmlFor="invitees_input">Inviter des personnes (optionnel)</Label>
                <div className="flex gap-2">
                  <input
                    id="invitees_input"
                    type="email"
                    value={inviteesInput}
                    onChange={(e) => setInviteesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInvitee())}
                    placeholder="Email de la personne à inviter"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button type="button" onClick={handleAddInvitee} variant="outline">
                    Ajouter
                  </Button>
                </div>
                {formData.invitees_emails.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.invitees_emails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvitee(email)}
                          className="hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section Email */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📧</span>
                Notification
              </h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="send_email_automatically"
                  checked={formData.send_email_automatically}
                  onChange={(e) => setFormData({ ...formData, send_email_automatically: e.target.checked })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <label htmlFor="send_email_automatically" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Envoyer automatiquement un email au candidat et aux invités
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" onClick={onClose} variant="outline" className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.scheduled_date || !application} 
                variant="primary"
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Création...' : 'Organiser l\'entretien'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}