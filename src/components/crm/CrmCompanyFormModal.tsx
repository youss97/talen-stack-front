"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "@/components/form/date-picker";
import { Lock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import type { CrmCompany, CreateCrmCompanyRequest } from "@/types/crm";
import { useGetCrmIndustriesQuery } from "@/lib/services/crmIndustryApi";
import { useGetCrmLocationSuggestionsQuery } from "@/lib/services/crmApi";
import { COUNTRY_LIST } from "@/types/client";
import { LEAD_STATUSES, PIPELINE_STAGES, PROSPECT_SOURCES, PRIORITIES } from "@/constants/crmProspecting";

const SELECT_CLASS =
  "h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700";

const EMPTY_VALUES: CreateCrmCompanyRequest = {
  name: "", industry: "", size: "", address: "", city: "", country: "", website: "", pole: "",
  source: "", stage: "prospect", lead_status: "Nouveau", pipeline_stage: "Prospection", priority: "Moyenne",
  last_contact_date: "", next_action: "", next_action_date: "", internal_note: "",
};

interface CrmCompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCrmCompanyRequest) => void;
  company?: CrmCompany | null;
  isLoading?: boolean;
}

export default function CrmCompanyFormModal({ isOpen, onClose, onSubmit, company, isLoading = false }: CrmCompanyFormModalProps) {
  const t = useTranslations("crm.companies.form");
  const tp = useTranslations("crm.prospecting");
  const isEditing = !!company;

  const { data: industriesData } = useGetCrmIndustriesQuery({ is_active: true, limit: 100 });
  const { data: locations } = useGetCrmLocationSuggestionsQuery(undefined, { skip: !isOpen });
  const countryOptions = Array.from(new Set([...(locations?.countries || []), ...COUNTRY_LIST]));

  const { register, handleSubmit, reset, control } = useForm<CreateCrmCompanyRequest>({ defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        industry: company.industry || "",
        size: company.size || "",
        address: company.address || "",
        city: company.city || "",
        country: company.country || "",
        website: company.website || "",
        pole: company.pole || "",
        source: company.source || "",
        stage: company.stage,
        lead_status: company.lead_status || "Nouveau",
        pipeline_stage: company.pipeline_stage || "Prospection",
        priority: company.priority || "Moyenne",
        last_contact_date: company.last_contact_date ? String(company.last_contact_date).slice(0, 10) : "",
        next_action: company.next_action || "",
        next_action_date: company.next_action_date ? String(company.next_action_date).slice(0, 10) : "",
        internal_note: company.internal_note || "",
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [company, reset, isOpen]);

  // Les dates vides doivent partir en `undefined` (le backend valide un format ISO), pas en "".
  const submit = (data: CreateCrmCompanyRequest) => {
    onSubmit({
      ...data,
      last_contact_date: data.last_contact_date || undefined,
      next_action_date: data.next_action_date || undefined,
    });
  };

  const legacySource = company?.source && !PROSPECT_SOURCES.some((s) => s.value === company.source) ? company.source : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? t("titles.edit") : t("titles.add")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing ? t("subtitles.edit") : t("subtitles.add")}
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)}>
        <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <Label>{t("fields.name")} <span className="text-error-500">*</span></Label>
              <Input placeholder={t("fields.namePlaceholder")} {...register("name", { required: true })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("fields.industry")}</Label>
                <select
                  {...register("industry")}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  <option value="">{t("fields.industryPlaceholder")}</option>
                  {(industriesData?.data || []).map((industry) => (
                    <option key={industry.id} value={industry.name}>{industry.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t("fields.size")}</Label>
                <Input placeholder="50-200" {...register("size")} />
              </div>
            </div>

            <div>
              <Label>{t("fields.address")}</Label>
              <Input {...register("address")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("fields.city")}</Label>
                <Input list="crm-city-suggestions" {...register("city")} />
                <datalist id="crm-city-suggestions">
                  {(locations?.cities || []).map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>{t("fields.country")}</Label>
                <Input list="crm-country-suggestions" {...register("country")} />
                <datalist id="crm-country-suggestions">
                  {countryOptions.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("fields.website")}</Label>
                <Input placeholder="https://" {...register("website")} />
              </div>
              <div>
                <Label>{t("fields.pole")}</Label>
                <Input list="crm-pole-suggestions" placeholder={t("fields.polePlaceholder")} {...register("pole")} />
                <datalist id="crm-pole-suggestions">
                  {(locations?.poles || []).map((pole) => (
                    <option key={pole} value={pole} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("fields.source")}</Label>
                <select {...register("source")} className={SELECT_CLASS}>
                  <option value="">{t("fields.sourcePlaceholder")}</option>
                  {legacySource && <option value={legacySource}>{legacySource}</option>}
                  {PROSPECT_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{tp(`source.${s.key}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t("fields.stage")}</Label>
                <select {...register("stage")} className={SELECT_CLASS}>
                  <option value="prospect">Prospect</option>
                  <option value="client">Client</option>
                  <option value="perdu">Perdu</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{tp("sectionTitle")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{tp("fields.leadStatus")}</Label>
                  <select {...register("lead_status")} className={SELECT_CLASS}>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{tp(`leadStatus.${s.key}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>{tp("fields.pipelineStage")}</Label>
                  <select {...register("pipeline_stage")} className={SELECT_CLASS}>
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>{tp(`pipelineStage.${s.key}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>{tp("fields.priority")}</Label>
                  <select {...register("priority")} className={SELECT_CLASS}>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{tp(`priority.${p.key}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Controller
                    name="last_contact_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="crm-last-contact-date"
                        label={tp("fields.lastContactDate")}
                        placeholder={tp("fields.datePlaceholder")}
                        defaultDate={field.value || undefined}
                        onChange={(_dates, dateStr) => field.onChange(dateStr)}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>{tp("fields.nextAction")}</Label>
                  <Input placeholder={tp("fields.nextActionPlaceholder")} {...register("next_action")} />
                </div>
                <div>
                  <Controller
                    name="next_action_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="crm-next-action-date"
                        label={tp("fields.nextActionDate")}
                        placeholder={tp("fields.datePlaceholder")}
                        defaultDate={field.value || undefined}
                        onChange={(_dates, dateStr) => field.onChange(dateStr)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Lock size={14} strokeWidth={1.8} />
                  {t("fields.internalNote")}
                </span>
              </Label>
              <textarea
                {...register("internal_note")}
                rows={3}
                placeholder={t("fields.internalNotePlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("buttons.saving") : isEditing ? t("buttons.save") : t("buttons.add")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
