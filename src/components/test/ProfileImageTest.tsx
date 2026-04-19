'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import CloudinaryImage from '../common/CloudinaryImage';

const ProfileImageTest = () => {
  const user = useSelector((state: RootState) => state.auth.user) as any;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Debug - Image de Profil</h3>
      
      <div className="space-y-4">
        <div>
          <strong>Utilisateur ID:</strong> {user?.id}
        </div>
        
        <div>
          <strong>Champ image:</strong> 
          <code className="ml-2 p-1 bg-gray-100 rounded text-sm">
            {user?.image || 'null'}
          </code>
        </div>
        
        <div>
          <strong>Type de l'image:</strong> {typeof user?.image}
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <strong>Image actuelle:</strong>
            <div className="mt-2">
              {user?.image ? (
                <CloudinaryImage
                  src={user.image}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="rounded-full"
                  crop="fill"
                  gravity="face"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500">Pas d'image</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <strong>Objet utilisateur complet:</strong>
          <pre className="text-xs mt-2 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageTest;