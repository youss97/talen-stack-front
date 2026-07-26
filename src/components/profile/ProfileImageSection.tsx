'use client';

import React, { useState } from 'react';
import AvatarUpload from '../upload/AvatarUpload';
import CloudinaryUpload from '../upload/CloudinaryUpload';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import { ImagePlus, Trash2, X } from 'lucide-react';

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
                <ImagePlus
                  className="w-4 h-4 mr-2 icon-glow"
                  size={16}
                  strokeWidth={1.8}
                />
                Changer la photo
              </button>
              
              {currentAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2
                    className="w-4 h-4 mr-2 icon-glow"
                    size={16}
                    strokeWidth={1.8}
                  />
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
                  <X className="w-6 h-6 icon-glow" size={24} strokeWidth={1.8} />
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