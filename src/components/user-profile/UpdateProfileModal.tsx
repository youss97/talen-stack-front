"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch } from "react-redux";
import { Modal } from "@/components/ui/modal";
import FormInput from "@/components/form/FormInput";
import CloudinaryImageUpload from "@/components/form/input/CloudinaryImageUpload";
import { updateProfileSchema, UpdateProfileFormData } from "@/validations/profileValidation";
import { useUpdateProfileMutation } from "@/lib/services/userApi";
import { User } from "@/types/auth";
import { setCredentials } from "@/lib/slices/authSlice";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function UpdateProfileModal({
  isOpen,
  onClose,
  user,
}: UpdateProfileModalProps) {
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateProfileFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(updateProfileSchema) as any,
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      position: user.position || "",
      current_password: "",
      new_password: "",
    },
  });

  const photoValue = watch("photo");

  useEffect(() => {
    if (isOpen) {
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        position: user.position || "",
        current_password: "",
        new_password: "",
      });
    }
  }, [isOpen, user, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      console.log('=== DEBUT SOUMISSION PROFIL ===');
      console.log('data.photo:', data.photo);
      
      const formData = new FormData();

      // Ajouter les champs texte seulement s'ils sont remplis
      if (data.first_name) formData.append("first_name", data.first_name);
      if (data.last_name) formData.append("last_name", data.last_name);
      if (data.phone) formData.append("phone", data.phone);
      if (data.position) formData.append("position", data.position);
      if (data.current_password) formData.append("current_password", data.current_password);
      if (data.new_password) formData.append("new_password", data.new_password);

      // Ajouter le fichier photo si sélectionné
      if (data.photo && data.photo instanceof File) {
        console.log('📁 Ajout du fichier photo:', data.photo.name);
        formData.append("photo", data.photo);
      } else {
        console.log('❌ Aucune photo à envoyer');
      }

      // Afficher le contenu du FormData
      console.log('=== CONTENU FORMDATA ===');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }

      const result = await updateProfile(formData).unwrap();
      
      // Forcer la mise à jour du store Redux avec les nouvelles données utilisateur
      if (result.user) {
        const token = localStorage.getItem('token');
        const refresh_token = localStorage.getItem('refresh_token');
        
        dispatch(setCredentials({
          user: result.user as any,
          token: token || '',
          refresh_token: refresh_token || undefined
        }));
      }
      
      onClose();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Modifier mon profil
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Mettez à jour vos informations personnelles
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-2">
          {/* Photo de profil */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Photo de profil
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setValue("photo", file || undefined);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.photo && (
              <p className="mt-1 text-sm text-red-500">{errors.photo.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Upload automatique vers Cloudinary - Formats acceptés: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

        {/* Prénom et Nom */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Prénom"
            type="text"
            placeholder="Entrez votre prénom"
            {...register("first_name")}
            error={errors.first_name?.message}
          />
          <FormInput
            label="Nom"
            type="text"
            placeholder="Entrez votre nom"
            {...register("last_name")}
            error={errors.last_name?.message}
          />
        </div>

        {/* Téléphone et Position */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Téléphone"
            type="tel"
            placeholder="+33 6 12 34 56 78"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <FormInput
            label="Poste/Position"
            type="text"
            placeholder="Ex: Développeur Full Stack"
            {...register("position")}
            error={errors.position?.message}
          />
        </div>

        {/* Section changement de mot de passe */}
        <div className="border-t border-gray-200 pt-5 dark:border-gray-700">
          <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">
            Changer le mot de passe (optionnel)
          </h4>
          
          <div className="space-y-4">
            <div className="relative">
              <FormInput
                label="Mot de passe actuel"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe actuel"
                {...register("current_password")}
                error={errors.current_password?.message}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative">
              <FormInput
                label="Nouveau mot de passe"
                type={showNewPassword ? "text" : "password"}
                placeholder="Entrez votre nouveau mot de passe"
                {...register("new_password")}
                error={errors.new_password?.message}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showNewPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)
            </p>
          </div>
        </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-3.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
