'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ImagePlus, Upload, Check } from 'lucide-react';

interface JobBackgroundUploadProps {
  jobId: string;
  currentBackground?: string;
  onBackgroundUpdate: (newBackgroundUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

const JobBackgroundUpload: React.FC<JobBackgroundUploadProps> = ({
  jobId,
  currentBackground,
  onBackgroundUpdate,
  width = 400,
  height = 200,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleBackgroundUpload = async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('background', file);
      formData.append('jobId', jobId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/job-background`,
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
        onBackgroundUpdate(result.data.url);
        setPreviewUrl(null);
        toast.success('Image de fond mise à jour avec succès !');
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

    // Validation de la taille (10MB max pour les images de fond)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10MB');
      return;
    }

    // Créer une preview locale
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Uploader le fichier
    handleBackgroundUpload(file);
  };

  const displayBackground = previewUrl || currentBackground;

  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors bg-gray-50"
        style={{ width, height }}
      >
        {displayBackground ? (
          <Image
            src={displayBackground}
            alt="Image de fond de l'offre"
            fill
            className="object-cover"
            sizes={`${width}px`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <ImagePlus
                className="w-12 h-12 text-gray-400 mx-auto mb-3 icon-glow"
                size={48}
                strokeWidth={1.8}
              />
              <p className="text-sm text-gray-600 mb-1">Image de fond</p>
              <p className="text-xs text-gray-500">1200x600px recommandé</p>
            </div>
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Upload en cours...</p>
            </div>
          </div>
        )}

        {/* Overlay pour l'upload */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <label
            htmlFor={`background-upload-${jobId}`}
            className="cursor-pointer bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 opacity-0 hover:opacity-100"
          >
            <Upload
              className="w-4 h-4 inline mr-2 icon-glow"
              size={16}
              strokeWidth={1.8}
            />
            Changer l'image
          </label>
        </div>
      </div>

      {/* Input file caché */}
      <input
        type="file"
        id={`background-upload-${jobId}`}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {/* Informations et conseils */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>• Format: JPG, PNG, WebP</span>
          <span>• Taille max: 10MB</span>
          <span>• Dimensions: 1200x600px recommandé</span>
        </div>
      </div>

      {/* Indicateur de changement */}
      {previewUrl && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
          <Check className="w-4 h-4 icon-glow" size={16} strokeWidth={1.8} />
        </div>
      )}
    </div>
  );
};

export default JobBackgroundUpload;