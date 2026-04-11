"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/ui/datepicker/DatePicker";
import type { CreateInterviewRequest, UpdateInterviewRequest } from "@/types/interview";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInterviewRequest | UpdateInterviewRequest) => Promise<void>;
  isLoading?: boolean;
  candidateEmail?: string;
  candidateName?: string;
  existingInterview?: any; // Interview existant pour la modification
}

export default function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  candidateEmail,
  candidateName,
  existingInterview,
}: ScheduleInterviewModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState<'presential' | 'online'>('online');
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [inviteesInput, setInviteesInput] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [error, setError] = useState("");

  // Pré-remplir le formulaire si on modifie un entretien existant
  useEffect(() => {
    if (existingInterview && isOpen) {
      const scheduledDate = new Date(existingInterview.scheduled_date);
      setDate(scheduledDate.toISOString().split('T')[0]);
      setTime(scheduledDate.toTimeString().slice(0, 5));
      setDuration(existingInterview.duration_minutes || 60);
      setType(existingInterview.type || 'online');
      setLocation(existingInterview.location || '');
      setMeetingLink(existingInterview.meeting_link || '');
      setNotes(existingInterview.notes || '');
      setTitle(existingInterview.title || '');
      setInternalNotes(existingInterview.internal_notes || '');
      setInvitees(existingInterview.invitees_emails || []);
      setSendEmail(false); // Ne pas renvoyer d'email par défaut lors de la modification
    } else if (isOpen && !existingInterview) {
      // Reset form pour un nouvel entretien
      setDate("");
      setTime("");
      setDuration(60);
      setType('online');
      setLocation("");
      setMeetingLink("");
      setNotes("");
      setTitle("");
      setInternalNotes("");
      setInvitees([]);
      setSendEmail(true);
    }
  }, [existingInterview, isOpen]);

  const handleAddInvitee = () => {
    const email = inviteesInput.trim();
    if (email && !invitees.includes(email)) {
      // Validation email simple
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

    // Créer le payload selon le contexte (création vs modification)
    if (existingInterview) {
      // Payload pour la modification (UpdateInterviewRequest)
      const updateData: UpdateInterviewRequest = {
        scheduled_date: scheduledDate.toISOString(),
        duration_minutes: duration,
        type,
        location: type === 'presential' ? location : undefined,
        meeting_link: type === 'online' ? meetingLink : undefined,
        notes: notes.trim() || undefined,
        title: title.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
        invitees_emails: invitees.length > 0 ? invitees : undefined,
      };

      try {
        await onSubmit(updateData);
        // Reset form
        setDate("");
        setTime("");
        setDuration(60);
        setType('online');
        setLocation("");
        setMeetingLink("");
        setNotes("");
        setTitle("");
        setInternalNotes("");
        setInvitees([]);
        setSendEmail(true);
      } catch (err) {
        setError("Erreur lors de la modification de l'entretien");
      }
    } else {
      // Payload pour la création (CreateInterviewRequest)
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
        await onSubmit(createData);
        // Reset form
        setDate("");
        setTime("");
        setDuration(60);
        setType('online');
        setLocation("");
        setMeetingLink("");
        setNotes("");
        setTitle("");
        setInternalNotes("");
        setInvitees([]);
        setSendEmail(true);
      } catch (err) {
        setError("Erreur lors de la création de l'entretien");
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {existingInterview ? "✏️ Modifier l'entretien" : "📅 Organiser un entretien"}
          </h2>
          {candidateName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Avec {candidateName} ({candidateEmail})
            </p>
          )}
        </div>

        <div className="px-6 sm:p-8 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

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

          {/* Lieu (si présentiel) */}
          {type === 'presential' && (
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
          )}

          {/* Lien Meet (si en ligne) */}
          {type === 'online' && (
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

          {/* Notes internes (visibles seulement par l'équipe RH) */}
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

          {/* Envoyer email automatiquement - seulement lors de la création */}
          {!existingInterview && (
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
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 
              (existingInterview ? "Modification..." : "Création...") : 
              (existingInterview ? "Modifier l'entretien" : "Organiser l'entretien")
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
