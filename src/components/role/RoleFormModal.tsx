"use client";
import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import PermissionsSelector from "./PermissionsSelector";
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleFormData,
} from "@/validations/roleValidation";
import type { RoleWithFeatures } from "@/types/role";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleFormData, actionIds: string[]) => void;
  role?: RoleWithFeatures | null;
  isLoading?: boolean;
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  role,
  isLoading = false,
}: RoleFormModalProps) {
  const isEditing = !!role;

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: yupResolver(isEditing ? updateRoleSchema : createRoleSchema) as unknown as Resolver<CreateRoleFormData>,
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (role) {
      reset({
        name: role.name || "",
        description: role.description || "",
      });

      const features: string[] = [];
      const pages: string[] = [];
      const actions: string[] = [];

      // Les features retournées SONT les features sélectionnées (pas de propriété .selected)
      role.features?.forEach((feature) => {
        features.push(feature.id);
        feature.pages?.forEach((page) => {
          pages.push(page.id);
          page.actions?.forEach((action) => {
            actions.push(action.id);
          });
        });
      });

      setSelectedFeatures(features);
      setSelectedPages(pages);
      setSelectedActions(actions);
    } else {
      reset({
        name: "",
        description: "",
      });
      setSelectedFeatures([]);
      setSelectedPages([]);
      setSelectedActions([]);
    }
  }, [role, reset]);

  const handleFormSubmit = (data: CreateRoleFormData) => {
    onSubmit(data, selectedActions);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl mx-4 my-2 h-[96vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? "Modifier le rôle" : "Ajouter un rôle"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? "Modifiez les informations du rôle"
            : "Remplissez les informations pour créer un nouveau rôle"}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <Label>Nom du rôle</Label>
              <input
                placeholder="Administrateur"
                {...register("name")}
                className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                  errors.name
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                placeholder="Description du rôle..."
                {...register("description")}
                rows={3}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                  errors.description
                    ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                    : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
              <Label>Permissions</Label>
              <p className="text-sm text-gray-500 mb-4">
                Sélectionnez les modules, pages et actions accessibles pour ce rôle
              </p>
              <PermissionsSelector
                selectedFeatures={selectedFeatures}
                selectedPages={selectedPages}
                selectedActions={selectedActions}
                onFeaturesChange={setSelectedFeatures}
                onPagesChange={setSelectedPages}
                onActionsChange={setSelectedActions}
              />
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
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
        </div>
      </form>
    </Modal>
  );
}
