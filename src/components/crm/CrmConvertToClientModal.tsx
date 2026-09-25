"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { useConvertCrmDealToClientMutation, useConvertCrmCompanyToClientMutation } from "@/lib/services/crmApi";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { useForm } from "react-hook-form";
import type { ConvertToClientRequest } from "@/types/crm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 'deal' (défaut) convertit via une opportunité gagnée ; 'company' convertit directement le prospect. */
  mode?: "deal" | "company";
  dealId?: string;
  crmCompanyId?: string;
  onSuccess: () => void;
}

export default function CrmConvertToClientModal({ isOpen, onClose, mode = "deal", dealId, crmCompanyId, onSuccess }: Props) {
  const t = useTranslations("crm.deals");
  const tCompanies = useTranslations("crm.companies");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = (variant: "success" | "error", title: string, message?: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  };
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const { register, handleSubmit, reset } = useForm<ConvertToClientRequest>({
    defaultValues: { adminEmail: "", adminPassword: "", adminFirstName: "", adminLastName: "", adminPhone: "" },
  });

  const [convertDeal, { isLoading: isConvertingDeal }] = useConvertCrmDealToClientMutation();
  const [convertCompany, { isLoading: isConvertingCompany }] = useConvertCrmCompanyToClientMutation();
  const isLoading = mode === "deal" ? isConvertingDeal : isConvertingCompany;

  const onSubmit = async (data: ConvertToClientRequest) => {
    try {
      if (mode === "deal" && dealId) {
        await convertDeal({ id: dealId, data }).unwrap();
      } else if (mode === "company" && crmCompanyId) {
        await convertCompany({ id: crmCompanyId, data }).unwrap();
      }
      addToast("success", t("toasts.convertSuccess"));
      reset();
      setTimeout(onSuccess, 800);
    } catch (error) {
      addToast("error", getApiErrorMessage(error, t("toasts.convertError")));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {mode === "deal" ? t("detail.convertTitle") : tCompanies("convertToClient.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {mode === "deal" ? t("detail.convertSubtitle") : tCompanies("convertToClient.subtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t("convertForm.adminFirstName")} <span className="text-error-500">*</span></Label>
              <Input {...register("adminFirstName", { required: true })} />
            </div>
            <div>
              <Label>{t("convertForm.adminLastName")} <span className="text-error-500">*</span></Label>
              <Input {...register("adminLastName", { required: true })} />
            </div>
          </div>
          <div>
            <Label>{t("convertForm.adminEmail")} <span className="text-error-500">*</span></Label>
            <Input type="email" {...register("adminEmail", { required: true })} />
          </div>
          <div>
            <Label>{t("convertForm.adminPassword")} <span className="text-error-500">*</span></Label>
            <Input type="password" {...register("adminPassword", { required: true, minLength: 8 })} />
          </div>
          <div>
            <Label>{t("convertForm.adminPhone")}</Label>
            <Input {...register("adminPhone")} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t("form.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? t("convertForm.converting") : t("convertForm.submit")}</Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
