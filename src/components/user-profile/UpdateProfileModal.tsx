"use client";

import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/hooks";
import { Modal } from "@/components/ui/modal";
import FormInput from "@/components/form/FormInput";
import { updateProfileSchema, UpdateProfileFormData } from "@/validations/profileValidation";
import { useUpdateProfileMutation } from "@/lib/services/userApi";
import { User } from "@/types/auth";
import { setCredentials } from "@/lib/slices/authSlice";
import { getImageUrl } from "@/utils/imageHelper";
import { Eye, EyeOff } from "lucide-react";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function UpdateProfileModal({ isOpen, onClose, user }: UpdateProfileModalProps) {
  const dispatch = useDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UpdateProfileFormData>({
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
      setPhotoPreview(getImageUrl(user.photo_path) || null);
    }
  }, [isOpen, user, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setValue("photo", file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      const formData = new FormData();
      if (data.first_name) formData.append("first_name", data.first_name);
      if (data.last_name) formData.append("last_name", data.last_name);
      if (data.phone) formData.append("phone", data.phone);
      if (data.position) formData.append("position", data.position);
      if (data.current_password) formData.append("current_password", data.current_password);
      if (data.new_password) formData.append("new_password", data.new_password);
      if (data.photo && data.photo instanceof File) {
        formData.append("photo", data.photo);
      }

      const result = await updateProfile(formData).unwrap();

      if (result.user) {
        const token = localStorage.getItem("token");
        const refresh_token = localStorage.getItem("refresh_token");
        dispatch(setCredentials({
          user: {
            ...currentUser,
            ...result.user,
            features: currentUser?.features,
            role: currentUser?.role,
            company: currentUser?.company,
          } as any,
          token: token || "",
          refresh_token: refresh_token || undefined,
        }));
      }

      onClose();
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
  };

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <EyeOff size={20} strokeWidth={1.8} className="icon-glow" />
    ) : (
      <Eye size={20} strokeWidth={1.8} className="icon-glow" />
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Modifier mon profil</h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">Mettez à jour vos informations personnelles</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-2">
          {/* Photo de profil */}
          <div>
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Photo de profil</p>
            <div className="flex items-center gap-5">
              {/* Preview */}
              <div
                className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-semibold text-gray-400">
                    {user.first_name?.charAt(0) || "U"}
                  </span>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-brand-600 border border-brand-300 rounded-full hover:bg-brand-50 dark:text-brand-400 dark:border-brand-700 dark:hover:bg-brand-900/20 transition-colors"
                >
                  Choisir une photo
                </button>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, GIF, WebP · max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Prénom et Nom */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Prénom" type="text" placeholder="Votre prénom" {...register("first_name")} error={errors.first_name?.message} />
            <FormInput label="Nom" type="text" placeholder="Votre nom" {...register("last_name")} error={errors.last_name?.message} />
          </div>

          {/* Téléphone et Position */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Téléphone" type="tel" placeholder="+212 6 12 34 56 78" {...register("phone")} error={errors.phone?.message} />
            <FormInput label="Poste" type="text" placeholder="Ex: Développeur Full Stack" {...register("position")} error={errors.position?.message} />
          </div>

          {/* Changement de mot de passe */}
          <div className="border-t border-gray-200 pt-5 dark:border-gray-700">
            <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">
              Changer le mot de passe <span className="font-normal text-gray-400">(optionnel)</span>
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
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeIcon open={showCurrentPassword} />
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
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <EyeIcon open={showNewPassword} />
                </button>
              </div>
              <p className="text-xs text-gray-400">Au moins 8 caractères, une majuscule, un chiffre et un caractère spécial</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-3 text-sm font-medium text-white bg-brand-600 rounded-full hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
