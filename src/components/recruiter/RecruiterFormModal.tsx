"use client";
import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import CVInfiniteSelect from "@/components/form/CVInfiniteSelect";
import MultiSelect from "@/components/form/MultiSelect";
import CurrencySelector from "@/components/ui/currency-selector/CurrencySelector";
import DatePicker from "@/components/form/date-picker";
import {
  createRecruiterSchema,
  updateRecruiterSchema,
  type CreateRecruiterFormData,
} from "@/validations/recruiterValidation";
import type { Recruiter, LanguageSkill } from "@/types/recruiter";
import type { ApplicationRequest } from "@/types/applicationRequest";
import type { CV } from "@/types/cv";
import { useGetCVsForSelectInfiniteQuery, useLazyGetCVByIdQuery } from "@/lib/services/cvApi";
import { useGetApplicationRequestsForSelectInfiniteQuery, useLazyGetApplicationRequestByIdQuery } from "@/lib/services/applicationRequestApi";
import { useGetContractTypesQuery } from "@/lib/services/contractTypeApi";
import { useGetApplicationStatusesQuery } from "@/lib/services/applicationStatusApi";

interface RecruiterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecruiterFormData) => void;
  recruiter?: Recruiter | null;
  isLoading?: boolean;
  serverError?: string | null;
}

export default function RecruiterFormModal({
  isOpen,
  onClose,
  onSubmit,
  recruiter,
  isLoading = false,
  serverError = null,
}: RecruiterFormModalProps) {
  const t = useTranslations("applications.form");
  const tc = useTranslations("common");
  const isEditing = !!recruiter;
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApplicationRequest | null>(null);
  const [languages, setLanguages] = useState<LanguageSkill[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [getCVById] = useLazyGetCVByIdQuery();
  const [getRequestById] = useLazyGetApplicationRequestByIdQuery();

  // Fetch contract types and application statuses
  const { data: contractTypesData } = useGetContractTypesQuery({ 
    page: 1, 
    limit: 100, 
    is_active: true 
  });
  const { data: applicationStatusesData } = useGetApplicationStatusesQuery({ 
    page: 1, 
    limit: 100, 
    is_active: true 
  });

  const contractTypes = contractTypesData?.data || [];
  const applicationStatuses = applicationStatusesData?.data || [];

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<CreateRecruiterFormData>({
    resolver: yupResolver(isEditing ? updateRecruiterSchema : createRecruiterSchema) as unknown as Resolver<CreateRecruiterFormData>,
    defaultValues: {
      request_id: "",
      cv_id: "",
      workflow_status: "draft", // Toujours créer en brouillon
      currently_employed: true, // Coché par défaut (2.1)
      current_contract_type: "",
      current_salary: undefined,
      daily_rate: undefined,
      package_rate: undefined,
      salary_expectation: undefined,
      daily_rate_expectation: undefined,
      package_current: "",
      package_desired: "",
      currency: "MAD",
      offer_contract_types: [],
      availability_type: "one_month",
      availability_reason: "",
      availability_days: undefined,
      availability_custom_value: undefined,
      availability_custom_unit: "days",
      availability_negotiable: false,
      languages: [],
      qualification_report: "",
      recruiter_notes: "",
      recruiter_interview_date: undefined,
      status: "proposed",
      is_anonymized: false,
      salary_confidential: false,
      adjusted_experience: undefined,
    },
  });

  const requestId = watch("request_id");
  const cvId = watch("cv_id");
  const currentlyEmployed = watch("currently_employed");
  const currentContractType = watch("current_contract_type");
  const availabilityType = watch("availability_type");
  const availabilityNegotiable = watch("availability_negotiable");
  // Prétentions : basées sur les types de contrat SOUHAITÉS pour l'offre (offer_contract_types),
  // pas sur le contrat actuel du candidat — CDI souhaité → salaire, Freelance souhaité → TJM,
  // les deux souhaités → les deux affichés (conditions indépendantes, pas d'exclusion mutuelle).
  // Même pattern que ApplicationRequestFormModal.tsx (isFreelance/hasSalary).
  const offerTypes = (watch("offer_contract_types") || []).filter(Boolean) as string[];
  const wantsTjmExpectation = offerTypes.some((v) => v?.toLowerCase() === "freelance");
  // Tant qu'aucun type de contrat n'a encore été choisi pour l'offre, on affiche le salaire
  // par défaut (comportement le plus courant), plutôt que de masquer les deux champs.
  const wantsSalaryExpectation = offerTypes.length === 0 || offerTypes.some((v) => ["CDI", "CDD", "Stage", "Intérim", "Alternance"].includes(v));
  const isAnonymized = watch("is_anonymized");
  const salaryConfidential = watch("salary_confidential");

  // Préparer les objets initiaux pour les selects
  const initialRequest = recruiter?.request ? [{
    id: recruiter.request.id,
    title: recruiter.request.title,
  }] as ApplicationRequest[] : [] as ApplicationRequest[];

  const initialCV = recruiter?.cv ? [{
    id: recruiter.cv.id,
    candidate_first_name: recruiter.cv.candidate_first_name,
    candidate_last_name: recruiter.cv.candidate_last_name,
    profile_title: recruiter.cv.profile_title,
  }] : [];

  // Load CV details when selected - NO LONGER NEEDED, CV is passed via onChange
  // useEffect(() => {
  //   if (cvId && !isEditing) {
  //     getCVById(cvId).unwrap().then((cv) => {
  //       setSelectedCV(cv);
  //     }).catch(console.error);
  //   }
  // }, [cvId, getCVById, isEditing]);

  // Load Request details when selected
  useEffect(() => {
    if (requestId && !isEditing) {
      getRequestById(requestId).unwrap().then((request) => {
        setSelectedRequest(request);
        // Auto-fill offer contract types
        if (request.contract_type) {
          setValue("offer_contract_types", [request.contract_type]);
        }
        // Hériter de la devise de la demande (2.3) — reste modifiable par l'utilisateur
        if (request.currency) {
          setValue("currency", request.currency as CreateRecruiterFormData["currency"]);
        }
        // Initialize languages from request — accepte string[] (ancien) ou {language, level}[] (1.3)
        if (request.languages && request.languages.length > 0) {
          const initialLanguages = (request.languages as Array<string | { language: string; level?: number }>).map((lang) =>
            typeof lang === "string"
              ? { language: lang, level: 3 }
              : { language: lang.language, level: lang.level ?? 3 },
          );
          setLanguages(initialLanguages);
          setValue("languages", initialLanguages);
        }
      }).catch(console.error);
    }
  }, [requestId, getRequestById, setValue, isEditing]);

  useEffect(() => {
    if (recruiter && isOpen) {
      // Ne PAS filtrer les langues ici : une langue existante en base ne doit jamais
      // disparaître silencieusement à l'ouverture du formulaire (elle serait alors perdue
      // définitivement à la sauvegarde suivante, même si l'utilisateur n'y touche pas).
      // Le nettoyage des lignes réellement vides se fait uniquement au submit (handleFormSubmit).
      const existingLanguages = recruiter.languages || [];

      // Mode édition : pré-remplir
      reset({
        request_id: recruiter.request_id || "",
        cv_id: recruiter.cv_id || "",
        workflow_status: recruiter.workflow_status || "draft",
        currently_employed: recruiter.currently_employed || false,
        current_contract_type: recruiter.current_contract_type || "",
        current_salary: recruiter.current_salary,
        daily_rate: recruiter.daily_rate,
        package_rate: recruiter.package_rate,
        salary_expectation: recruiter.salary_expectation,
        daily_rate_expectation: recruiter.daily_rate_expectation,
        package_current: recruiter.package_current || "",
        package_desired: recruiter.package_desired || "",
        currency: recruiter.currency || "MAD",
        offer_contract_types: recruiter.offer_contract_types || [],
        availability_type: recruiter.availability_type || "one_month",
        availability_reason: recruiter.availability_reason || "",
        availability_days: recruiter.availability_days,
        availability_custom_value: recruiter.availability_custom_value,
        availability_custom_unit: recruiter.availability_custom_unit || "days",
        availability_negotiable: recruiter.availability_negotiable || false,
        languages: existingLanguages,
        qualification_report: recruiter.qualification_report || "",
        recruiter_notes: recruiter.recruiter_notes || "",
        recruiter_interview_date: recruiter.recruiter_interview_date,
        status: recruiter.status || "proposed",
        is_anonymized: recruiter.is_anonymized || false,
        salary_confidential: recruiter.salary_confidential || false,
        adjusted_experience: recruiter.adjusted_experience,
      });
      setLanguages(existingLanguages);
      if (recruiter.cv) setSelectedCV(recruiter.cv as CV);
      if (recruiter.request) setSelectedRequest(recruiter.request as ApplicationRequest);
    } else if (isOpen) {
      // Mode création : réinitialiser
      reset({
        request_id: "",
        cv_id: "",
        workflow_status: "draft",
        currently_employed: false,
        current_contract_type: "",
        current_salary: undefined,
        daily_rate: undefined,
        package_rate: undefined,
        currency: "MAD",
        offer_contract_types: [],
        availability_type: "one_month",
        availability_reason: "",
        availability_days: undefined,
        availability_custom_value: undefined,
        availability_custom_unit: "days",
        availability_negotiable: false,
        languages: [],
        qualification_report: "",
        recruiter_notes: "",
        recruiter_interview_date: undefined,
        status: "proposed",
        is_anonymized: false,
        salary_confidential: false,
        adjusted_experience: undefined,
      });
      setLanguages([]);
      setSelectedCV(null);
      setSelectedRequest(null);
    }
  }, [recruiter, isOpen, reset]);

  const handleLanguageChange = (index: number, field: 'language' | 'level', value: string | number) => {
    const newLanguages = [...languages];
    newLanguages[index] = {
      ...newLanguages[index],
      [field]: value
    };
    setLanguages(newLanguages);
    setValue("languages", newLanguages);
  };

  const addLanguage = () => {
    const newLanguages = [...languages, { language: "", level: 3 }];
    setLanguages(newLanguages);
    setValue("languages", newLanguages);
  };

  const removeLanguage = (index: number) => {
    const newLanguages = languages.filter((_, i) => i !== index);
    setLanguages(newLanguages);
    setValue("languages", newLanguages);
  };

  // Libellés des champs (pour le bandeau "champs manquants")
  const FIELD_LABELS: Record<string, string> = {
    request_id: t("fieldLabels.request_id"),
    cv_id: t("fieldLabels.cv_id"),
    currently_employed: t("fieldLabels.currently_employed"),
    current_contract_type: t("fieldLabels.current_contract_type"),
    current_salary: t("fieldLabels.current_salary"),
    daily_rate: t("fieldLabels.daily_rate"),
    salary_expectation: t("fieldLabels.salary_expectation"),
    daily_rate_expectation: t("fieldLabels.daily_rate_expectation"),
    currency: t("fieldLabels.currency"),
    offer_contract_types: t("fieldLabels.offer_contract_types"),
    availability_type: t("fieldLabels.availability_type"),
    availability_reason: t("fieldLabels.availability_reason"),
    availability_days: t("fieldLabels.availability_days"),
    availability_custom_value: t("fieldLabels.availability_custom_value"),
    availability_custom_unit: t("fieldLabels.availability_custom_unit"),
    adjusted_experience: t("fieldLabels.adjusted_experience"),
    qualification_report: t("fieldLabels.qualification_report"),
    recruiter_interview_date: t("fieldLabels.recruiter_interview_date"),
    status: t("fieldLabels.status"),
    languages: t("fieldLabels.languages"),
  };

  const handleFormSubmit = (data: CreateRecruiterFormData) => {
    setMissingFields([]);
    // Nettoyer les lignes de langue réellement vides (ex: ligne "+" ajoutée puis non remplie)
    // uniquement au moment de l'envoi — ne jamais faire ce filtrage à l'affichage (voir useEffect
    // de pré-remplissage ci-dessus, corrigé pour ne plus perdre de langues existantes en base).
    const cleanedData = {
      ...data,
      languages: (data.languages || []).filter(
        (lang) => lang && lang.language && lang.language.trim() !== ""
      ),
    };
    // Auto-clean: appeler onSubmit puis reset le formulaire
    onSubmit(cleanedData);
    if (!isEditing) {
      // Reset form after successful creation
      reset();
      setSelectedCV(null);
      setSelectedRequest(null);
      setLanguages([]);
    }
  };

  const getAvailabilityLabel = () => {
    if (!selectedCV) return "";
    const type = availabilityType;
    return t.has(`availabilityOptions.${type}`) ? t(`availabilityOptions.${type}`) : "";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? t("editTitle") : t("createTitle")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? t("editSubtitle")
            : t("createSubtitle")}
        </p>
      </div>

      {/* Availability Banner - SUPPRIMÉ selon les règles */}

      {isEditing && !recruiter ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit, (formErrors) => {
          // Lister les champs en erreur pour informer l'utilisateur (sinon le bouton "paraît" bloqué)
          const labels = Object.keys(formErrors).map((k) => FIELD_LABELS[k] || k);
          setMissingFields(labels);
          // Remonter en haut du formulaire pour voir les erreurs
          const el = document.querySelector(".custom-scrollbar");
          if (el) el.scrollTo({ top: 0, behavior: "smooth" });
        })}>
          <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
            <div className="grid grid-cols-1 gap-6">
            
            {/* Section 1: Sélection de Base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.selection")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InfiniteSelect<ApplicationRequest>
                    label={t("offer")}
                    value={requestId}
                    onChange={(value) => setValue("request_id", value)}
                    useInfiniteQuery={useGetApplicationRequestsForSelectInfiniteQuery}
                    itemLabelKey="title"
                    itemValueKey="id"
                    placeholder={t("offerPlaceholder")}
                    emptyMessage={t("noOfferFound")}
                    error={!!errors.request_id}
                    initialSelectedItems={initialRequest}
                  />
                  {errors.request_id && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.request_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <CVInfiniteSelect
                    label={t("cvLabel")}
                    value={cvId}
                    onChange={(value, selectedItem) => {
                      console.log("CV Selected - Value:", value, "Item:", selectedItem);
                      setValue("cv_id", Array.isArray(value) ? value[0] : value);
                      // Store the selected CV object
                      if (selectedItem && !Array.isArray(selectedItem)) {
                        setSelectedCV(selectedItem);
                        console.log("CV stored in state:", selectedItem);
                      } else if (Array.isArray(selectedItem) && selectedItem.length > 0) {
                        setSelectedCV(selectedItem[0]);
                        console.log("CV stored in state (from array):", selectedItem[0]);
                      } else {
                        setSelectedCV(null);
                        console.log("CV cleared from state");
                      }
                    }}
                    useInfiniteQuery={useGetCVsForSelectInfiniteQuery}
                    placeholder={t("cvPlaceholder")}
                    emptyMessage={t("noCvFound")}
                    error={!!errors.cv_id}
                    initialSelectedItems={initialCV}
                  />
                  {errors.cv_id && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.cv_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Display CV Experience + Adjusted Experience */}
              {selectedCV && selectedCV.total_experience !== undefined && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("totalExperience", { years: selectedCV.total_experience })}
                    </p>
                  </div>

                  {/* Champ pour ajuster l'expérience */}
                  <div>
                    <Label>{t("adjustedExperienceLabel")}</Label>
                    <input
                      type="number"
                      {...register("adjusted_experience")}
                      placeholder={`${selectedCV.total_experience}`}
                      min="0"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("adjustedExperienceHelp")}
                    </p>
                    {errors.adjusted_experience && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.adjusted_experience.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Debug: Show CV state */}
              {selectedCV && !selectedCV.total_experience && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {t("cvSelectedDebug", { name: `${selectedCV.candidate_first_name} ${selectedCV.candidate_last_name}`, email: selectedCV.candidate_email || "" })}
                    <br />
                    <span className="text-yellow-600 dark:text-yellow-400">{t("cvNoExperienceNote")}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Situation Actuelle */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.currentSituation")}
              </h3>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currently_employed"
                  {...register("currently_employed")}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="currently_employed" className="text-sm text-gray-700 dark:text-gray-300">
                  {t("currentlyEmployedCheckbox")}
                </label>
              </div>

              <div>
                <Label>
                  {t("currentContractTypeLabel")} <span className="text-error-500">*</span>
                </Label>
                <select
                  {...register("current_contract_type")}
                  className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                    errors.current_contract_type
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {contractTypes.map((type) => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.current_contract_type && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.current_contract_type.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Rémunération (Dynamique) */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {currentlyEmployed ? t("sections.remunerationCurrent") : t("sections.remunerationLast")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentContractType === "Freelance" ? (
                  <div>
                    <Label>{t("dailyRateLabel")}</Label>
                    <input
                      type="number"
                      {...register("daily_rate")}
                      disabled={salaryConfidential}
                      placeholder={salaryConfidential ? t("confidentialPlaceholder") : "500"}
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:disabled:bg-gray-800"
                    />
                  </div>
                ) : currentContractType === "Forfait" ? (
                  <div>
                    <Label>{t("packageLabel")}</Label>
                    <input
                      type="number"
                      {...register("package_rate")}
                      disabled={salaryConfidential}
                      placeholder={salaryConfidential ? t("confidentialPlaceholder") : "50000"}
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:disabled:bg-gray-800"
                    />
                  </div>
                ) : (
                  <div>
                    <Label>{t("monthlySalaryLabel")}</Label>
                    <input
                      type="number"
                      {...register("current_salary")}
                      disabled={salaryConfidential}
                      placeholder={salaryConfidential ? t("confidentialPlaceholder") : "45000"}
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:disabled:bg-gray-800"
                    />
                  </div>
                )}

                <div>
                  <Label>{t("currencyLabel")}</Label>
                  <CurrencySelector
                    value={watch("currency") || "MAD"}
                    onChange={(currencyCode) => setValue("currency", currencyCode)}
                    placeholder={t("currencyPlaceholder")}
                    className="h-11"
                    showPopular={true}
                    showRegions={true}
                  />
                </div>
              </div>

              {/* Salaire confidentiel */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!salaryConfidential}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setValue("salary_confidential", v);
                    if (v) {
                      // Effacer les montants : le candidat ne souhaite pas les communiquer
                      setValue("current_salary", undefined);
                      setValue("daily_rate", undefined);
                      setValue("package_rate", undefined);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t("salaryConfidentialCheckbox")}
                </span>
              </label>

              {/* Package actuel (texte libre) */}
              <div>
                <Label>{t("currentPackageLabel")}</Label>
                <input
                  type="text"
                  {...register("package_current")}
                  placeholder={t("currentPackagePlaceholder")}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Section 4: Type de Contrat de l'Offre */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.desiredContractTypes")}
              </h3>

              <div>
                <MultiSelect
                  label=""
                  onChange={(value) => setValue("offer_contract_types", value)}
                  options={contractTypes.map((type) => ({
                    value: type.name,
                    text: type.name,
                    selected: (watch("offer_contract_types") || []).includes(type.name),
                  }))}
                  defaultSelected={(watch("offer_contract_types") || []).filter((v): v is string => v !== undefined)}
                />
                {contractTypes.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("loadingContractTypes")}
                  </p>
                )}
              </div>
            </div>

            {/* Section 4bis: Prétentions salariales / souhaitées */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.desiredExpectations")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wantsSalaryExpectation && (
                  <div>
                    <Label>{t("desiredMonthlySalaryLabel")}</Label>
                    <input
                      type="number"
                      {...register("salary_expectation")}
                      placeholder="50000"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                )}
                {wantsTjmExpectation && (
                  <div>
                    <Label>{t("desiredDailyRateLabel")}</Label>
                    <input
                      type="number"
                      {...register("daily_rate_expectation")}
                      placeholder="600"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>

              {/* Package souhaité (texte libre) */}
              <div>
                <Label>{t("desiredPackageLabel")}</Label>
                <input
                  type="text"
                  {...register("package_desired")}
                  placeholder={t("desiredPackagePlaceholder")}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Section 5: Disponibilité */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.availability")}
              </h3>

              <div>
                <Label>
                  {t("availabilityTypeLabel")} <span className="text-error-500">*</span>
                </Label>
                <select
                  {...register("availability_type")}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  <option value="immediate">{t("availabilityOptions.immediate")}</option>
                  <option value="less_than_one_month">{t("availabilityOptions.less_than_one_month")}</option>
                  <option value="one_month">{t("availabilityOptions.one_month")}</option>
                  <option value="two_months">{t("availabilityOptions.two_months")}</option>
                  <option value="three_months">{t("availabilityOptions.three_months")}</option>
                  <option value="other">{t("availabilityOptions.other")}</option>
                </select>
              </div>

              {availabilityType === "immediate" && (
                <div>
                  <Label>
                    {t("immediateReasonLabel")} <span className="text-error-500">*</span>
                  </Label>
                  <input
                    type="text"
                    {...register("availability_reason")}
                    placeholder={t("immediateReasonPlaceholder")}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                  {errors.availability_reason && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.availability_reason.message}
                    </p>
                  )}
                </div>
              )}

              {availabilityType === "less_than_one_month" && (
                <div>
                  <Label>
                    {t("daysCountLabel")} <span className="text-error-500">*</span>
                  </Label>
                  <input
                    type="number"
                    {...register("availability_days")}
                    placeholder="15"
                    min="1"
                    max="30"
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                  {errors.availability_days && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.availability_days.message}
                    </p>
                  )}
                </div>
              )}

              {availabilityType === "other" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      {t("valueLabel")} <span className="text-error-500">*</span>
                    </Label>
                    <input
                      type="number"
                      {...register("availability_custom_value")}
                      placeholder={t("valuePlaceholder")}
                      min="1"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                    {errors.availability_custom_value && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.availability_custom_value.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      {t("unitLabel")} <span className="text-error-500">*</span>
                    </Label>
                    <select
                      {...register("availability_custom_unit")}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="days">{t("unitDays")}</option>
                      <option value="months">{t("unitMonths")}</option>
                    </select>
                    {errors.availability_custom_unit && (
                      <p className="mt-1 text-sm text-error-500">
                        {errors.availability_custom_unit.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Masquer "Disponibilité négociable" si immédiate */}
              {availabilityType !== "immediate" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="availability_negotiable"
                    {...register("availability_negotiable")}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <label htmlFor="availability_negotiable" className="text-sm text-gray-700 dark:text-gray-300">
                    {t("negotiableCheckbox")}
                  </label>
                </div>
              )}

              {availabilityNegotiable && availabilityType !== "immediate" && (
                <div>
                  <Label>{t("optionalReasonLabel")}</Label>
                  <input
                    type="text"
                    {...register("availability_reason")}
                    placeholder={t("optionalReasonPlaceholder")}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Section 6: Langues */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {t("sections.languages")}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                  {t("addLanguage")}
                </Button>
              </div>

              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={lang.language ?? ""}
                      onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                      placeholder={t("languageNamePlaceholder")}
                      className="h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleLanguageChange(index, 'level', star)}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-6 h-6 ${
                            star <= lang.level
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="text-error-500 hover:text-error-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {languages.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t("noLanguages")}
                </p>
              )}
            </div>

            {/* Section 7: Compte Rendu de Qualification */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t("sections.qualification")}
              </h3>

              {/* Date entretien recruteur */}
              <div>
                <DatePicker
                  id="recruiter_interview_date"
                  label={t("interviewDateLabel")}
                  placeholder={t("interviewDatePlaceholder")}
                  onChange={(dates: Date[], currentDateString: string) => {
                    setValue("recruiter_interview_date", currentDateString);
                  }}
                  defaultDate={watch("recruiter_interview_date") || undefined}
                />
                {errors.recruiter_interview_date && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.recruiter_interview_date.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label>
                  {t("qualificationReportLabel")} <span className="text-error-500">*</span>
                </Label>
                <textarea
                  {...register("qualification_report")}
                  rows={5}
                  placeholder={t("qualificationReportPlaceholder")}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 resize-none ${
                    errors.qualification_report
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                  style={{ minHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                {errors.qualification_report && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.qualification_report.message}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("applicationStatusLabel")}</Label>
                <select
                  {...register("status")}
                  className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                    errors.status
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                  }`}
                >
                  <option value="">{t("selectStatusPlaceholder")}</option>
                  {applicationStatuses.map((status) => (
                    <option key={status.id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div>
                <Label>{t("internalNotesLabel")}</Label>
                <textarea
                  {...register("recruiter_notes")}
                  rows={3}
                  placeholder={t("internalNotesPlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 resize-none"
                  style={{ minHeight: '80px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
              </div>
              
              {/* Checkbox Anonymiser */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <input
                  type="checkbox"
                  id="is_anonymized"
                  {...register("is_anonymized")}
                  className="mt-0.5 w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <div className="flex-1">
                  <label htmlFor="is_anonymized" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    {t("anonymizeCheckbox")}
                  </label>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {t("anonymizeHelp")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          {serverError && (
            <div className="mx-6 sm:mx-8 mb-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              <span className="me-1">⚠️</span>{serverError}
            </div>
          )}
          {missingFields.length > 0 && (
            <div className="mx-6 sm:mx-8 mb-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
              <p className="text-sm font-medium text-error-600 dark:text-error-400">
                {t("missingFieldsMessage")}
              </p>
              <ul className="mt-1 list-disc ps-5 text-sm text-error-600 dark:text-error-400">
                {missingFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {tc("actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              onClick={() => {
                // En mode création, définir le workflow_status à "draft"
                // En mode édition, garder le workflow_status actuel
                if (!isEditing) {
                  setValue("workflow_status", "draft");
                }
              }}
            >
              {isLoading
                ? t("saving")
                : isEditing
                ? tc("actions.edit")
                : t("saveDraft")}
            </Button>
            {!isEditing && (
              <Button
                type="submit"
                disabled={isLoading}
                onClick={() => setValue("workflow_status", "active")}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? t("publishing") : t("publish")}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
