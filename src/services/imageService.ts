/**
 * Service centralisé pour la gestion des images avec Cloudinary
 */

export interface ImageUploadOptions {
  folder?: string;
  width?: number;
  height?: number;
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad';
  tags?: string[];
}

export interface ImageUploadResult {
  success: boolean;
  data?: {
    public_id: string;
    url: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
    format: string;
    bytes: number;
  };
  error?: string;
}

class ImageService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL;

  /**
   * Upload d'avatar utilisateur
   */
  async uploadAvatar(file: File, userId: string): Promise<ImageUploadResult> {
    return this.uploadSpecializedImage(file, 'avatar', { userId });
  }

  /**
   * Upload de logo d'entreprise
   */
  async uploadCompanyLogo(file: File, companyId: string): Promise<ImageUploadResult> {
    return this.uploadSpecializedImage(file, 'company-logo', { companyId });
  }

  /**
   * Upload de logo client
   */
  async uploadClientLogo(file: File, clientId: string): Promise<ImageUploadResult> {
    return this.uploadSpecializedImage(file, 'client-logo', { clientId });
  }

  /**
   * Upload d'image de fond pour offre d'emploi
   */
  async uploadJobBackground(file: File, jobId: string): Promise<ImageUploadResult> {
    return this.uploadSpecializedImage(file, 'job-background', { jobId });
  }

  /**
   * Upload de photo de profil générique
   */
  async uploadProfilePhoto(
    file: File, 
    entityType: 'user' | 'admin' | 'manager' | 'candidate', 
    entityId: string
  ): Promise<ImageUploadResult> {
    return this.uploadSpecializedImage(file, 'profile-photo', { entityType, entityId });
  }

  /**
   * Upload d'image générique
   */
  async uploadGenericImage(file: File, options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.folder) formData.append('folder', options.folder);
      if (options.width) formData.append('width', options.width.toString());
      if (options.height) formData.append('height', options.height.toString());
      if (options.quality) formData.append('quality', options.quality);
      if (options.tags) formData.append('tags', options.tags.join(','));

      const response = await fetch(`${this.baseUrl}/upload/image`, {
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

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Suppression d'image
   */
  async deleteImage(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/upload/${publicId}?resourceType=${resourceType}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return false;
    }
  }

  /**
   * Génération d'URL transformée
   */
  async getTransformedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): Promise<string | null> {
    try {
      const params = new URLSearchParams();
      Object.entries(transformations).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(
        `${this.baseUrl}/upload/transform/${publicId}?${params}`,
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
  }

  /**
   * Validation de fichier image
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF, WebP',
      };
    }

    // Vérifier la taille (5MB par défaut)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Le fichier ne doit pas dépasser 5MB',
      };
    }

    return { valid: true };
  }

  /**
   * Génération d'URLs responsive
   */
  generateResponsiveUrls(
    cloudinaryUrl: string,
    breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536]
  ): { [key: number]: string } {
    const urls: { [key: number]: string } = {};
    
    if (!cloudinaryUrl?.includes('cloudinary.com')) {
      // Si ce n'est pas une URL Cloudinary, retourner l'URL originale pour tous les breakpoints
      breakpoints.forEach(width => {
        urls[width] = cloudinaryUrl;
      });
      return urls;
    }

    try {
      const urlParts = cloudinaryUrl.split('/upload/');
      if (urlParts.length !== 2) {
        breakpoints.forEach(width => {
          urls[width] = cloudinaryUrl;
        });
        return urls;
      }

      const [baseUrl, pathWithVersion] = urlParts;

      breakpoints.forEach(width => {
        const transformations = `w_${width},c_fill,q_auto,f_auto`;
        urls[width] = `${baseUrl}/upload/${transformations}/${pathWithVersion}`;
      });

      return urls;
    } catch (error) {
      console.warn('Erreur lors de la génération des URLs responsive:', error);
      breakpoints.forEach(width => {
        urls[width] = cloudinaryUrl;
      });
      return urls;
    }
  }

  /**
   * Méthode privée pour les uploads spécialisés
   */
  private async uploadSpecializedImage(
    file: File,
    endpoint: string,
    params: Record<string, string>
  ): Promise<ImageUploadResult> {
    try {
      const formData = new FormData();
      
      // Ajouter le fichier avec le bon nom selon l'endpoint
      const fileFieldName = this.getFileFieldName(endpoint);
      formData.append(fileFieldName, file);
      
      // Ajouter les paramètres
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(`${this.baseUrl}/upload/${endpoint}`, {
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

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir le nom du champ de fichier selon l'endpoint
   */
  private getFileFieldName(endpoint: string): string {
    const fieldNames: Record<string, string> = {
      'avatar': 'avatar',
      'company-logo': 'logo',
      'client-logo': 'logo',
      'job-background': 'background',
      'profile-photo': 'photo',
    };

    return fieldNames[endpoint] || 'file';
  }
}

// Instance singleton
export const imageService = new ImageService();

// Types utilitaires
export type ImageType = 'avatar' | 'company-logo' | 'client-logo' | 'job-background' | 'profile-photo' | 'generic';

export interface ImageConfig {
  type: ImageType;
  maxSize?: number; // en bytes
  allowedFormats?: string[];
  recommendedDimensions?: {
    width: number;
    height: number;
  };
}

// Configurations prédéfinies
export const IMAGE_CONFIGS: Record<ImageType, ImageConfig> = {
  avatar: {
    type: 'avatar',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    recommendedDimensions: { width: 200, height: 200 },
  },
  'company-logo': {
    type: 'company-logo',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    recommendedDimensions: { width: 300, height: 300 },
  },
  'client-logo': {
    type: 'client-logo',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    recommendedDimensions: { width: 300, height: 300 },
  },
  'job-background': {
    type: 'job-background',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    recommendedDimensions: { width: 1200, height: 600 },
  },
  'profile-photo': {
    type: 'profile-photo',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    recommendedDimensions: { width: 400, height: 400 },
  },
  generic: {
    type: 'generic',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};