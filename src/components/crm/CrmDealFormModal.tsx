"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import CrmDealContactsPicker from "./CrmDealContactsPicker";
import CurrencySelector from "@/components/ui/currency-selector/CurrencySelector";
import { useGetCrmCompaniesForSelectInfiniteQuery } from "@/lib/services/crmApi";
import type { CrmCompany, CreateCrmDealRequest } from "@/types/crm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCrmDealRequest) => void;
  isLoading?: boolean;
  defaultCrmCompanyId?: string;
}

export default function CrmDealFormModal({ isOpen, onClose, onSubmit, isLoading = false, defaultCrmCompanyId }: Props) {
  const t = useTranslations("crm.deals.form");

  const { register, handleSubmit, control, reset, watch } = useForm<CreateCrmDealRequest>({
    defaultValues: {
      crm_company_id: defaultCrmCompanyId || "",
      contact_ids: [],
      title: "",
      description: "",
      estimated_value: undefined,
      currency: "MAD",
      expected_close_date: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        crm_company_id: defaultCrmCompanyId || "",
        contact_ids: [],
        title: "",
        description: "",
        estimated_value: undefined,
        currency: "MAD",
        expected_close_date: "",
      });
    }
  }, [isOpen, defaultCrmCompanyId, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t("titles.add")}</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <Controller
                name="crm_company_id"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InfiniteSelect<CrmCompany>
                    label={<>{t("fields.company")} <span className="text-error-500">*</span></>}
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    useInfiniteQuery={useGetCrmCompaniesForSelectInfiniteQuery}
                    itemLabelKey="name"
                    itemValueKey="id"
                    placeholder={t("fields.companyPlaceholder")}
                  />
                )}
              />
            </div>

            <Controller
              name="contact_ids"
              control={control}
              render={({ field }) => (
                <CrmDealContactsPicker crmCompanyId={watch("crm_company_id")} value={field.value || []} onChange={field.onChange} />
              )}
            />

            <div>
              <Label>{t("fields.title")} <span className="text-error-500">*</span></Label>
              <Input placeholder={t("fields.titlePlaceholder")} {...register("title", { required: true })} />
            </div>

            <div>
              <Label>{t("fields.description")}</Label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("fields.estimatedValue")}</Label>
                <Input type="number" {...register("estimated_value", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>{t("fields.currency")}</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <CurrencySelector value={field.value || "MAD"} onChange={field.onChange} showPopular showRegions />
                  )}
                />
              </div>
            </div>

            <div>
              <Label>{t("fields.expectedCloseDate")}</Label>
              <Input type="date" {...register("expected_close_date")} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t("buttons.cancel")}</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? t("buttons.saving") : t("buttons.add")}</Button>
        </div>
      </form>
    </Modal>
  );
}
