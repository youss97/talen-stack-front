"use client";
import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
}

export default function RecruiterFormModal({
  isOpen,
  onClose,
  onSubmit,
  recruiter,
  isLoading = false,
}: RecruiterFormModalProps) {
  const isEditing = !!recruiter;
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApplicationRequest | null>(null);
  const [languages, setLanguages] = useState<LanguageSkill[]>([]);

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
      currently_employed: false,
      current_contract_type: "",
      current_salary: undefined,
      daily_rate: undefined,
      package_rate: undefined,
      currency: "EUR",
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
      adjusted_experience: undefined,
    },
  });

  const requestId = watch("request_id");
  const cvId = watch("cv_id");
  const currentlyEmployed = watch("currently_employed");
  const currentContractType = watch("current_contract_type");
  const availabilityType = watch("availability_type");
  const availabilityNegotiable = watch("availability_negotiable");
  const isAnonymized = watch("is_anonymized");

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
        // Initialize languages from request
        if (request.languages && request.languages.length > 0) {
          const initialLanguages = request.languages.map(lang => ({
            language: lang,
            level: 3
          }));
          setLanguages(initialLanguages);
          setValue("languages", initialLanguages);
        }
      }).catch(console.error);
    }
  }, [requestId, getRequestById, setValue, isEditing]);

  useEffect(() => {
    if (recruiter && isOpen) {
      // Filtrer les langues invalides (sans champ language)
      const validLanguages = (recruiter.languages || []).filter(
        (lang) => lang && lang.language && lang.language.trim() !== ""
      );
      
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
        currency: recruiter.currency || "EUR",
        offer_contract_types: recruiter.offer_contract_types || [],
        availability_type: recruiter.availability_type || "one_month",
        availability_reason: recruiter.availability_reason || "",
        availability_days: recruiter.availability_days,
        availability_custom_value: recruiter.availability_custom_value,
        availability_custom_unit: recruiter.availability_custom_unit || "days",
        availability_negotiable: recruiter.availability_negotiable || false,
        languages: validLanguages,
        qualification_report: recruiter.qualification_report || "",
        recruiter_notes: recruiter.recruiter_notes || "",
        recruiter_interview_date: recruiter.recruiter_interview_date,
        status: recruiter.status || "proposed",
        is_anonymized: recruiter.is_anonymized || false,
        adjusted_experience: recruiter.adjusted_experience,
      });
      setLanguages(validLanguages);
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
        currency: "EUR",
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

  const handleFormSubmit = (data: CreateRecruiterFormData) => {
    console.log("handleFormSubmit called with data:", data);
    console.log("isEditing:", isEditing);
    console.log("Form errors:", errors);
    // Auto-clean: appeler onSubmit puis reset le formulaire
    onSubmit(data);
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
    switch (type) {
      case "immediate":
        return "Immédiate";
      case "less_than_one_month":
        return "< 1 mois";
      case "one_month":
        return "1 mois";
      case "two_months":
        return "2 mois";
      case "three_months":
        return "3 mois";
      default:
        return "";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="p-6 sm:p-8 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? "Modifier la candidature" : "Créer une nouvelle candidature"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? "Modifiez les informations de la candidature"
            : "Remplissez les informations pour créer une nouvelle candidature"}
        </p>
      </div>

      {/* Availability Banner - SUPPRIMÉ selon les règles */}

      {isEditing && !recruiter ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
          console.log("Form validation errors:", errors);
        })}>
          <div className="max-h-[60vh] overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar">
            <div className="grid grid-cols-1 gap-6">
            
            {/* Section 1: Sélection de Base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Sélection
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <InfiniteSelect<ApplicationRequest>
                    label="Offre"
                    value={requestId}
                    onChange={(value) => setValue("request_id", value)}
                    useInfiniteQuery={useGetApplicationRequestsForSelectInfiniteQuery}
                    itemLabelKey="title"
                    itemValueKey="id"
                    placeholder="Sélectionner une offre..."
                    emptyMessage="Aucune offre trouvée"
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
                    label="CV (Nom + Prénom + Titre)"
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
                    placeholder="Sélectionner un CV..."
                    emptyMessage="Aucun CV trouvé"
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
                      <span className="font-medium">Années d'expérience totale (CV):</span> {selectedCV.total_experience} ans
                    </p>
                  </div>
                  
                  {/* Champ pour ajuster l'expérience */}
                  <div>
                    <Label>Expérience ajustée (optionnel)</Label>
                    <input
                      type="number"
                      {...register("adjusted_experience")}
                      placeholder={`${selectedCV.total_experience}`}
                      min="0"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Modifiez l'expérience si elle diffère du CV (ex: expérience pertinente uniquement)
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
                    CV sélectionné: {selectedCV.candidate_first_name} {selectedCV.candidate_last_name} ({selectedCV.candidate_email})
                    <br />
                    <span className="text-yellow-600 dark:text-yellow-400">Note: Ce CV n'a pas d'expérience totale renseignée</span>
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Situation Actuelle */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Situation Actuelle
              </h3>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="currently_employed"
                  {...register("currently_employed")}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="currently_employed" className="text-sm text-gray-700 dark:text-gray-300">
                  Actuellement en poste
                </label>
              </div>

              <div>
                <Label>
                  Type de contrat actuel ou dernier <span className="text-error-500">*</span>
                </Label>
                <select
                  {...register("current_contract_type")}
                  className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                    errors.current_contract_type
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                >
                  <option value="">Sélectionner...</option>
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
                Rémunération {currentlyEmployed ? "(Actuelle)" : "(Dernière)"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentContractType === "Freelance" ? (
                  <div>
                    <Label>TJM (€)</Label>
                    <input
                      type="number"
                      {...register("daily_rate")}
                      placeholder="500"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                ) : currentContractType === "Forfait" ? (
                  <div>
                    <Label>Forfait (€)</Label>
                    <input
                      type="number"
                      {...register("package_rate")}
                      placeholder="50000"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                ) : (
                  <div>
                    <Label>Salaire annuel (€)</Label>
                    <input
                      type="number"
                      {...register("current_salary")}
                      placeholder="45000"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    />
                  </div>
                )}

                <div>
                  <Label>Devise</Label>
                  <CurrencySelector
                    value={watch("currency") || "EUR"}
                    onChange={(currencyCode) => setValue("currency", currencyCode)}
                    placeholder="Sélectionner une devise..."
                    className="h-11"
                    showPopular={true}
                    showRegions={true}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Type de Contrat de l'Offre */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Type(s) de contrat accepté(s)
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
                    Chargement des types de contrats...
                  </p>
                )}
              </div>
            </div>

            {/* Section 5: Disponibilité */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Disponibilité
              </h3>
              
              <div>
                <Label>
                  Type de disponibilité <span className="text-error-500">*</span>
                </Label>
                <select
                  {...register("availability_type")}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                >
                  <option value="immediate">Immédiate</option>
                  <option value="less_than_one_month">{"< 1 mois"}</option>
                  <option value="one_month">1 mois</option>
                  <option value="two_months">2 mois</option>
                  <option value="three_months">3 mois</option>
                  <option value="other">Autres</option>
                </select>
              </div>

              {availabilityType === "immediate" && (
                <div>
                  <Label>
                    Raison de la disponibilité immédiate <span className="text-error-500">*</span>
                  </Label>
                  <input
                    type="text"
                    {...register("availability_reason")}
                    placeholder="Ex: Fin de mission, recherche active..."
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
                    Nombre de jours <span className="text-error-500">*</span>
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
                      Valeur <span className="text-error-500">*</span>
                    </Label>
                    <input
                      type="number"
                      {...register("availability_custom_value")}
                      placeholder="Ex: 4"
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
                      Unité <span className="text-error-500">*</span>
                    </Label>
                    <select
                      {...register("availability_custom_unit")}
                      className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="days">Jours</option>
                      <option value="months">Mois</option>
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
                    Disponibilité négociable
                  </label>
                </div>
              )}

              {availabilityNegotiable && availabilityType !== "immediate" && (
                <div>
                  <Label>Raison (optionnel)</Label>
                  <input
                    type="text"
                    {...register("availability_reason")}
                    placeholder="Ex: Préavis flexible..."
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Section 6: Langues */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Langues
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addLanguage}>
                  + Ajouter
                </Button>
              </div>
              
              {languages.map((lang, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={lang.language}
                      onChange={(e) => handleLanguageChange(index, 'language', e.target.value)}
                      placeholder="Ex: Français"
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
                  Aucune langue ajoutée. Cliquez sur "+ Ajouter" pour commencer.
                </p>
              )}
            </div>

            {/* Section 7: Compte Rendu de Qualification */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Qualification
              </h3>
              
              {/* Date entretien recruteur */}
              <div>
                <DatePicker
                  id="recruiter_interview_date"
                  label="Date d'entretien recruteur (optionnel)"
                  placeholder="Sélectionner une date"
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
                  Compte rendu de qualification <span className="text-error-500">*</span>
                </Label>
                <textarea
                  {...register("qualification_report")}
                  rows={5}
                  placeholder="Décrivez les points forts du candidat, sa motivation, son adéquation avec le poste..."
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
                <Label>Statut de la candidature</Label>
                <select
                  {...register("status")}
                  className={`w-full h-11 rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                    errors.status
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                  }`}
                >
                  <option value="">Sélectionner un statut...</option>
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
                <Label>Notes internes (optionnel)</Label>
                <textarea
                  {...register("recruiter_notes")}
                  rows={3}
                  placeholder="Notes visibles uniquement par les recruteurs..."
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
                    Anonymiser cette candidature
                  </label>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Les données personnelles (nom, prénom, email, téléphone) ne seront pas envoyées au client. 
                    Seules les compétences et l'expérience seront visibles.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-3 p-6 sm:p-8 pt-0 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
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
                ? "Enregistrement..."
                : isEditing
                ? "Modifier"
                : "Enregistrer brouillon"}
            </Button>
            {!isEditing && (
              <Button 
                type="submit" 
                disabled={isLoading}
                onClick={() => setValue("workflow_status", "active")}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Publication..." : "Publier"}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
