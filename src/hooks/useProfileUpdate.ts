import { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useUpdateProfileMutation, userApi } from '@/lib/services/userApi';
import { setCredentials, updateUserImage } from '@/lib/slices/authSlice';
import type { RootState } from '@/lib/store';

interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  image?: string;
}

interface UseProfileUpdateOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const useProfileUpdate = (options?: UseProfileUpdateOptions) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const updateUserProfile = useCallback(async (data: ProfileUpdateData, file?: File) => {
    try {
      console.log('🔄 Mise à jour du profil avec:', { data, hasFile: !!file });
      
      const formData = new FormData();
      
      // Ajouter les données du profil
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
          console.log(`📝 Ajout du champ: ${key} = ${value}`);
        }
      });

      // Ajouter le fichier si présent
      if (file) {
        formData.append("photo", file);
        console.log('📎 Fichier ajouté:', file.name, file.size, 'bytes');
      }

      // Log du contenu du FormData
      console.log('📋 Contenu FormData:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }

      const result = await updateProfile(formData).unwrap();
      console.log('✅ Réponse API:', result);
      
      // Mettre à jour l'état Redux avec les nouvelles données utilisateur
      if (result.user && user && token) {
        const updatedUser = {
          ...user,
          ...result.user,
        };
        
        console.log('🔄 Mise à jour Redux:', updatedUser);
        
        dispatch(setCredentials({
          user: updatedUser as any,
          token,
        }));
      }

      const successMessage = result.message || 'Profil mis à jour avec succès';
      options?.onSuccess?.(successMessage);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      const errorMessage = error?.data?.message || error?.message || 'Erreur lors de la mise à jour du profil';
      options?.onError?.(errorMessage);
      throw error;
    }
  }, [updateProfile, dispatch, user, token, options]);

  const uploadImageToCloudinary = useCallback(async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      console.log('📤 Upload vers Cloudinary - userId:', userId);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/avatar-cloudinary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      console.log('📦 Réponse backend:', result);
      
      const imageUrl = result.avatar_url;

      if (imageUrl) {
        console.log('🖼️ URL image reçue:', imageUrl);
        
        // Mettre à jour uniquement l'image dans Redux (sans toucher aux permissions)
        dispatch(updateUserImage(imageUrl));
        console.log('✅ Redux mis à jour avec nouvelle image');
        
        options?.onSuccess?.('Photo de profil mise à jour avec succès');
        return imageUrl;
      } else {
        throw new Error('URL d\'image manquante dans la réponse');
      }
    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      options?.onError?.(`Erreur d'upload: ${errorMessage}`);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  }, [token, dispatch, options]);

  const cleanBrokenImage = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('🧹 Nettoyage image cassée pour:', userId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/clean-broken-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du nettoyage');
      }

      const result = await response.json();
      console.log('🧹 Résultat nettoyage:', result);
      
      if (result.cleaned_fields && result.cleaned_fields.length > 0) {
        options?.onSuccess?.(`Image cassée supprimée: ${result.cleaned_fields.join(', ')}`);
        
        // Mettre à jour l'état Redux pour supprimer l'image
        if (user && token) {
          dispatch(setCredentials({
            user: {
              ...user,
              image: null,
              photo_path: null,
            },
            token,
          }));
        }
        
        return true;
      } else {
        options?.onSuccess?.('Aucune image cassée trouvée');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      options?.onError?.(`Erreur de nettoyage: ${errorMessage}`);
      return false;
    }
  }, [token, dispatch, user, options]);

  return {
    updateUserProfile,
    uploadImageToCloudinary,
    cleanBrokenImage,
    isLoading,
    isUploadingImage,
  };
};