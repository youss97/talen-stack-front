"use client";
import { useEffect, useState } from "react";
import { useForm, Controller, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import ImageUpload from "@/components/form/input/ImageUpload";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
} from "@/validations/userValidation";
import { useGetRolesForSelectInfiniteQuery } from "@/lib/services/roleApi";
import type { User } from "@/types/user";
import type { Role } from "@/types/role";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { getImageUrl } from "@/utils/imageHelper";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: CreateUserFormData) => void;
  user?: User | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading = false,
  readOnly = false,
}: UserFormModalProps) {
  const isEditing = !!user && !readOnly;
  const [showPassword, setShowPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photo || null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: yupResolver(isEditing ? updateUserSchema : createUserSchema) as Resolver<CreateUserFormData>,
    defaultValues: {
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role_id: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: "",
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        status: user.status,
      });
      setPhotoPreview(getImageUrl(user.photo_path || user.photo));
    } else {
      reset({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role_id: "",
        status: "active",
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [user, reset]);

  const handlePhotoChange = (file: File | null) => {
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(user?.photo || null);
    }
  };

  const handleFormSubmit = (data: CreateUserFormData) => {
    console.log("🚀 handleFormSubmit appelé:", { data, readOnly, onSubmit: !!onSubmit });
    
    // Ne rien faire si en mode lecture seule ou pas de callback
    if (readOnly || !onSubmit) {
      console.log("❌ Soumission annulée:", { readOnly, hasOnSubmit: !!onSubmit });
      return;
    }
    
    // Add photo file to data
    const dataWithPhoto = {
      ...data,
      photo: photoFile,
    };
    
    console.log("✅ Soumission du formulaire:", dataWithPhoto);
    
    // Remove empty password on edit
    if (isEditing && !data.password) {
      const { password, ...dataWithoutPassword } = dataWithPhoto;
      onSubmit(dataWithoutPassword as CreateUserFormData);
    } else {
      onSubmit(dataWithPhoto);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl max-h-[90vh] flex flex-col">
      <div className="flex-shrink-0 p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {readOnly
            ? "Détails de l'utilisateur"
            : isEditing
            ? "Modifier l'utilisateur"
            : "Ajouter un utilisateur"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {readOnly
            ? "Consultez les informations de l'utilisateur"
            : isEditing
            ? "Modifiez les informations de l'utilisateur"
            : "Remplissez les informations pour créer un nouvel utilisateur"}
        </p>
      </div>

      {isLoading && isEditing ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chargement des données...
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Photo de profil - En premier */}
            <div className="sm:col-span-2">
              <ImageUpload
                label="Photo de profil"
                preview={photoPreview}
                shape="circle"
                onChange={readOnly ? undefined : handlePhotoChange}
                disabled={readOnly}
              />
            </div>

            <div>
              <Label>
                Prénom {!readOnly && <span className="text-error-500">*</span>}
              </Label>
              <Input
                placeholder="John"
                {...register("first_name")}
                error={!!errors.first_name}
                disabled={readOnly}
              />
              {errors.first_name && !readOnly && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Nom {!readOnly && <span className="text-error-500">*</span>}
              </Label>
              <Input
                placeholder="Doe"
                {...register("last_name")}
                error={!!errors.last_name}
                disabled={readOnly}
              />
              {errors.last_name && !readOnly && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.last_name.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>
                Email {!readOnly && <span className="text-error-500">*</span>}
              </Label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                {...register("email")}
                error={!!errors.email}
                disabled={readOnly}
              />
              {errors.email && !readOnly && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {!readOnly && (
              <div className="sm:col-span-2">
                <Label>
                  Mot de passe{" "}
                  {!isEditing && <span className="text-error-500">*</span>}
                  {isEditing && (
                    <span className="text-gray-400 text-xs">
                      (laisser vide pour ne pas modifier)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="SecurePassword123!"
                    {...register("password")}
                    error={!!errors.password}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <InfiniteSelect<Role>
                    label={`Rôle ${!readOnly ? '*' : ''}`}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    useInfiniteQuery={useGetRolesForSelectInfiniteQuery}
                    itemLabelKey="name"
                    itemValueKey="id"
                    placeholder="Sélectionner un rôle"
                    emptyMessage="Aucun rôle trouvé"
                    error={!!errors.role_id}
                    initialSelectedItems={user?.role ? [user.role as Role] : []}
                    disabled={readOnly}
                  />
                )}
              />
              {errors.role_id && !readOnly && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.role_id.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Statut {!readOnly && <span className="text-error-500">*</span>}
              </Label>
              <select
                {...register("status")}
                disabled={readOnly}
                className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-800 ${
                  errors.status
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
              {errors.status && !readOnly && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
          {readOnly ? (
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Enregistrement..."
                  : isEditing
                  ? "Modifier"
                  : "Ajouter"}
              </Button>
            </>
          )}
        </div>
      </form>
      )}
    </Modal>
  );
}
