'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UploadOptions {
  folder?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  success: boolean;
  data?: {
    public_id: string;
    url: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
    original_filename: string;
  };
  error?: string;
}

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.tags) {
        formData.append('tags', options.tags.join(','));
      }

      // Déterminer l'endpoint selon le type de fichier
      const isImage = file.type.startsWith('image/');
      const endpoint = isImage ? '/upload/image' : '/upload/document';

      // Simulation du progrès
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          options.onProgress?.(newProgress);
          return newProgress;
        });
      }, 200);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);
      options.onProgress?.(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Fichier uploadé avec succès !');
        return result;
      } else {
        throw new Error('Échec de l\'upload');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur d'upload: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      if (options.tags) {
        formData.append('tags', options.tags.join(','));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/multiple`, {
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

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${files.length} fichier(s) uploadé(s) avec succès !`);
        return result.data.map((item: any) => ({
          success: true,
          data: item,
        }));
      } else {
        throw new Error('Échec de l\'upload multiple');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur d'upload multiple: ${errorMessage}`);
      return files.map(() => ({
        success: false,
        error: errorMessage,
      }));
    } finally {
      setIsUploading(false);
    }
  }, []);

  const deleteFile = useCallback(async (
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/${publicId}?resourceType=${resourceType}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Fichier supprimé avec succès !');
        return true;
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur de suppression: ${errorMessage}`);
      return false;
    }
  }, []);

  const getTransformedUrl = useCallback(async (
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): Promise<string | null> => {
    try {
      const params = new URLSearchParams();
      Object.entries(transformations).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/transform/${publicId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la génération de l\'URL transformée');
      }

      const result = await response.json();
      return result.data?.url || null;
    } catch (error) {
      console.error('Erreur getTransformedUrl:', error);
      return null;
    }
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getTransformedUrl,
    isUploading,
    progress,
  };
};

export default useCloudinaryUpload;