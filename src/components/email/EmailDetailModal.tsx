"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import type { Email } from "@/types/email";

interface EmailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: Email | null;
  isLoading?: boolean;
}

const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  isOpen,
  onClose,
  email,
  isLoading = false,
}) => {
  if (!email && !isLoading) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"; label: string }> = {
      draft: { color: "light", label: "Brouillon" },
      sent: { color: "success", label: "Envoyé" },
      failed: { color: "error", label: "Échoué" },
      scheduled: { color: "warning", label: "Programmé" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between pr-12 sm:pr-16">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Détails de l'email
            </h2>
            {email && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {email.subject}
              </p>
            )}
          </div>
          {email && (
            <div className="flex-shrink-0 mt-1">
              {getStatusBadge(email.status)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
          </div>
        ) : email ? (
          <div className="space-y-6">
            {/* Expéditeur */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Expéditeur
              </h3>
              <div className="mt-1">
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {email.sender.first_name} {email.sender.last_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {email.sender.email}
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total destinataires
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {email.total_recipients}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Envoyés
                </p>
                <p className="mt-1 text-2xl font-semibold text-green-700 dark:text-green-300">
                  {email.sent_count}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Échoués
                </p>
                <p className="mt-1 text-2xl font-semibold text-red-700 dark:text-red-300">
                  {email.failed_count}
                </p>
              </div>
            </div>

            {/* Destinataires */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Destinataires ({email.recipients.length})
              </h3>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {email.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {recipient}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CC (si présent) */}
            {email.cc && email.cc.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  CC ({email.cc.length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {email.cc.map((cc, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {cc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* BCC (si présent) */}
            {email.bcc && email.bcc.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  BCC ({email.bcc.length})
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {email.bcc.map((bcc, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {bcc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Message
              </h3>
              <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                  {email.body}
                </p>
              </div>
            </div>

            {/* Message d'erreur (si présent) */}
            {email.error_message && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Message d'erreur
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {email.error_message}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date de création
                </h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {email.created_at ? (() => { const d = new Date(email.created_at); return isNaN(d.getTime()) ? '-' : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); })() : '-'}
                </p>
              </div>
              {email.sent_at && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date d'envoi
                  </h3>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {new Date(email.sent_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
};

export default EmailDetailModal;
