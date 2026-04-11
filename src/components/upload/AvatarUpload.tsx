'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import CloudinaryUpload from './CloudinaryUpload';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
  size?: number;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatar,
  onAvatarUpdate,
  size = 120,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAvatarUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/avatar-cloudinary`,
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
      
      if (result.avatar_url) {
        onAvatarUpdate(result.avatar_url);
        setPreviewUrl(null);
        toast.success('Avatar mis à jour avec succès !');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    // Créer une preview locale
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    handleAvatarUpload(file);
  };

  const displayAvatar = previewUrl || currentAvatar;

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="relative rounded-full overflow-hidden border-4 border-white shadow-lg"
        style={{ width: size, height: size }}
      >
        {displayAvatar ? (
          <Image
            src={displayAvatar}
            alt="Avatar"
            fill
            className="object-cover"
            sizes={`${size}px`}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
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

      {/* Bouton d'upload overlay */}
      <div className="absolute inset-0 rounded-full">
        <CloudinaryUpload
          onUploadSuccess={() => {}} // Géré par handleFileSelect
          folder="users/avatars"
          acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
          maxSize={5 * 1024 * 1024} // 5MB
          className="w-full h-full rounded-full border-0 bg-transparent hover:bg-black hover:bg-opacity-20 transition-colors"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-black bg-opacity-60 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
        </CloudinaryUpload>
      </div>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

export default AvatarUpload;