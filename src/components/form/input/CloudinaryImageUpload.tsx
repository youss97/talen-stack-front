import React, { useRef, useState } from "react";
import { TrashBinIcon } from "@/icons";
import toast from "react-hot-toast";

interface CloudinaryImageUploadProps {
  label?: string;
  accept?: string;
  preview?: string | null;
  fileName?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  shape?: "square" | "circle";
  onChange?: (file: File | null, cloudinaryUrl?: string) => void;
  onRemove?: () => void;
  // Paramètres Cloudinary
  uploadType?: 'avatar' | 'profile-photo' | 'generic';
  entityType?: 'user' | 'admin' | 'manager' | 'candidate';
  entityId?: string;
  userId?: string;
  folder?: string;
  autoUpload?: boolean; // Si true, upload automatiquement vers Cloudinary
}

export default function CloudinaryImageUpload({
  label,
  accept = "image/*",
  preview,
  fileName,
  disabled = false,
  error = false,
  helperText,
  shape = "square",
  onChange,
  onRemove,
  uploadType = 'generic',
  entityType = 'user',
  entityId,
  userId,
  folder = 'uploads',
  autoUpload = false,
}: CloudinaryImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      
      // Déterminer l'endpoint et les paramètres selon le type d'upload
      let endpoint = '/upload/image';
      let fileFieldName = 'file';

      switch (uploadType) {
        case 'avatar':
          endpoint = '/upload/avatar';
          fileFieldName = 'avatar';
          if (userId) formData.append('userId', userId);
          break;
        case 'profile-photo':
          endpoint = '/upload/profile-photo';
          fileFieldName = 'photo';
          if (entityType) formData.append('entityType', entityType);
          if (entityId) formData.append('entityId', entityId);
          break;
        default:
          endpoint = '/upload/image';
          fileFieldName = 'file';
          if (folder) formData.append('folder', folder);
          break;
      }

      formData.append(fileFieldName, file);

      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      // Gérer différents formats de réponse
      let imageUrl = null;
      if (result.success && result.data?.url) {
        imageUrl = result.data.url;
      } else if (result.url) {
        imageUrl = result.url;
      } else if (result.avatar_url) {
        imageUrl = result.avatar_url;
      } else if (result.data?.avatar_url) {
        imageUrl = result.data.avatar_url;
      }

      if (imageUrl) {
        toast.success('Image uploadée avec succès !');
        return imageUrl;
      } else {
        throw new Error('URL d\'image manquante dans la réponse du serveur');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur d'upload: ${errorMessage}`);
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChange) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF, WebP');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Si autoUpload est activé, uploader vers Cloudinary
    if (autoUpload) {
      const cloudinaryUrl = await uploadToCloudinary(file);
      if (cloudinaryUrl) {
        onChange(file, cloudinaryUrl);
      }
    } else {
      // Sinon, juste passer le fichier
      onChange(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
    if (onChange) {
      onChange(null);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <div
        onClick={handleClick}
        className={`relative h-32 w-full rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-colors ${
          disabled || isUploading
            ? "opacity-50 cursor-not-allowed"
            : error
            ? "border-error-500 bg-error-50 dark:bg-error-500/10"
            : "border-gray-300 hover:border-brand-400 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`}
      >
        {isUploading ? (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">Upload en cours... {uploadProgress}%</p>
          </div>
        ) : preview ? (
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className={`max-w-full max-h-full object-contain ${
                shape === "circle" ? "rounded-full" : "rounded"
              }`}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors shadow-lg"
                title="Supprimer"
              >
                <TrashBinIcon className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center p-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {fileName || "Cliquez pour sélectionner une image"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {autoUpload ? "PNG, JPG, GIF, WebP jusqu'à 5MB" : "PNG, JPG, GIF, WebP jusqu'à 5MB"}
            </p>
            {autoUpload && (
              <div className="mt-2 flex items-center justify-center text-xs text-blue-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Optimisation automatique
              </div>
            )}
          </div>
        )}
      </div>

      {helperText && (
        <p className={`mt-1 text-sm ${error ? "text-error-500" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}