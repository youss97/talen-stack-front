'use client';

import React, { useState } from 'react';
import CloudinaryUpload from './CloudinaryUpload';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import toast from 'react-hot-toast';
import { Info, UploadCloud } from 'lucide-react';

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
            <Info size={20} strokeWidth={1.8} className="icon-glow text-blue-400" />
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
                <li>Stockage sécurisé</li>
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
          <UploadCloud size={48} strokeWidth={1.8} className="icon-glow mx-auto text-gray-400" />
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