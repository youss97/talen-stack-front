"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recipients: ('candidate' | 'client')[], subject: string, message: string) => Promise<void>;
  isLoading?: boolean;
  candidateEmail?: string;
  clientEmail?: string;
  candidateName?: string;
  clientName?: string;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  candidateEmail,
  clientEmail,
  candidateName,
  clientName,
}: SendEmailModalProps) {
  const [recipients, setRecipients] = useState<('candidate' | 'client')[]>(['candidate']);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRecipientToggle = (recipient: 'candidate' | 'client') => {
    setRecipients(prev => {
      if (prev.includes(recipient)) {
        // Retirer le destinataire (mais garder au moins un)
        const newRecipients = prev.filter(r => r !== recipient);
        return newRecipients.length > 0 ? newRecipients : prev;
      } else {
        // Ajouter le destinataire
        return [...prev, recipient];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subject.trim() || !message.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (recipients.length === 0) {
      setError("Veuillez sélectionner au moins un destinataire");
      return;
    }

    if (recipients.includes('candidate') && !candidateEmail) {
      setError("Email du candidat non disponible");
      return;
    }

    if (recipients.includes('client') && !clientEmail) {
      setError("Email du client non disponible");
      return;
    }

    try {
      await onSubmit(recipients, subject, message);
      setSubject("");
      setMessage("");
      setRecipients(['candidate']);
    } catch (err) {
      setError("Erreur lors de l'envoi de l'email");
    }
  };

  const getRecipientEmails = () => {
    return recipients.map(r => r === 'candidate' ? candidateEmail : clientEmail).filter(Boolean).join(', ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 sm:p-8 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Envoyer un email
          </h2>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Sélection des destinataires (checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destinataires (vous pouvez sélectionner plusieurs)
            </label>
            <div className="space-y-2">
              {candidateEmail && (
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={recipients.includes('candidate')}
                    onChange={() => handleRecipientToggle('candidate')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Candidat
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {candidateName && <span>{candidateName} - </span>}
                      {candidateEmail}
                    </div>
                  </div>
                </label>
              )}

              {clientEmail && (
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={recipients.includes('client')}
                    onChange={() => handleRecipientToggle('client')}
                    className="w-4 h-4 text-brand-600 focus:ring-brand-500 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Client
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {clientName && <span>{clientName} - </span>}
                      {clientEmail}
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Aperçu des destinataires */}
          {recipients.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Email sera envoyé à:</span> {getRecipientEmails()}
              </p>
            </div>
          )}

          {/* Sujet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-11 appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              placeholder="Ex: Mise à jour sur votre candidature"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              placeholder="Écrivez votre message ici..."
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Le message sera envoyé tel quel aux destinataires sélectionnés
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Envoi..." : "Envoyer l'email"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
