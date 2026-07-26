'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ImagePlus, Camera, Check } from 'lucide-react';

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
            <ImagePlus
              className="w-1/2 h-1/2 text-gray-400 icon-glow"
              strokeWidth={1.8}
            />
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
            <Camera
              className="w-5 h-5 text-gray-700 icon-glow"
              size={20}
              strokeWidth={1.8}
            />
          </div>
        </div>
      </label>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
          <Check className="w-3 h-3 icon-glow" size={12} strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;