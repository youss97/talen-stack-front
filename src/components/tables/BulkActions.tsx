'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Trash2, UserPlus } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import ConfirmModal from '@/components/ui/modal/ConfirmModal';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<void>;
  onBulkEmail: () => void;
  onBulkAssign?: () => void;
  isDeleting?: boolean;
}

export default function BulkActions({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkEmail,
  onBulkAssign,
  isDeleting = false,
}: BulkActionsProps) {
  const t = useTranslations('common.bulkActions');
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
              {t('selectedCount', { count: selectedCount })}
            </span>
            <button
              onClick={onClearSelection}
              className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-200 underline"
            >
              {t('clearSelection')}
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
              {t('sendEmail')}
            </Button>
            {onBulkAssign && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkAssign}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <AssignIcon />
                {t('assign')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <TrashIcon />
              {t('delete')}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={t('deleteTitle')}
        message={t('deleteMessage', { count: selectedCount })}
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}

function EmailIcon() {
  return <Mail size={16} strokeWidth={1.8} className="icon-glow" />;
}

function TrashIcon() {
  return <Trash2 size={16} strokeWidth={1.8} className="icon-glow" />;
}

function AssignIcon() {
  return <UserPlus size={16} strokeWidth={1.8} className="icon-glow" />;
}