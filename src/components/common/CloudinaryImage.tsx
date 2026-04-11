'use client';

import React from 'react';
import Image from 'next/image';

interface CloudinaryImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad';
  gravity?: 'auto' | 'face' | 'faces' | 'center' | 'north' | 'south' | 'east' | 'west';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  blur?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  fallback?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
}

/**
 * Composant d'image optimisé qui utilise les transformations Cloudinary
 * Génère automatiquement les URLs optimisées selon les paramètres
 */
const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  quality = 'auto',
  crop = 'fill',
  gravity = 'auto',
  format = 'auto',
  blur,
  brightness,
  contrast,
  saturation,
  fallback = '/images/placeholder.jpg',
  sizes,
  priority = false,
  fill = false,
  ...props
}) => {
  // Vérifier si l'URL est déjà une URL Cloudinary
  const isCloudinaryUrl = src?.includes('cloudinary.com') || src?.includes('res.cloudinary.com');
  
  // Si ce n'est pas une URL Cloudinary, utiliser l'image telle quelle avec gestion d'erreur
  if (!isCloudinaryUrl) {
    return (
      <Image
        src={src || fallback}
        alt={alt}
        width={width}
        height={height}
        className={className}
        sizes={sizes}
        priority={priority}
        fill={fill}
        onError={(e) => {
          // Fallback en cas d'erreur
          const target = e.target as HTMLImageElement;
          target.src = fallback;
        }}
        {...props}
      />
    );
  }

  // Construire les paramètres de transformation Cloudinary
  const buildTransformationUrl = (originalUrl: string): string => {
    try {
      // Si l'URL contient déjà des transformations, l'utiliser telle quelle
      if (originalUrl.includes('/upload/w_') || originalUrl.includes('/upload/c_')) {
        return originalUrl;
      }

      // Extraire les parties de l'URL Cloudinary
      const urlParts = originalUrl.split('/upload/');
      if (urlParts.length !== 2) return originalUrl;

      const [baseUrl, pathWithVersion] = urlParts;
      
      // Construire les transformations
      const transformations: string[] = [];

      // Dimensions
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      
      // Crop et gravity
      if (crop) transformations.push(`c_${crop}`);
      if (gravity && crop === 'fill') transformations.push(`g_${gravity}`);
      
      // Qualité et format
      if (quality) transformations.push(`q_${quality}`);
      if (format) transformations.push(`f_${format}`);
      
      // Effets
      if (blur) transformations.push(`e_blur:${blur}`);
      if (brightness) transformations.push(`e_brightness:${brightness}`);
      if (contrast) transformations.push(`e_contrast:${contrast}`);
      if (saturation) transformations.push(`e_saturation:${saturation}`);

      // Construire l'URL finale
      const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
      return `${baseUrl}/upload/${transformationString}${pathWithVersion}`;
      
    } catch (error) {
      console.warn('Erreur lors de la construction de l\'URL Cloudinary:', error);
      return originalUrl;
    }
  };

  const optimizedSrc = buildTransformationUrl(src);

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      fill={fill}
      onError={(e) => {
        // Fallback en cas d'erreur
        const target = e.target as HTMLImageElement;
        target.src = fallback;
      }}
      // Forcer le rechargement en cas de changement d'URL
      key={optimizedSrc}
      {...props}
    />
  );
};

export default CloudinaryImage;

// Hook utilitaire pour générer des URLs Cloudinary
export const useCloudinaryUrl = () => {
  const generateUrl = (
    src: string,
    options: Omit<CloudinaryImageProps, 'src' | 'alt'> = {}
  ): string => {
    if (!src?.includes('cloudinary.com')) return src;

    const {
      width,
      height,
      quality = 'auto',
      crop = 'fill',
      gravity = 'auto',
      format = 'auto',
      blur,
      brightness,
      contrast,
      saturation,
    } = options;

    try {
      const urlParts = src.split('/upload/');
      if (urlParts.length !== 2) return src;

      const [baseUrl, pathWithVersion] = urlParts;
      const transformations: string[] = [];

      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
      if (crop) transformations.push(`c_${crop}`);
      if (gravity && crop === 'fill') transformations.push(`g_${gravity}`);
      if (quality) transformations.push(`q_${quality}`);
      if (format) transformations.push(`f_${format}`);
      if (blur) transformations.push(`e_blur:${blur}`);
      if (brightness) transformations.push(`e_brightness:${brightness}`);
      if (contrast) transformations.push(`e_contrast:${contrast}`);
      if (saturation) transformations.push(`e_saturation:${saturation}`);

      const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
      return `${baseUrl}/upload/${transformationString}${pathWithVersion}`;
      
    } catch (error) {
      console.warn('Erreur lors de la génération de l\'URL Cloudinary:', error);
      return src;
    }
  };

  const generateResponsiveUrls = (
    src: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536]
  ): { [key: number]: string } => {
    const urls: { [key: number]: string } = {};
    
    breakpoints.forEach(width => {
      urls[width] = generateUrl(src, { width, quality: 'auto', format: 'auto' });
    });
    
    return urls;
  };

  return {
    generateUrl,
    generateResponsiveUrls,
  };
};