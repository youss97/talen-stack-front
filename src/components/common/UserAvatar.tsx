'use client';

import React, { useState, useEffect } from 'react';
import CloudinaryImage from './CloudinaryImage';
import { getUserAvatarUrl, isCloudinaryUrl } from '@/utils/imageHelper';

interface UserAvatarProps {
  user?: {
    photo_path?: string | null;
    first_name?: string;
  };
  size?: number;
  className?: string;
  showFallback?: boolean;
}

/**
 * Composant Avatar utilisateur qui gère automatiquement les images Cloudinary et locales
 */
const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 44,
  className = '',
  showFallback = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  
  const imageUrl = getUserAvatarUrl(user);
  const fallbackLetter = user?.first_name?.charAt(0)?.toUpperCase() || 'U';

  // Réinitialiser l'erreur quand l'URL change
  useEffect(() => {
    setImageError(false);
    setImageKey(prev => prev + 1);
  }, [imageUrl]);

  const containerClasses = `
    overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 
    flex items-center justify-center
    ${className}
  `.trim();

  const containerStyle = {
    width: size,
    height: size,
  };

  const handleImageError = () => {
    console.warn('❌ Erreur chargement image:', imageUrl);
    setImageError(true);
  };

  if (!imageUrl || imageError) {
    return (
      <div className={containerClasses} style={containerStyle}>
        {showFallback && (
          <span 
            className="font-medium text-gray-600 dark:text-gray-300"
            style={{ fontSize: size * 0.4 }}
          >
            {fallbackLetter}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={containerClasses} style={containerStyle}>
      {isCloudinaryUrl(imageUrl) ? (
        <CloudinaryImage
          key={imageKey}
          src={imageUrl}
          alt="Avatar utilisateur"
          width={size}
          height={size}
          className="w-full h-full object-cover"
          crop="fill"
          gravity="face"
          quality="auto"
          format="auto"
          fallback={`data:image/svg+xml;base64,${btoa(`
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="#e5e7eb"/>
              <text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-size="${size * 0.4}" fill="#6b7280">${fallbackLetter}</text>
            </svg>
          `)}`}
        />
      ) : (
        <img
          key={imageKey}
          src={imageUrl}
          alt="Avatar utilisateur"
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      )}
    </div>
  );
};

export default UserAvatar;