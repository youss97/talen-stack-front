'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ImagePlus, Camera, Check } from 'lucide-react';

interface CompanyLogoUploadProps {
  companyId: string;
  currentLogo?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
  size?: number;
  className?: string;
}

const CompanyLogoUpload: React.FC<CompanyLogoUploadProps> = ({
  companyId,
  currentLogo,
  onLogoUpdate,
  size = 120,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleLogoUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('companyId', companyId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/company-logo`,
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
        onLogoUpdate(result.data.url);
        setPreviewUrl(null);
        toast.success('Logo mis à jour avec succès !');
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
    handleLogoUpload(file);
  };

  const displayLogo = previewUrl || currentLogo;

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
        style={{ width: size, height: size }}
      >
        {displayLogo ? (
          <Image
            src={displayLogo}
            alt="Logo entreprise"
            fill
            className="object-contain p-2"
            sizes={`${size}px`}
          />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <ImagePlus
                className="w-8 h-8 text-gray-400 mx-auto mb-2 icon-glow"
                size={32}
                strokeWidth={1.8}
              />
              <p className="text-xs text-gray-500">Logo</p>
            </div>
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
        id={`logo-upload-${companyId}`}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Bouton d'upload */}
      <label
        htmlFor={`logo-upload-${companyId}`}
        className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors disabled:opacity-50"
      >
        <Camera className="w-4 h-4 icon-glow" size={16} strokeWidth={1.8} />
      </label>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
          <Check className="w-3 h-3 icon-glow" size={12} strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};

export default CompanyLogoUpload;