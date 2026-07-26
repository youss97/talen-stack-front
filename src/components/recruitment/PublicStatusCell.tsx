'use client';

import { Eye, Lock } from "lucide-react";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ApplicationRequest } from '@/types/applicationRequest';

interface PublicStatusCellProps {
  row: ApplicationRequest;
  optimisticState: boolean | undefined;
  onToggle: (id: string, newState: boolean) => Promise<void>;
}

export default function PublicStatusCell({ row, optimisticState, onToggle }: PublicStatusCellProps) {
  const t = useTranslations('recruitmentRequests');
  const [isLoading, setIsLoading] = useState(false);
  
  // Utiliser l'état optimiste si disponible, sinon l'état du serveur
  const isPublic = optimisticState !== undefined ? optimisticState : (row.is_public || false);
  
  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      await onToggle(row.id, !isPublic);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isPublic) {
    // Offre publique - TOUJOURS afficher l'interface publique si is_public est true
    return (
      <div className="flex flex-col gap-2">
        {/* Badge statut */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <Eye size={16} strokeWidth={1.8} className="icon-glow" />
          ✓ {t('publicOffer.publicBadge')}
        </div>

        {/* Infos - afficher même si public_slug n'est pas encore généré */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            👁️ {t('publicOffer.viewsCount', { count: row.public_views_count || 0 })}
          </span>
        </div>

        {/* Bouton désactiver */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors disabled:opacity-50"
        >
          <Lock size={12} strokeWidth={1.8} className="icon-glow" />
          {isLoading ? t('publicOffer.makePrivateLoading') : t('publicOffer.makePrivate')}
        </button>
      </div>
    );
  }
  
  // Offre privée
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 hover:scale-105 transition-all disabled:opacity-50"
    >
      <Eye size={16} strokeWidth={1.8} className="icon-glow" />
      {isLoading ? t('publicOffer.makePublicLoading') : `🌐 ${t('publicOffer.makePublic')}`}
    </button>
  );
}
