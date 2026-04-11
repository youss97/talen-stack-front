'use client';

import React, { useState } from 'react';
import ProfileImageSection from '../../../../components/profile/ProfileImageSection';
import CVUpload from '../../../../components/upload/CVUpload';
import CloudinaryUpload from '../../../../components/upload/CloudinaryUpload';
import CompanyLogoUpload from '../../../../components/upload/CompanyLogoUpload';
import ProfilePhotoUpload from '../../../../components/upload/ProfilePhotoUpload';
import JobBackgroundUpload from '../../../../components/upload/JobBackgroundUpload';
import CloudinaryImage from '../../../../components/common/CloudinaryImage';
import useCloudinaryUpload from '../../../../hooks/useCloudinaryUpload';

const CloudinaryDemoPage = () => {
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [jobBackground, setJobBackground] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    url: string;
    publicId: string;
    type: string;
    size: number;
  }>>([]);

  const { deleteFile, getTransformedUrl } = useCloudinaryUpload();

  // Simuler un ID utilisateur (en réalité, cela viendrait du contexte d'auth)
  const userId = 'demo-user-123';

  const handleFileUpload = (url: string, publicId: string, file?: File) => {
    if (file) {
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        url,
        publicId,
        type: file.type,
        size: file.size,
      }]);
    }
  };

  const handleCVUpload = (cvData: {
    url: string;
    publicId: string;
    originalName: string;
    size: number;
  }) => {
    setUploadedFiles(prev => [...prev, {
      name: cvData.originalName,
      url: cvData.url,
      publicId: cvData.publicId,
      type: 'application/pdf',
      size: cvData.size,
    }]);
  };

  const handleDeleteFile = async (publicId: string, index: number) => {
    const success = await deleteFile(publicId, 'raw');
    if (success) {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Démonstration Cloudinary
          </h1>
          <p className="mt-2 text-gray-600">
            Testez les fonctionnalités d'upload et de gestion des fichiers via Cloudinary
          </p>
        </div>

        <div className="space-y-8">
          {/* Section Avatar */}
          <ProfileImageSection
            userId={userId}
            currentAvatar={userAvatar}
            onAvatarUpdate={setUserAvatar}
            canEdit={true}
          />

          {/* Section Logo d'entreprise */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Logo d'entreprise
            </h3>
            <div className="flex items-center space-x-6">
              <CompanyLogoUpload
                companyId="demo-company-123"
                currentLogo={companyLogo}
                onLogoUpdate={setCompanyLogo}
                size={120}
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Recommandations pour le logo
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Format: PNG, SVG, JPG ou WebP</li>
                  <li>• Taille maximale: 5MB</li>
                  <li>• Dimensions recommandées: 300x300px</li>
                  <li>• Fond transparent de préférence (PNG/SVG)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section Photo de profil */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Photo de profil générique
            </h3>
            <div className="flex items-center space-x-6">
              <ProfilePhotoUpload
                entityType="manager"
                entityId="demo-manager-456"
                currentPhoto={profilePhoto}
                onPhotoUpdate={setProfilePhoto}
                size={120}
                label="Photo de manager"
              />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Types de profils supportés
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded">Utilisateur</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Administrateur</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Manager</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Candidat</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section Image de fond */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Image de fond pour offre d'emploi
            </h3>
            <JobBackgroundUpload
              jobId="demo-job-789"
              currentBackground={jobBackground}
              onBackgroundUpdate={setJobBackground}
              width={400}
              height={200}
            />
          </div>

          {/* Section Upload de CV */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload de CV avec analyse
            </h3>
            <CVUpload
              candidateId={userId}
              onCVUploaded={handleCVUpload}
            />
          </div>

          {/* Section Upload générique */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload de fichiers génériques
            </h3>
            <CloudinaryUpload
              onUploadSuccess={(url, publicId) => {
                // Simuler les données du fichier
                const mockFile = new File([''], 'uploaded-file', { type: 'image/jpeg' });
                handleFileUpload(url, publicId, mockFile);
              }}
              folder="demo"
              acceptedTypes={['image/*', 'application/pdf', 'text/*']}
              maxSize={10 * 1024 * 1024}
            />
          </div>

          {/* Section des images uploadées avec CloudinaryImage */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Fichiers uploadés ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video relative mb-3 bg-gray-100 rounded overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <CloudinaryImage
                          src={file.url}
                          alt={file.name}
                          fill
                          className="object-cover"
                          quality="auto"
                          crop="fill"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                      <div className="flex items-center justify-between">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Voir l'original
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.publicId, index)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section démonstration CloudinaryImage */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Démonstration du composant CloudinaryImage
            </h3>
            <div className="space-y-6">
              {/* Exemple avec avatar */}
              {userAvatar && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Avatar avec différentes transformations</h4>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <CloudinaryImage
                        src={userAvatar}
                        alt="Avatar original"
                        width={80}
                        height={80}
                        className="rounded-full"
                        quality="auto"
                        crop="fill"
                      />
                      <p className="text-xs text-gray-500 mt-1">Original</p>
                    </div>
                    <div className="text-center">
                      <CloudinaryImage
                        src={userAvatar}
                        alt="Avatar flou"
                        width={80}
                        height={80}
                        className="rounded-full"
                        quality="auto"
                        crop="fill"
                        blur={300}
                      />
                      <p className="text-xs text-gray-500 mt-1">Flou</p>
                    </div>
                    <div className="text-center">
                      <CloudinaryImage
                        src={userAvatar}
                        alt="Avatar sépia"
                        width={80}
                        height={80}
                        className="rounded-full"
                        quality="auto"
                        crop="fill"
                        saturation={-100}
                      />
                      <p className="text-xs text-gray-500 mt-1">Désaturé</p>
                    </div>
                    <div className="text-center">
                      <CloudinaryImage
                        src={userAvatar}
                        alt="Avatar contrasté"
                        width={80}
                        height={80}
                        className="rounded-full"
                        quality="auto"
                        crop="fill"
                        contrast={50}
                        brightness={20}
                      />
                      <p className="text-xs text-gray-500 mt-1">Contrasté</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Exemple avec logo d'entreprise */}
              {companyLogo && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Logo avec différentes tailles</h4>
                  <div className="flex items-end space-x-4">
                    <div className="text-center">
                      <CloudinaryImage
                        src={companyLogo}
                        alt="Logo petit"
                        width={50}
                        height={50}
                        className="border rounded"
                        quality="auto"
                        crop="fit"
                      />
                      <p className="text-xs text-gray-500 mt-1">50x50</p>
                    </div>
                    <div className="text-center">
                      <CloudinaryImage
                        src={companyLogo}
                        alt="Logo moyen"
                        width={100}
                        height={100}
                        className="border rounded"
                        quality="auto"
                        crop="fit"
                      />
                      <p className="text-xs text-gray-500 mt-1">100x100</p>
                    </div>
                    <div className="text-center">
                      <CloudinaryImage
                        src={companyLogo}
                        alt="Logo grand"
                        width={150}
                        height={150}
                        className="border rounded"
                        quality="auto"
                        crop="fit"
                      />
                      <p className="text-xs text-gray-500 mt-1">150x150</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section informations techniques */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">
              ℹ️ Informations techniques
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>Architecture:</strong> Frontend → Backend API → Cloudinary</p>
              <p><strong>Sécurité:</strong> Clés API Cloudinary protégées côté serveur</p>
              <p><strong>Optimisation:</strong> Images automatiquement optimisées (WebP, compression)</p>
              <p><strong>CDN:</strong> Distribution mondiale via le CDN Cloudinary</p>
              <p><strong>Transformations:</strong> Redimensionnement et optimisation à la volée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryDemoPage;