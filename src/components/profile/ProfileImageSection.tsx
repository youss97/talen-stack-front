'use client';

import React, { useState } from 'react';
import AvatarUpload from '../upload/AvatarUpload';
import CloudinaryUpload from '../upload/CloudinaryUpload';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';

interface ProfileImageSectionProps {
  userId: string;
  currentAvatar?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  canEdit?: boolean;
}

const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({
  userId,
  currentAvatar,
  onAvatarUpdate,
  canEdit = true
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { deleteFile } = useCloudinaryUpload();

  const handleRemoveAvatar = async () => {
    if (!currentAvatar) return;

    // Extraire le public_id de l'URL Cloudinary
    const publicIdMatch = currentAvatar.match(/\/([^\/]+)\.[^.]+$/);
    if (publicIdMatch) {
      const publicId = publicIdMatch[1];
      const success = await deleteFile(publicId, 'image');
      
      if (success) {
        onAvatarUpdate('');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Photo de profil
      </h3>
      
      <div className="flex items-center space-x-6">
        <AvatarUpload
          userId={userId}
          currentAvatar={currentAvatar}
          onAvatarUpdate={onAvatarUpdate}
          size={120}
        />
        
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Recommandations
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Format: JPG, PNG, GIF ou WebP</li>
            <li>• Taille maximale: 5MB</li>
            <li>• Dimensions recommandées: 400x400px minimum</li>
            <li>• L'image sera automatiquement redimensionnée et optimisée</li>
          </ul>
          
          {canEdit && (
            <div className="mt-4 space-x-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Changer la photo
              </button>
              
              {currentAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'upload avancé */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Uploader une nouvelle photo
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <CloudinaryUpload
                onUploadSuccess={(url) => {
                  onAvatarUpdate(url);
                  setShowUploadModal(false);
                }}
                folder="users/avatars"
                acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                maxSize={5 * 1024 * 1024}
                className="mb-4"
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileImageSection;