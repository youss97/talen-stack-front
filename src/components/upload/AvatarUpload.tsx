'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import CloudinaryUpload from './CloudinaryUpload';
import toast from 'react-hot-toast';
import { ImagePlus, Camera, Check } from 'lucide-react';

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
              <Camera
                className="w-4 h-4 text-white icon-glow"
                size={16}
                strokeWidth={1.8}
              />
            </div>
          </div>
        </CloudinaryUpload>
      </div>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-1">
          <Check className="w-4 h-4 icon-glow" size={16} strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;