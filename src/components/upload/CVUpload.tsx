'use client';

import React, { useState } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import toast from 'react-hot-toast';

interface CVUploadProps {
  candidateId: string;
  onCVUploaded: (cvData: {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
  }) => void;
  className?: string;
}

const CVUpload: React.FC<CVUploadProps> = ({
  candidateId,
  onCVUploaded,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useCloudinaryUpload();

  const handleCVUpload = async (file: File) => {
    setIsUploading(true);

    try {
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, TXT, RTF');
        return;
      }

      // Upload via l'API backend spécialisée pour les CVs
      const formData = new FormData();
      formData.append('cv', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/cvs/upload/${candidateId}`,
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
        throw new Error(errorData.message || 'Erreur lors de l\'upload du CV');
      }

      const result = await response.json();
      
      if (result.success || result.cv_url) {
        onCVUploaded({
          url: result.cv_url || result.data?.url,
          publicId: result.public_id || result.data?.public_id,
          originalName: file.name,
          size: file.size,
        });
        toast.success('CV uploadé et analysé avec succès !');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Upload de CV avec analyse automatique
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Le CV sera automatiquement analysé et les informations extraites</li>
                <li>Formats acceptés: PDF, DOC, DOCX, TXT, RTF</li>
                <li>Taille maximale: 10MB</li>
                <li>Stockage sécurisé via Cloudinary</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <CloudinaryUpload
        onUploadSuccess={() => {}} // Géré par handleCVUpload
        folder="cvs"
        acceptedTypes={[
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/rtf'
        ]}
        maxSize={10 * 1024 * 1024} // 10MB
        className="border-2 border-dashed border-gray-300 rounded-lg p-8"
      >
        <div className="text-center">
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
          <div className="mt-4">
            <p className="text-lg font-medium text-gray-900">
              Glissez-déposez votre CV ici
            </p>
            <p className="text-sm text-gray-600 mt-2">
              ou{' '}
              <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                cliquez pour sélectionner un fichier
              </span>
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">PDF</span>
            <span className="bg-gray-100 px-2 py-1 rounded">DOC</span>
            <span className="bg-gray-100 px-2 py-1 rounded">DOCX</span>
            <span className="bg-gray-100 px-2 py-1 rounded">TXT</span>
            <span className="bg-gray-100 px-2 py-1 rounded">RTF</span>
          </div>
        </div>
      </CloudinaryUpload>

      {isUploading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Analyse du CV en cours...
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Extraction des informations et stockage sécurisé
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVUpload;