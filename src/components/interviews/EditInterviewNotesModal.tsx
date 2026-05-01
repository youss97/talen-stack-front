"use client";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import type { Interview } from "@/types/interview";

interface EditInterviewNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { notes?: string; title?: string; internal_notes?: string }) => Promise<void>;
  isLoading?: boolean;
  interview: Interview | null;
}

export default function EditInterviewNotesModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  interview,
}: EditInterviewNotesModalProps) {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [error, setError] = useState("");

  // Pré-remplir les notes existantes
  useEffect(() => {
    if (interview && isOpen) {
      setNotes(interview.notes || "");
      setTitle(interview.title || "");
      setInternalNotes(interview.internal_notes || "");
    } else if (isOpen && !interview) {
      setNotes("");
      setTitle("");
      setInternalNotes("");
    }
  }, [interview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await onSubmit({
        notes: notes.trim() || undefined,
        title: title.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError("Erreur lors de la modification");
    }
  };

  if (!interview) return null;

  const interviewDateRaw = interview.scheduled_date ? new Date(interview.scheduled_date) : null;
  const interviewDate = interviewDateRaw && !isNaN(interviewDateRaw.getTime()) ? interviewDateRaw : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            ✏️ Modifier l'entretien
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {interviewDate ? `Entretien du ${interviewDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })} à ${interviewDate.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}` : 'Modifier l\'entretien'}
          </p>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Informations de l'entretien (lecture seule) */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {interview.type === 'online' ? '🌐 En ligne' : '📍 Présentiel'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Durée:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {interview.duration_minutes} min
                </span>
              </div>
            </div>
            
            {interview.location && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lieu:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {interview.location}
                </span>
              </div>
            )}
            
            {interview.meeting_link && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Lien:</span>
                <a 
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Rejoindre la réunion
                </a>
              </div>
            )}

            {interview.invitees_emails && interview.invitees_emails.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Invités:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {interview.invitees_emails.map((email, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded text-xs"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">⚠️</span>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Modification limitée</p>
                <p className="mt-1">
                  Seuls le titre, les notes et les notes internes peuvent être modifiés. Pour changer la date, l'heure ou d'autres détails, 
                  veuillez annuler cet entretien et en créer un nouveau.
                </p>
              </div>
            </div>
          </div>

          {/* Titre de l'entretien */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre de l'entretien
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Entretien technique - Développeur Full Stack"
              className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Le titre sera utilisé dans l'objet des emails
            </p>
          </div>

          {/* Notes - seul champ modifiable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes de l'entretien
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ajoutez des notes sur cet entretien..."
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Un email sera automatiquement envoyé au candidat et aux invités pour les informer de la modification.
            </p>
          </div>

          {/* Notes internes (visibles seulement par l'équipe RH) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes internes - Équipe RH uniquement
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Notes internes visibles seulement par l'équipe RH..."
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
            />
            <div className="flex items-start gap-2 mt-2">
              <span className="text-amber-600 dark:text-amber-400 text-sm">🔒</span>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Ces notes ne sont visibles que par l'équipe RH et ne seront pas partagées avec le candidat ou les invités.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Modification..." : "Modifier l'entretien"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}