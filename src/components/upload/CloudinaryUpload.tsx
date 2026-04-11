'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string, publicId: string) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
  children?: React.ReactNode;
}

interface UploadResponse {
  success: boolean;
  data: {
    public_id: string;
    url: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
    original_filename: string;
  };
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  folder = 'images',
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  acceptedTypes = ['image/*'],
  className = '',
  children
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Déterminer l'endpoint selon le type de fichier
    const isImage = file.type.startsWith('image/');
    const endpoint = isImage ? '/upload/image' : '/upload/document';

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'upload');
    }

    return response.json();
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulation du progrès (Cloudinary ne fournit pas de progrès réel via cette méthode)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        onUploadSuccess(result.data.url, result.data.public_id);
        toast.success('Fichier uploadé avec succès !');
      } else {
        throw new Error('Échec de l\'upload');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      onUploadError?.(errorMessage);
      toast.error(`Erreur d'upload: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [folder, onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false,
    disabled: isUploading,
  });

  // Afficher les erreurs de validation des fichiers
  React.useEffect(() => {
    fileRejections.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`Fichier trop volumineux: ${file.name}`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`Type de fichier non autorisé: ${file.name}`);
        }
      });
    });
  }, [fileRejections]);

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      
      {isUploading ? (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">Upload en cours... {uploadProgress}%</p>
        </div>
      ) : children ? (
        children
      ) : (
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Déposez le fichier ici...</p>
            ) : (
              <div>
                <p>
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Cliquez pour sélectionner
                  </span>{' '}
                  ou glissez-déposez
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {acceptedTypes.join(', ')} (max {Math.round(maxSize / 1024 / 1024)}MB)
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;