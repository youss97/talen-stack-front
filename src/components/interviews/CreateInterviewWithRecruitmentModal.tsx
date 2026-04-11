"use client";
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/datepicker/DatePicker";
import { useGetApplicationRequestsQuery } from "@/lib/services/applicationRequestApi";
import { useGetApplicationsQuery } from "@/lib/services/applicationApi";
import { useGetClientsQuery } from "@/lib/services/clientApi";
import type { CreateInterviewRequest } from "@/types/interview";

interface CreateInterviewWithRecruitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationId: string, data: CreateInterviewRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateInterviewWithRecruitmentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateInterviewWithRecruitmentModalProps) {
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<'presential' | 'online'>('online');
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [inviteesInput, setInviteesInput] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState("");

  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Récupérer les recrutements
  const { data: recruitmentsData, isLoading: recruitmentsLoading } = useGetApplicationRequestsQuery({
    page: 1,
    limit: 1000,
  });

  // Récupérer les candidatures pour le recrutement sélectionné
  const { data: applicationsData, isLoading: applicationsLoading } = useGetApplicationsQuery({
    page: 1,
    limit: 1000,
    request_id: selectedRecruitmentId || undefined,
  }, {
    skip: !selectedRecruitmentId,
  });

  // Récupérer les clients
  const { data: clientsData } = useGetClientsQuery({
    page: 1,
    limit: 1000,
  });

  const recruitments = recruitmentsData?.data || [];
  const applications = applicationsData?.data || [];
  const clients = clientsData?.data || [];

  // Trouver le recrutement sélectionné
  const selectedRecruitment = recruitments.find(r => r.id === selectedRecruitmentId);
  
  // Trouver le client lié au recrutement
  const linkedClient = selectedRecruitment ? 
    clients.find(c => c.id === selectedRecruitment.client?.id) : null;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRecruitmentId("");
      setSelectedApplicationId("");
      setDate("");
      setTime("");
      setDuration(60);
      setType('online');
      setLocation("");
      setMeetingLink("");
      setTitle("");
      setNotes("");
      setInternalNotes("");
      setInvitees([]);
      setSendEmail(true);
      setError("");
    }
  }, [isOpen]);

  // Reset application when recruitment changes
  useEffect(() => {
    setSelectedApplicationId("");
  }, [selectedRecruitmentId]);

  // Auto-fill title when recruitment is selected
  useEffect(() => {
    if (selectedRecruitment && !title) {
      setTitle(`Entretien - ${selectedRecruitment.title}`);
    }
  }, [selectedRecruitment, title]);

  const handleAddInvitee = () => {
    const email = inviteesInput.trim();
    if (email && !invitees.includes(email)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Email invalide");
        return;
      }
      setInvitees([...invitees, email]);
      setInviteesInput("");
      setError("");
    }
  };

  const handleRemoveInvitee = (email: string) => {
    setInvitees(invitees.filter(e => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedRecruitmentId) {
      setError("Veuillez sélectionner un recrutement");
      return;
    }

    if (!selectedApplicationId) {
      setError("Veuillez sélectionner une candidature");
      return;
    }

    if (!date || !time) {
      setError("La date et l'heure sont requises");
      return;
    }

    if (duration < 15) {
      setError("La durée minimale est de 15 minutes");
      return;
    }

    if (type === 'presential' && !location.trim()) {
      setError("Le lieu est requis pour un entretien présentiel");
      return;
    }

    if (type === 'online' && !meetingLink.trim()) {
      setError("Le lien de réunion est requis pour un entretien en ligne");
      return;
    }

    // Combiner date et heure
    const scheduledDate = new Date(`${date}T${time}`);
    
    // Vérifier que la date est dans le futur
    if (scheduledDate <= new Date()) {
      setError("La date de l'entretien doit être dans le futur");
      return;
    }

    const createData: CreateInterviewRequest = {
      scheduled_date: scheduledDate.toISOString(),
      duration_minutes: duration,
      type,
      location: type === 'presential' ? location : undefined,
      meeting_link: type === 'online' ? meetingLink : undefined,
      notes: notes.trim() || undefined,
      title: title.trim() || undefined,
      internal_notes: internalNotes.trim() || undefined,
      invitees_emails: invitees.length > 0 ? invitees : undefined,
      send_email_automatically: sendEmail,
    };

    try {
      await onSubmit(selectedApplicationId, createData);
      onClose();
    } catch (err) {
      setError("Erreur lors de la création de l'entretien");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📅</span>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Organiser un entretien
            </h2>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Section Recrutement */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              Recrutement
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sélectionner un recrutement <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRecruitmentId}
                onChange={(e) => setSelectedRecruitmentId(e.target.value)}
                className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                required
                disabled={recruitmentsLoading}
              >
                <option value="">
                  {recruitmentsLoading ? 'Chargement...' : 'Choisir un recrutement'}
                </option>
                {recruitments.map((recruitment) => (
                  <option key={recruitment.id} value={recruitment.id}>
                    {recruitment.reference} - {recruitment.title} ({recruitment.client?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Informations du recrutement sélectionné */}
            {selectedRecruitment && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">ℹ️</span>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {selectedRecruitment.title}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Client: {linkedClient?.name || 'Non défini'}
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      Référence: {selectedRecruitment.reference}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Candidature */}
          {selectedRecruitmentId && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👤</span>
                Candidature
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner une candidature <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedApplicationId}
                  onChange={(e) => setSelectedApplicationId(e.target.value)}
                  className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  required
                  disabled={applicationsLoading}
                >
                  <option value="">
                    {applicationsLoading ? 'Chargement...' : 'Choisir une candidature'}
                  </option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.cv?.candidate_first_name} {application.cv?.candidate_last_name} 
                      ({application.cv?.candidate_email})
                    </option>
                  ))}
                </select>
                
                {applications.length === 0 && selectedRecruitmentId && !applicationsLoading && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Aucune candidature trouvée pour ce recrutement
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reste du formulaire - seulement si une candidature est sélectionnée */}
          {selectedApplicationId && (
            <>
              {/* Date et Heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    placeholder="Sélectionner une date"
                    minDate={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    required
                  />
                </div>
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Durée (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min={15}
                  step={15}
                  className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  required
                />
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre de l'entretien (optionnel)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Entretien technique - Développeur Full Stack"
                  className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le titre sera utilisé dans l'objet de l'email d'invitation
                </p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d'entretien <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="online"
                      checked={type === 'online'}
                      onChange={(e) => setType(e.target.value as 'online')}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500"
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
                      checked={type === 'presential'}
                      onChange={(e) => setType(e.target.value as 'presential')}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      📍 Présentiel
                    </span>
                  </label>
                </div>
              </div>

              {/* Lieu ou lien selon le type */}
              {type === 'presential' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lieu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: 123 Rue de la Paix, Paris"
                    className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    required={type === 'presential'}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lien de réunion <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Ex: https://meet.google.com/abc-defg-hij"
                    className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    required={type === 'online'}
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Entretien technique avec l'équipe de développement"
                  className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
              </div>

              {/* Notes internes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes internes - Équipe RH uniquement (optionnel)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Candidat recommandé par le manager, profil prioritaire..."
                  className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
                <div className="flex items-start gap-2 mt-2">
                  <span className="text-amber-600 dark:text-amber-400 text-sm">🔒</span>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Ces notes ne sont visibles que par l'équipe RH et ne seront pas partagées avec le candidat ou les invités.
                  </p>
                </div>
              </div>

              {/* Invités */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Inviter des personnes (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteesInput}
                    onChange={(e) => setInviteesInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInvitee())}
                    placeholder="Email de la personne à inviter"
                    className="flex-1 h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                  <Button type="button" onClick={handleAddInvitee} variant="outline">
                    Ajouter
                  </Button>
                </div>
                {invitees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {invitees.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveInvitee(email)}
                          className="hover:text-brand-900 dark:hover:text-brand-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Envoyer email automatiquement */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                />
                <label htmlFor="sendEmail" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Envoyer automatiquement un email au candidat
                </label>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !selectedApplicationId} 
          >
            {isLoading ? "Création..." : "Organiser l'entretien"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}