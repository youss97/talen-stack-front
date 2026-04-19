'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import UserAvatar from '../common/UserAvatar';
import { getUserAvatarUrl } from '@/utils/imageHelper';

export default function ImageMigrationTest() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMigration = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/users/${user.id}/migrate-image-to-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      setMigrationResult(result);
      
      if (response.ok) {
        alert('Migration réussie ! Rechargez la page pour voir les changements.');
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const imageUrl = getUserAvatarUrl(user ?? undefined);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Test de Migration d'Image</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Avatar actuel:</h3>
          <UserAvatar user={user ?? undefined} size={80} />
        </div>

        <div className="text-sm space-y-1">
          <p><strong>ID Utilisateur:</strong> {user?.id}</p>
          <p><strong>Image Cloudinary:</strong> {(user as any)?.image || 'Non définie'}</p>
          <p><strong>Photo Path:</strong> {user?.photo_path || 'Non définie'}</p>
          <p><strong>URL calculée:</strong> {imageUrl || 'Aucune'}</p>
        </div>

        {user?.photo_path && !(user as any)?.image && (
          <button
            onClick={handleMigration}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Migration...' : 'Migrer vers Cloudinary'}
          </button>
        )}

        {migrationResult && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <h4 className="font-semibold mb-2">Résultat de la migration:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(migrationResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}