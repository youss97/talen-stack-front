"use client";
import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import DatePicker from "@/components/form/date-picker";
import {
  createApplicationRequestSchema,
  type CreateApplicationRequestFormData,
} from "@/validations/applicationRequestValidation";
import type { ApplicationRequest } from "@/types/applicationRequest";
import type { Client, Manager } from "@/types/client";
import {
  useGetClientsForSelectInfiniteQuery,
  useGetClientManagersForSelectInfiniteQuery,
} from "@/lib/services/clientApi";
import { useGetContractTypesQuery } from "@/lib/services/contractTypeApi";

interface ApplicationRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApplicationRequestFormData) => void;
  applicationRequest?: ApplicationRequest | null;
  isLoading?: boolean;
}

const LANGUAGES = [
  { value: "FR", label: "Français" },
  { value: "EN", label: "Anglais" },
  { value: "AR", label: "Arabe" },
  { value: "ES", label: "Espagnol" },
  { value: "DE", label: "Allemand" },
  { value: "IT", label: "Italien" },
  { value: "Autres", label: "Autres" },
];

export default function ApplicationRequestFormModal({
  isOpen,
  onClose,
  onSubmit,
  applicationRequest,
  isLoading = false,
}: ApplicationRequestFormModalProps) {
  const isEditing = !!applicationRequest;
  const [skillInput, setSkillInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateApplicationRequestFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(createApplicationRequestSchema) as any,
    defaultValues: {
      client_id: "",
      manager_id: "",
      title: "",
      description: "",
      required_skills: [],
      min_experience: undefined,
      max_experience: undefined,
      contract_type: "",
      mission_duration_months: undefined,
      mission_renewable: false,
      min_salary: undefined,
      max_salary: undefined,
      daily_rate_min: undefined,
      daily_rate_max: undefined,
      location: "",
      country: "France",
      work_type: "on_site",
      remote_days_per_week: undefined,
      remote_possible: false,
      languages: [],
      benefits: "",
      bonuses: "",
      variables: "",
      priority: "normal",
      status: "in_progress",
      desired_start_date: undefined,
      number_of_profiles: 1,
    },
  });

  const requiredSkills = watch("required_skills") || [];
  const clientId = watch("client_id");
  const managerId = watch("manager_id");
  const contractType = watch("contract_type");
  const workType = watch("work_type");
  const selectedLanguages = watch("languages") || [];

  const managerQueryArg = useMemo(() => ({ clientId: clientId || "" }), [clientId]);
  const isFreelance = contractType?.toLowerCase() === "freelance";

  // Fetch contract types
  const { data: contractTypesData } = useGetContractTypesQuery({ 
    page: 1, 
    limit: 100, 
    is_active: true 
  });
  const contractTypes = contractTypesData?.data || [];
  const isHybrid = workType === "hybrid";

  // Préparer les objets initiaux pour les selects
  const initialClient = useMemo(() => {
    if (applicationRequest?.client) {
      return [{
        id: applicationRequest.client.id,
        name: applicationRequest.client.name,
      }] as Client[];
    }
    return [] as Client[];
  }, [applicationRequest]);

  const initialManager = useMemo(() => {
    if (applicationRequest?.manager) {
      return [{
        id: applicationRequest.manager.id,
        firstName: applicationRequest.manager.first_name,
        lastName: applicationRequest.manager.last_name,
        displayName: `${applicationRequest.manager.first_name} ${applicationRequest.manager.last_name}`,
        position: applicationRequest.manager.position,
      }] as Manager[];
    }
    return [] as Manager[];
  }, [applicationRequest]);

  useEffect(() => {
    if (applicationRequest) {
      reset({
        client_id: applicationRequest.client_id,
        manager_id: applicationRequest.manager_id,
        title: applicationRequest.title,
        description: applicationRequest.description,
        required_skills: applicationRequest.required_skills || [],
        min_experience: applicationRequest.min_experience,
        max_experience: applicationRequest.max_experience,
        contract_type: applicationRequest.contract_type,
        mission_duration_months: applicationRequest.mission_duration_months,
        mission_renewable: applicationRequest.mission_renewable || false,
        min_salary: applicationRequest.min_salary,
        max_salary: applicationRequest.max_salary,
        daily_rate_min: applicationRequest.daily_rate_min,
        daily_rate_max: applicationRequest.daily_rate_max,
        location: applicationRequest.location || "",
        country: applicationRequest.country || "France",
        work_type: applicationRequest.work_type || "on_site",
        remote_days_per_week: applicationRequest.remote_days_per_week,
        remote_possible: applicationRequest.remote_possible || false,
        languages: applicationRequest.languages || [],
        benefits: applicationRequest.benefits || "",
        bonuses: applicationRequest.bonuses || "",
        variables: applicationRequest.variables || "",
        priority: applicationRequest.priority || "normal",
        status: applicationRequest.status || "in_progress",
        desired_start_date: applicationRequest.desired_start_date?.split("T")[0],
        number_of_profiles: applicationRequest.number_of_profiles || 1,
      });
    } else if (isOpen) {
      // Réinitialiser le formulaire en mode création
      reset({
        client_id: "",
        manager_id: "",
        title: "",
        description: "",
        required_skills: [],
        min_experience: undefined,
        max_experience: undefined,
        contract_type: "",
        mission_duration_months: undefined,
        mission_renewable: false,
        min_salary: undefined,
        max_salary: undefined,
        daily_rate_min: undefined,
        daily_rate_max: undefined,
        location: "",
        country: "France",
        work_type: "on_site",
        remote_days_per_week: undefined,
        remote_possible: false,
        languages: [],
        benefits: "",
        bonuses: "",
        variables: "",
        priority: "normal",
        status: "in_progress",
        desired_start_date: undefined,
        number_of_profiles: 1,
      });
    }
  }, [applicationRequest, isOpen, reset]);

  const handleClientChange = (value: string) => {
    setValue("client_id", value);
    setValue("manager_id", "");
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setValue("required_skills", [...requiredSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue(
      "required_skills",
      requiredSkills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setValue("languages", selectedLanguages.filter(l => l !== lang));
    } else {
      setValue("languages", [...selectedLanguages, lang]);
    }
  };

  const getManagerLabel = (manager: Manager) => {
    const fullName = `${manager.firstName} ${manager.lastName}`;
    const position = manager.position ? ` - ${manager.position}` : "";
    return `${fullName}${position}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl mx-4 my-4 max-h-[95vh] flex flex-col modal-responsive">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEditing ? "Modifier la demande de recrutement" : "Créer une demande de recrutement"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEditing
            ? "Modifiez les informations de la demande"
            : "Remplissez tous les champs pour créer une nouvelle demande"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          <div className="space-y-8">
            
            {/* Section 1: Informations Générales */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                1. Informations Générales
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <InfiniteSelect<Client>
                    label="Client"
                    value={clientId}
                    onChange={handleClientChange}
                    useInfiniteQuery={useGetClientsForSelectInfiniteQuery}
                    itemLabelKey="name"
                    itemValueKey="id"
                    placeholder="Sélectionner un client..."
                    emptyMessage="Aucun client trouvé"
                    error={!!errors.client_id}
                    initialSelectedItems={initialClient}
                  />
                  {errors.client_id && (
                    <p className="mt-1 text-sm text-error-500">{errors.client_id.message}</p>
                  )}
                </div>

                <div>
                  <InfiniteSelect<Manager>
                    label="Manager"
                    value={managerId}
                    onChange={(value) => setValue("manager_id", value)}
                    useInfiniteQuery={useGetClientManagersForSelectInfiniteQuery}
                    queryArg={managerQueryArg}
                    itemLabelKey="displayName"
                    itemValueKey="id"
                    placeholder={clientId ? "Sélectionner un manager..." : "Sélectionner d'abord un client"}
                    emptyMessage="Aucun manager trouvé"
                    error={!!errors.manager_id}
                    disabled={!clientId}
                    initialSelectedItems={initialManager}
                  />
                  {errors.manager_id && (
                    <p className="mt-1 text-sm text-error-500">{errors.manager_id.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label>Titre du poste <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="Ex: Développeur Full Stack React/Node.js"
                    {...register("title")}
                    error={!!errors.title}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-error-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label>Description <span className="text-error-500">*</span></Label>
                  <TextArea
                    placeholder="Description détaillée du poste et des missions..."
                    {...register("description")}
                    error={!!errors.description}
                    rows={4}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-500">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Compétences */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                2. Compétences Requises
              </h3>
              <div>
                <Label>Compétences <span className="text-error-500">*</span></Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Ajouter une compétence (ex: React, Node.js)..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      error={!!errors.required_skills}
                    />
                  </div>
                  <Button type="button" onClick={handleAddSkill}>
                    Ajouter
                  </Button>
                </div>
                {errors.required_skills && (
                  <p className="mt-1 text-sm text-error-500">{errors.required_skills.message}</p>
                )}
                {requiredSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 rounded-lg text-sm font-medium"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-brand-900 dark:hover:text-brand-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Expérience */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                3. Expérience
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Expérience minimum (années)</Label>
                  <Input
                    type="number"
                    placeholder="3"
                    {...register("min_experience", { valueAsNumber: true })}
                    error={!!errors.min_experience}
                  />
                  {errors.min_experience && (
                    <p className="mt-1 text-sm text-error-500">{errors.min_experience.message}</p>
                  )}
                </div>

                <div>
                  <Label>Expérience maximum (années)</Label>
                  <Input
                    type="number"
                    placeholder="7"
                    {...register("max_experience", { valueAsNumber: true })}
                    error={!!errors.max_experience}
                  />
                  {errors.max_experience && (
                    <p className="mt-1 text-sm text-error-500">{errors.max_experience.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Type de Contrat */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                4. Type de Contrat
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Type de contrat <span className="text-error-500">*</span></Label>
                  <select
                    {...register("contract_type")}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                      errors.contract_type
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Sélectionner...</option>
                    {contractTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.contract_type && (
                    <p className="mt-1 text-sm text-error-500">{errors.contract_type.message}</p>
                  )}
                </div>

                {isFreelance && (
                  <>
                    <div>
                      <Label>Durée de mission (mois) <span className="text-error-500">*</span></Label>
                      <Input
                        type="number"
                        placeholder="6"
                        {...register("mission_duration_months", { valueAsNumber: true })}
                        error={!!errors.mission_duration_months}
                      />
                      {errors.mission_duration_months && (
                        <p className="mt-1 text-sm text-error-500">{errors.mission_duration_months.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-8">
                      <input
                        type="checkbox"
                        id="mission_renewable"
                        {...register("mission_renewable")}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <Label htmlFor="mission_renewable" className="mb-0">
                        Mission renouvelable
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 5: Budget */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                5. Budget
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {isFreelance ? (
                  <>
                    <div>
                      <Label>TJM minimum (€)</Label>
                      <Input
                        type="number"
                        placeholder="400"
                        {...register("daily_rate_min", { valueAsNumber: true })}
                        error={!!errors.daily_rate_min}
                      />
                      {errors.daily_rate_min && (
                        <p className="mt-1 text-sm text-error-500">{errors.daily_rate_min.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>TJM maximum (€)</Label>
                      <Input
                        type="number"
                        placeholder="600"
                        {...register("daily_rate_max", { valueAsNumber: true })}
                        error={!!errors.daily_rate_max}
                      />
                      {errors.daily_rate_max && (
                        <p className="mt-1 text-sm text-error-500">{errors.daily_rate_max.message}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Salaire minimum (€/an)</Label>
                      <Input
                        type="number"
                        placeholder="45000"
                        {...register("min_salary", { valueAsNumber: true })}
                        error={!!errors.min_salary}
                      />
                      {errors.min_salary && (
                        <p className="mt-1 text-sm text-error-500">{errors.min_salary.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Salaire maximum (€/an)</Label>
                      <Input
                        type="number"
                        placeholder="55000"
                        {...register("max_salary", { valueAsNumber: true })}
                        error={!!errors.max_salary}
                      />
                      {errors.max_salary && (
                        <p className="mt-1 text-sm text-error-500">{errors.max_salary.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 6: Localisation */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                6. Localisation
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Ville <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="Paris"
                    {...register("location")}
                    error={!!errors.location}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-error-500">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <Label>Pays <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="France"
                    {...register("country")}
                    error={!!errors.country}
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 7: Type de Travail */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                7. Type de Travail
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Mode de travail <span className="text-error-500">*</span></Label>
                  <select
                    {...register("work_type")}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                      errors.work_type
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    }`}
                  >
                    <option value="on_site">Présentiel</option>
                    <option value="remote">Télétravail</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                  {errors.work_type && (
                    <p className="mt-1 text-sm text-error-500">{errors.work_type.message}</p>
                  )}
                </div>

                {isHybrid && (
                  <div>
                    <Label>Jours de télétravail par semaine <span className="text-error-500">*</span></Label>
                    <Input
                      type="number"
                      placeholder="2"
                      min="1"
                      max="5"
                      {...register("remote_days_per_week", { valueAsNumber: true })}
                      error={!!errors.remote_days_per_week}
                    />
                    {errors.remote_days_per_week && (
                      <p className="mt-1 text-sm text-error-500">{errors.remote_days_per_week.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section 8: Langues */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                8. Langues Requises
              </h3>
              <div>
                <Label>Langues <span className="text-error-500">*</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => toggleLanguage(lang.value)}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                        selectedLanguages.includes(lang.value)
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-brand-300"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                {errors.languages && (
                  <p className="mt-1 text-sm text-error-500">{errors.languages.message}</p>
                )}
              </div>
            </div>

            {/* Section 9: Avantages */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                9. Avantages et Primes
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <Label>Avantages sociaux</Label>
                  <TextArea
                    placeholder="Ex: Tickets restaurant, mutuelle, RTT..."
                    {...register("benefits")}
                    error={!!errors.benefits}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Primes</Label>
                  <TextArea
                    placeholder="Ex: Prime annuelle sur objectifs..."
                    {...register("bonuses")}
                    error={!!errors.bonuses}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Part variable</Label>
                  <TextArea
                    placeholder="Ex: Variable trimestrielle sur CA..."
                    {...register("variables")}
                    error={!!errors.variables}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Section 10: Priorité et Statut */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                10. Priorité et Statut
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Priorité <span className="text-error-500">*</span></Label>
                  <select
                    {...register("priority")}
                    className={`h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 ${
                      errors.priority
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    }`}
                  >
                    <option value="low">Basse</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                  {errors.priority && (
                    <p className="mt-1 text-sm text-error-500">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <Label>Statut</Label>
                  <select
                    {...register("status")}
                    className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  >
                    <option value="in_progress">En cours</option>
                    <option value="standby">Standby</option>
                    <option value="abandoned">Abandonnée</option>
                    <option value="filled">Comblée</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 11: Dates et Profils */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                11. Dates et Nombre de Profils
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Controller
                    name="desired_start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="desired_start_date"
                        label="Date de début souhaitée"
                        placeholder="Sélectionner une date"
                        defaultDate={field.value || undefined}
                        onChange={(selectedDates) => {
                          if (selectedDates && selectedDates.length > 0) {
                            const date = selectedDates[0];
                            const isoString = date.toISOString().split("T")[0];
                            setValue("desired_start_date", isoString);
                          } else {
                            setValue("desired_start_date", undefined);
                          }
                        }}
                      />
                    )}
                  />
                </div>

                <div>
                  <Label>Nombre de profils souhaités <span className="text-error-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder="1"
                    min="1"
                    {...register("number_of_profiles", { valueAsNumber: true })}
                    error={!!errors.number_of_profiles}
                  />
                  {errors.number_of_profiles && (
                    <p className="mt-1 text-sm text-error-500">{errors.number_of_profiles.message}</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 p-4 sm:p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enregistrement..." : isEditing ? "Modifier" : "Créer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
