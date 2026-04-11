'use client';

import { useRouter } from 'next/navigation';
import { useTogglePublicJobOfferActiveMutation } from '@/lib/services/publicJobOfferApi';

interface PublicOfferToggleSimpleProps {
  requestId: string;
  isPublic: boolean;
  publicSlug?: string;
  viewsCount?: number;
  onToggle?: () => void;
}

export default function PublicOfferToggleSimple({
  requestId,
  isPublic,
  publicSlug,
  viewsCount = 0,
  onToggle,
}: PublicOfferToggleSimpleProps) {
  const router = useRouter();
  const [togglePublic, { isLoading }] = useTogglePublicJobOfferActiveMutation();

  const handleToggle = async () => {
    if (isLoading) return;
    
    try {
      await togglePublic(requestId).unwrap();
      
      // Appeler le callback pour refetch
      if (onToggle) {
        onToggle();
      }
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut: ' + (error?.data?.message || 'Erreur inconnue'));
    }
  };

  const handleViewQRCode = () => {
    router.push(`/public-offers/${requestId}`);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Switch - utilise directement la prop isPublic */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={handleToggle}
          disabled={isLoading}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
      </label>

      {/* Badge et actions si publique */}
      {isPublic && publicSlug && (
        <div className="flex items-center gap-2">
          {/* Badge avec vues */}
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            👁️ {viewsCount} vues
          </span>

          {/* Bouton QR Code */}
          <button
            onClick={handleViewQRCode}
            className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
            title="Voir le QR Code"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            QR Code
          </button>
        </div>
      )}
    </div>
  );
}
