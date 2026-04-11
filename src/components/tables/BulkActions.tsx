'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/modal/ConfirmModal';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkEmail: () => void;
  isDeleting?: boolean;
}

export default function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkEmail,
  isDeleting = false,
}: BulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      // L'erreur sera gérée par le composant parent
    }
  };

  return (
    <>
      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
              {selectedCount} candidature{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 underline"
            >
              Tout désélectionner
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkEmail}
              className="flex items-center gap-2"
            >
              <EmailIcon />
              Envoyer email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <TrashIcon />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Supprimer les candidatures"
        message={`Êtes-vous sûr de vouloir supprimer ${selectedCount} candidature${selectedCount > 1 ? 's' : ''} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3.75H15C15.8284 3.75 16.5 4.42157 16.5 5.25V12.75C16.5 13.5784 15.8284 14.25 15 14.25H3C2.17157 14.25 1.5 13.5784 1.5 12.75V5.25C1.5 4.42157 2.17157 3.75 3 3.75Z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M16.5 5.25L9 10.125L1.5 5.25"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.75 2.25H11.25M2.25 4.5H15.75M14.25 4.5L13.724 12.3895C13.6451 13.5732 13.6057 14.165 13.3537 14.6138C13.1317 15.0088 12.794 15.3265 12.3861 15.5241C11.9211 15.75 11.328 15.75 10.1419 15.75H7.85811C6.67198 15.75 6.07892 15.75 5.61387 15.5241C5.20596 15.3265 4.86828 15.0088 4.64631 14.6138C4.39426 14.165 4.35485 13.5732 4.27602 12.3895L3.75 4.5M7.5 7.875V11.625M10.5 7.875V11.625"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}