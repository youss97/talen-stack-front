"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import InputField from "../form/input/InputField";
import ImageUpload from "../form/input/ImageUpload";
import Label from "../form/Label";
import type { Manager } from "@/types/client";
import {
  createManagerSchema,
  type CreateManagerFormData,
} from "@/validations/managerValidation";

interface ManagerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateManagerFormData) => void;
  manager?: Manager | null;
  isLoading?: boolean;
}

export default function ManagerFormModal({
  isOpen,
  onClose,
  onSubmit,
  manager,
  isLoading = false,
}: ManagerFormModalProps) {
  const isEditing = !!manager;
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateManagerFormData>({
    resolver: zodResolver(createManagerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      phone: "",
      position: "",
      photo: undefined,
    },
  });

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (manager && isOpen) {
      // Mode édition : pré-remplir avec les données du manager
      const mgr = manager as any;
      reset({
        first_name: mgr.firstName || mgr.first_name || "",
        last_name: mgr.lastName || mgr.last_name || "",
        email: mgr.email || "",
        password: "", // Ne pas pré-remplir le mot de passe
        phone: mgr.phone || "",
        position: mgr.position || "",
        photo: undefined,
      });
      // Afficher la photo existante si disponible
      if (mgr.photo_path) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        setPhotoPreview(`${apiUrl}/${mgr.photo_path}`);
      } else {
        setPhotoPreview(null);
      }
    } else if (isOpen) {
      // Mode création : réinitialiser
      reset({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        phone: "",
        position: "",
        photo: undefined,
      });
      setPhotoPreview(null);
    }
  }, [manager, isOpen, reset]);

  const handleFormSubmit = (data: CreateManagerFormData) => {
    onSubmit(data);
  };

  const handleImageChange = (file: File | null) => {
    setValue("photo", file);
    
    // Créer une prévisualisation de l'image
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // Si on supprime la photo, réinitialiser la prévisualisation
      if (manager) {
        const mgr = manager as any;
        if (mgr.photo_path) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          setPhotoPreview(`${apiUrl}/${mgr.photo_path}`);
        } else {
          setPhotoPreview(null);
        }
      } else {
        setPhotoPreview(null);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="relative w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {isEditing ? "Modifier le manager" : "Ajouter un manager"}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {isEditing
              ? "Modifiez les informations du manager"
              : "Créez un nouveau manager pour ce client"}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3">
            <div className="space-y-5">
              <div>
                <Label>Photo de profil (optionnelle)</Label>
                <ImageUpload
                  label=""
                  preview={photoPreview}
                  shape="circle"
                  onChange={handleImageChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <InputField
                    id="first_name"
                    type="text"
                    placeholder="John"
                    {...register("first_name")}
                    error={!!errors.first_name}
                    hint={errors.first_name?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <InputField
                    id="last_name"
                    type="text"
                    placeholder="Doe"
                    {...register("last_name")}
                    error={!!errors.last_name}
                    hint={errors.last_name?.message}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <InputField
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register("email")}
                  error={!!errors.email}
                  hint={errors.email?.message}
                />
              </div>

              <div>
                <Label htmlFor="password">
                  Mot de passe {isEditing ? "(laisser vide pour ne pas changer)" : "*"}
                </Label>
                <InputField
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  error={!!errors.password}
                  hint={errors.password?.message}
                />
              </div>

              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <InputField
                  id="phone"
                  type="text"
                  placeholder="+33 6 12 34 56 78"
                  {...register("phone")}
                  error={!!errors.phone}
                  hint={errors.phone?.message}
                />
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <InputField
                  id="position"
                  type="text"
                  placeholder="Directeur des Ressources Humaines"
                  {...register("position")}
                  error={!!errors.position}
                  hint={errors.position?.message}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button size="sm" type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Modification..."
                  : "Création..."
                : isEditing
                ? "Modifier"
                : "Créer le manager"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
