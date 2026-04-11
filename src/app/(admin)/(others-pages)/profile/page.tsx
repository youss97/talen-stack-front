"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useChangePasswordMutation } from "@/lib/services/userApi";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import type { RootState } from "@/lib/store";
import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";

export default function Profile() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  // Toast state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      variant: "success" | "error" | "warning" | "info",
      title: string,
      message: string
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Hook avec callbacks pour les toasts
  const { updateUserProfile, uploadImageToCloudinary, isLoading: isUpdating } = useProfileUpdate({
    onSuccess: (message) => addToast("success", "Succès", message),
    onError: (message) => addToast("error", "Erreur", message),
  });

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    position: "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect déclenché');
    console.log('user complet:', user);
    console.log('user.photo_path:', user?.photo_path);
    console.log('user.id:', user?.id);
    
    if (user) {
      setProfileData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        position: user.position || "",
      });

      // Afficher l'image si elle existe et n'est pas /null
      if (user.photo_path && user.photo_path !== '/null' && user.photo_path !== 'null') {
        console.log('✅ Mise à jour photoPreview avec:', user.photo_path);
        setPhotoPreview(user.photo_path);
      } else {
        console.log('❌ Pas d\'image valide, reset preview');
        console.log('Raison: photo_path =', user.photo_path);
        setPhotoPreview(null);
      }
    } else {
      console.log('❌ Pas d\'utilisateur');
    }
  }, [user?.id, user?.photo_path]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // Fonction pour uploader une image vers Cloudinary et mettre à jour le profil
  // Fonction simple pour uploader une image
  const handleImageUpload = async (file: File) => {
    if (!user?.id) {
      addToast("error", "Erreur", "Utilisateur non identifié");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      console.log('🚀 Début upload image pour user:', user.id);
      
      const imageUrl = await uploadImageToCloudinary(file, user.id);
      
      console.log('📸 Image URL reçue:', imageUrl);
      
      if (imageUrl) {
        // Mettre à jour le preview immédiatement avec l'URL Cloudinary
        setPhotoPreview(imageUrl);
        console.log('✅ Preview mis à jour avec URL Cloudinary');
      }
    } catch (error) {
      console.error('❌ Erreur upload:', error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast("error", "Erreur", 'Type de fichier non autorisé. Formats acceptés: JPEG, PNG, GIF, WebP');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast("error", "Erreur", 'Le fichier ne doit pas dépasser 5MB');
      return;
    }

    // Afficher un preview local temporaire pendant l'upload
    const localPreviewUrl = URL.createObjectURL(file);
    setPhotoPreview(localPreviewUrl);
    console.log('🖼️ Preview local temporaire affiché');

    // Lancer l'upload (qui remplacera le preview par l'URL Cloudinary)
    handleImageUpload(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateUserProfile(profileData);
    } catch (error: any) {
      console.error("Erreur soumission profil:", error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      addToast("error", "Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.new_password.length < 6) {
      addToast("error", "Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      }).unwrap();

      addToast("success", "Succès", "Mot de passe modifié avec succès");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: any) {
      addToast("error", "Erreur", error?.data?.message || "Erreur lors du changement de mot de passe");
      console.error("Failed to change password:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Profile Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            Informations du Profil
          </h3>

          <form onSubmit={handleProfileSubmit}>
            <div className="space-y-6">
              {/* Photo de profil simple */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 overflow-hidden border-2 border-gray-200 rounded-full dark:border-gray-800">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Photo de profil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn('❌ Erreur chargement image:', photoPreview);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const container = target.parentElement!;
                        container.innerHTML = `
                          <div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span class="text-3xl font-medium text-gray-600 dark:text-gray-300">
                              ${user.first_name?.charAt(0) || "U"}
                            </span>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
                        {user.first_name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Changer la photo de profil
                  </label>
                  
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={isUploadingPhoto}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  
                  {isUploadingPhoto && (
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm text-blue-600">Upload vers Cloudinary en cours...</span>
                      </div>
                    </div>
                  )}
                  
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Upload automatique vers Cloudinary - JPG, PNG, GIF, WebP (max 5MB)
                  </p>
                  

                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <Label>Prénom</Label>
                  <InputField
                    type="text"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <Label>Nom</Label>
                  <InputField
                    type="text"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <InputField
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    L'email ne peut pas être modifié
                  </p>
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <InputField
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label>Poste</Label>
                  <InputField
                    type="text"
                    name="position"
                    value={profileData.position}
                    onChange={handleProfileChange}
                    placeholder="Votre poste"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating || isUploadingPhoto}>
                  {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            Changer le Mot de Passe
          </h3>

          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-5">
              <div>
                <Label>Mot de passe actuel</Label>
                <InputField
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre mot de passe actuel"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div>
                <Label>Nouveau mot de passe</Label>
                <InputField
                  type="password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Entrez votre nouveau mot de passe"
                  autoComplete="new-password"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 6 caractères
                </p>
              </div>

              <div>
                <Label>Confirmer le nouveau mot de passe</Label>
                <InputField
                  type="password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Confirmez votre nouveau mot de passe"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? "Modification..." : "Changer le mot de passe"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}