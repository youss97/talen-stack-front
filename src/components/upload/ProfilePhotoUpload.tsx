'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  entityType: 'user' | 'admin' | 'manager' | 'candidate';
  entityId: string;
  currentPhoto?: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
  size?: number;
  className?: string;
  label?: string;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  entityType,
  entityId,
  currentPhoto,
  onPhotoUpdate,
  size = 120,
  className = '',
  label = 'Photo de profil'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('entityType', entityType);
      formData.append('entityId', entityId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/profile-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      if (result.success && result.data.url) {
        onPhotoUpdate(result.data.url);
        setPreviewUrl(null);
        toast.success('Photo mise à jour avec succès !');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image');
      return;
    }

    // Validation de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Créer une preview locale
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    handlePhotoUpload(file);
  };

  const displayPhoto = previewUrl || currentPhoto;

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="relative rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100"
        style={{ width: size, height: size }}
      >
        {displayPhoto ? (
          <Image
            src={displayPhoto}
            alt={label}
            fill
            className="object-cover"
            sizes={`${size}px`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg
              className="w-1/2 h-1/2 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Input file caché */}
      <input
        type="file"
        id={`photo-upload-${entityType}-${entityId}`}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Bouton d'upload overlay */}
      <label
        htmlFor={`photo-upload-${entityType}-${entityId}`}
        className="absolute inset-0 rounded-full cursor-pointer group"
      >
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-full flex items-center justify-center">
          <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>
      </label>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;