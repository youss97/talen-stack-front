'use client';

import { useState } from 'react';
import type { ApplicationRequest } from '@/types/applicationRequest';

interface PublicStatusCellProps {
  row: ApplicationRequest;
  optimisticState: boolean | undefined;
  onToggle: (id: string, newState: boolean) => Promise<void>;
}

export default function PublicStatusCell({ row, optimisticState, onToggle }: PublicStatusCellProps) {
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
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          ✓ Publique
        </div>
        
        {/* Infos - afficher même si public_slug n'est pas encore généré */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            👁️ {row.public_views_count || 0} vues
          </span>
          {row.public_slug && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/public-offers/${row.id}`, '_blank');
              }}
              className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 font-medium hover:underline"
            >
              📱 QR Code
            </button>
          )}
        </div>
        
        {/* Bouton désactiver */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors disabled:opacity-50"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          {isLoading ? 'Chargement...' : 'Rendre privée'}
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
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
      </svg>
      {isLoading ? 'Activation...' : '🌐 Rendre publique'}
    </button>
  );
}
