"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import {
  applicationStatusSchema,
  type ApplicationStatusFormData,
} from "@/validations/applicationStatusValidation";
import type { ApplicationStatus } from "@/types/applicationStatus";

interface ApplicationStatusFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: ApplicationStatusFormData) => void;
  applicationStatus?: ApplicationStatus | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

export default function ApplicationStatusFormModal({
  isOpen,
  onClose,
  onSubmit,
  applicationStatus,
  isLoading = false,
  readOnly = false,
}: ApplicationStatusFormModalProps) {
  const t = useTranslations("settings.applicationStatusesPage.formModal");
  const isEditing = !!applicationStatus && !readOnly;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationStatusFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(applicationStatusSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      color: "",
      is_active: true,
      is_final: false,
      display_order: 0,
    },
  });

  useEffect(() => {
    if (applicationStatus) {
      reset({
        name: applicationStatus.name,
        description: applicationStatus.description || "",
        color: applicationStatus.color || "",
        is_active: applicationStatus.is_active ?? true,
        is_final: applicationStatus.is_final ?? false,
        display_order: applicationStatus.display_order || 0,
      });
    } else {
      reset({
        name: "",
        description: "",
        color: "",
        is_active: true,
        is_final: false,
        display_order: 0,
      });
    }
  }, [applicationStatus, reset]);

  const handleFormSubmit = (data: ApplicationStatusFormData) => {
    if (!onSubmit) return;
    onSubmit(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {readOnly
            ? t("detailTitle")
            : isEditing
            ? t("editTitle")
            : t("createTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {readOnly
            ? t("detailSubtitle")
            : isEditing
            ? t("editSubtitle")
            : t("createSubtitle")}
        </p>
      </div>

      {isLoading && isEditing ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("loading")}
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={!readOnly && onSubmit ? handleSubmit(handleFormSubmit) : (e) => e.preventDefault()}>
          <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
            <div className="space-y-5">
              <div>
                <Label>
                  {t("nameLabel")} {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <Input
                  placeholder={t("namePlaceholder")}
                  {...register("name")}
                  error={!!errors.name}
                  disabled={readOnly}
                />
                {errors.name && !readOnly && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  {t("descriptionLabel")} {!readOnly && <span className="text-error-500">*</span>}
                </Label>
                <TextArea
                  placeholder={t("descriptionPlaceholder")}
                  {...register("description")}
                  error={!!errors.description}
                  disabled={readOnly}
                  rows={4}
                />
                {errors.description && !readOnly && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("colorLabel")}</Label>
                <Input
                  type="color"
                  placeholder="#000000"
                  {...register("color")}
                  error={!!errors.color}
                  disabled={readOnly}
                />
                {errors.color && !readOnly && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.color.message}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("orderLabel")}</Label>
                <Input
                  type="number"
                  placeholder="0"
                  {...register("display_order")}
                  error={!!errors.display_order}
                  disabled={readOnly}
                />
                {errors.display_order && !readOnly && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.display_order.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <Label htmlFor="is_active" className="mb-0">
                  {t("activeLabel")}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_final"
                  {...register("is_final")}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <Label htmlFor="is_final" className="mb-0">
                  {t("finalLabel")}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
            {readOnly ? (
              <Button variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  {t("cancel")}
                </Button>
                <Button disabled={isLoading}>
                  {isLoading
                    ? t("saving")
                    : isEditing
                    ? t("edit")
                    : t("add")}
                </Button>
              </>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
