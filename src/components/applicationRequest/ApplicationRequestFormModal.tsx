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
import MultiSelect from "@/components/form/MultiSelect";
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
import { getCurrencyByCode, DEFAULT_CURRENCY } from "@/lib/currencies";
import StarRating from "@/components/form/StarRating";
import WorkflowStepsEditor, { type WorkflowStep } from "@/components/applicationRequest/WorkflowStepsEditor";
import type { SkillWithLevel, SkillItem } from "@/types/applicationRequest";
import { getSkillName } from "@/types/applicationRequest";

interface ApplicationRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateApplicationRequestFormData) => void;
  applicationRequest?: ApplicationRequest | null;
  isLoading?: boolean;
}

const COUNTRIES = [
  "Maroc", "France", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire",
  "Cameroun", "Belgique", "Suisse", "Canada", "Espagne", "Italie",
  "Allemagne", "Portugal", "Pays-Bas", "Émirats arabes unis", "Qatar", "Arabie Saoudite",
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Maroc: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir", "Meknès", "Oujda", "Kénitra", "Tétouan", "Safi", "Mohammedia", "El Jadida", "Beni Mellal", "Nador"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Strasbourg", "Rennes", "Reims", "Grenoble", "Montpellier", "Dijon", "Angers"],
  Algérie: ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Djelfa", "Sétif"],
  Tunisie: ["Tunis", "Sfax", "Sousse", "Monastir", "Bizerte", "Gabès", "Ariana", "Gafsa"],
  Belgique: ["Bruxelles", "Anvers", "Gand", "Liège", "Bruges", "Namur"],
  Suisse: ["Genève", "Zurich", "Bâle", "Lausanne", "Berne"],
  Canada: ["Montréal", "Toronto", "Vancouver", "Calgary", "Ottawa", "Québec"],
  Espagne: ["Madrid", "Barcelone", "Valence", "Séville", "Bilbao", "Malaga"],
  Italie: ["Rome", "Milan", "Naples", "Turin", "Florence", "Bologne"],
  Allemagne: ["Berlin", "Munich", "Hambourg", "Francfort", "Cologne", "Stuttgart"],
  Portugal: ["Lisbonne", "Porto", "Braga", "Coimbra", "Faro"],
};

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
  const [softSkillInput, setSoftSkillInput] = useState("");
  // Use useState for skills — more reliable than watch()+setValue() for form submission
  const [skillsState, setSkillsState] = useState<SkillWithLevel[]>([]);
  const [softSkillsState, setSoftSkillsState] = useState<string[]>([]);
  // 1.3 — Niveau (étoiles) par langue
  const [languageLevels, setLanguageLevels] = useState<Record<string, number>>({});
  // 1.2 — Étapes du workflow
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("France");

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
      contract_types: [],
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
      soft_skills: [],
      benefits: "",
      bonuses: "",
      variables: "",
      priority: "normal",
      status: "in_progress",
      desired_start_date: undefined,
      number_of_profiles: 1,
    },
  });

  const requiredSkills = skillsState; // kept for backward-compat JSX references
  const softSkills = softSkillsState;
  const clientId = watch("client_id");
  const managerId = watch("manager_id");
  const contractTypes = watch("contract_types") || [];
  const workType = watch("work_type");
  const selectedLanguages = watch("languages") || [];

  const managerQueryArg = useMemo(() => ({ clientId: clientId || "" }), [clientId]);
  const isFreelance = contractTypes.some(v => v?.toLowerCase() === "freelance");
  const hasSalary = contractTypes.some(v => ["CDI", "CDD", "Stage", "Intérim", "Alternance"].includes(v));

  // Devise dynamique — MAD par défaut
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const currencySymbol = getCurrencyByCode(currency)?.symbol || currency;

  // Fetch contract types
  const { data: contractTypesData } = useGetContractTypesQuery({
    page: 1,
    limit: 100,
    is_active: true
  });
  const availableContractTypes = contractTypesData?.data || [];
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
      const parsedSkills = (applicationRequest.required_skills || [])
        .filter((s: any) => s && !Array.isArray(s))
        .map((s: SkillItem) => typeof s === "string" ? { name: s, level: 1 } : s) as SkillWithLevel[];
      setSkillsState(parsedSkills);
      setSoftSkillsState((applicationRequest.soft_skills as string[] | undefined) || []);
      setSelectedCountry(applicationRequest.country || "France");
      // 1.3 — niveaux des langues (gère string[] ou {language, level}[])
      const langLevels: Record<string, number> = {};
      ((applicationRequest.languages || []) as Array<string | { language: string; level?: number }>).forEach((l) => {
        if (typeof l === "string") langLevels[l] = 3;
        else if (l && l.language) langLevels[l.language] = l.level ?? 3;
      });
      setLanguageLevels(langLevels);
      {
        const rawSteps = ((applicationRequest as any).workflow_steps as WorkflowStep[]) || [];
        // Ne garder que les étapes valides (ignore l'ancien format cassé [[],[]...] sans nom)
        const validSteps = rawSteps
          .filter((s) => s && typeof s.name === "string" && s.name.trim())
          .map((s, i) => ({ name: s.name.trim(), order: i }));
        setWorkflowSteps(
          validSteps.length > 0
            ? validSteps
            : [
                { name: "Proposé", order: 0 },
                { name: "Entretien RH", order: 1 },
                { name: "Entretien client", order: 2 },
                { name: "Offre", order: 3 },
              ],
        );
      }
      reset({
        client_id: applicationRequest.client_id,
        manager_id: applicationRequest.manager_id,
        title: applicationRequest.title,
        description: applicationRequest.description,
        required_skills: parsedSkills,
        min_experience: applicationRequest.min_experience,
        max_experience: applicationRequest.max_experience,
        contract_types: applicationRequest.contract_types || (applicationRequest.contract_type ? [applicationRequest.contract_type] : []),
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
        languages: ((applicationRequest.languages || []) as Array<string | { language: string; level?: number }>).map(
          (l) => (typeof l === "string" ? l : l.language),
        ),
        soft_skills: (applicationRequest.soft_skills as string[] | undefined) || [],
        benefits: applicationRequest.benefits || "",
        bonuses: applicationRequest.bonuses || "",
        variables: applicationRequest.variables || "",
        priority: applicationRequest.priority || "normal",
        status: (applicationRequest.status as any) || "in_progress",
        desired_start_date: applicationRequest.desired_start_date?.split("T")[0],
        number_of_profiles: applicationRequest.number_of_profiles || 1,
      });
    } else if (isOpen) {
      setSkillsState([]);
      setSoftSkillsState([]);
      setLanguageLevels({});
      // Étapes par défaut : une nouvelle demande a toujours un workflow concret (personnalisable)
      setWorkflowSteps([
        { name: "Proposé", order: 0 },
        { name: "Entretien RH", order: 1 },
        { name: "Entretien client", order: 2 },
        { name: "Offre", order: 3 },
      ]);
      setSelectedCountry("France");
      // Réinitialiser le formulaire en mode création
      reset({
        client_id: "",
        manager_id: "",
        title: "",
        description: "",
        required_skills: [],
        min_experience: undefined,
        max_experience: undefined,
        contract_types: [],
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
        soft_skills: [],
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
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const already = skillsState.some((s) => s.name === trimmed);
    if (!already) {
      const updated = [...skillsState, { name: trimmed, level: 1 }];
      setSkillsState(updated);
      setValue("required_skills", updated as any);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (nameToRemove: string) => {
    const updated = skillsState.filter((s) => s.name !== nameToRemove);
    setSkillsState(updated);
    setValue("required_skills", updated as any);
  };

  const handleUpdateSkillLevel = (nameToUpdate: string, level: number) => {
    const updated = skillsState.map((s) => s.name === nameToUpdate ? { ...s, level } : s);
    setSkillsState(updated);
    setValue("required_skills", updated as any);
  };

  const handleAddSoftSkill = () => {
    const trimmed = softSkillInput.trim();
    if (!trimmed || softSkillsState.includes(trimmed)) return;
    const updated = [...softSkillsState, trimmed];
    setSoftSkillsState(updated);
    setValue("soft_skills", updated as any);
    setSoftSkillInput("");
  };

  const handleRemoveSoftSkill = (name: string) => {
    const updated = softSkillsState.filter((s) => s !== name);
    setSoftSkillsState(updated);
    setValue("soft_skills", updated as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSoftSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSoftSkill();
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      setValue("languages", selectedLanguages.filter(l => l !== lang));
    } else {
      setValue("languages", [...selectedLanguages, lang]);
      setLanguageLevels((prev) => (prev[lang] ? prev : { ...prev, [lang]: 3 }));
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

      <form onSubmit={handleSubmit(
        (data) => onSubmit({
          ...data,
          currency,
          required_skills: skillsState,
          soft_skills: softSkillsState,
          // 1.3 — langues avec niveau (étoiles)
          languages: ((data.languages as string[]) || []).map((l) => ({ language: l, level: languageLevels[l] ?? 3 })),
          // 1.2 — étapes du workflow
          workflow_steps: workflowSteps.filter((s) => s.name.trim()).map((s, i) => ({ name: s.name.trim(), order: i })),
        } as any),
        () => {
          // Scroll to first error when validation fails
          setTimeout(() => {
            const firstError = document.querySelector('[class*="text-error-500"]');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
        }
      )} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 custom-scrollbar">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-error-50 border border-error-200 dark:bg-error-500/10 dark:border-error-500/30 text-error-700 dark:text-error-400 text-sm">
              Veuillez corriger les {Object.keys(errors).length} erreur(s) avant de soumettre le formulaire.
            </div>
          )}
          <div className="space-y-8">
            
            {/* Section 1: Informations Générales */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                1. Informations Générales
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <InfiniteSelect<Client>
                    label={<>Client <span className="text-error-500">*</span></>}
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
                    label={<>Manager <span className="text-error-500">*</span></>}
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
                  <div className="mt-3 flex flex-col gap-2">
                    {(requiredSkills as SkillItem[]).map((skill, index) => {
                      const name = getSkillName(skill);
                      const level = typeof skill === "string" ? 1 : skill.level;
                      return (
                        <div
                          key={index}
                          className="inline-flex items-center justify-between gap-3 px-3 py-2 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 rounded-lg text-sm font-medium"
                        >
                          <span className="truncate">{name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StarRating
                              value={level}
                              onChange={(v) => handleUpdateSkillLevel(name, v)}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(name)}
                              className="text-brand-500 hover:text-brand-900 dark:hover:text-brand-300 text-base leading-none"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section Softskills */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                3. Softskills
              </h3>
              <div>
                <Label>Compétences comportementales</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Ex: Leadership, Communication, Adaptabilité..."
                      value={softSkillInput}
                      onChange={(e) => setSoftSkillInput(e.target.value)}
                      onKeyDown={handleSoftSkillKeyDown}
                    />
                  </div>
                  <Button type="button" onClick={handleAddSoftSkill}>
                    Ajouter
                  </Button>
                </div>
                {softSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {softSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-500/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSoftSkill(skill)}
                          className="text-purple-500 hover:text-purple-900 dark:hover:text-purple-300 text-base leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Expérience */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                4. Expérience
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

            {/* Section 5: Type de Contrat */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                4. Type de Contrat
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <MultiSelect
                    label="Type(s) de contrat *"
                    options={availableContractTypes.map((type) => ({
                      value: type.name,
                      text: type.name,
                      selected: contractTypes.includes(type.name),
                    }))}
                    defaultSelected={contractTypes}
                    onChange={(selected) => setValue("contract_types", selected, { shouldValidate: true })}
                    placeholder="Sélectionner un ou plusieurs types..."
                  />
                  {errors.contract_types && (
                    <p className="mt-1 text-sm text-error-500">{errors.contract_types.message}</p>
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

              {/* Sélecteur de devise */}
              <div className="mb-4">
                <Label>Devise</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:focus:border-brand-800"
                >
                  <option value="MAD">MAD — Dirham marocain (د.م.)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="USD">USD — Dollar américain ($)</option>
                  <option value="GBP">GBP — Livre sterling (£)</option>
                  <option value="TND">TND — Dinar tunisien (د.ت)</option>
                  <option value="DZD">DZD — Dinar algérien (د.ج)</option>
                  <option value="AED">AED — Dirham des EAU (د.إ)</option>
                  <option value="SAR">SAR — Riyal saoudien (﷼)</option>
                </select>
              </div>

              {hasSalary && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-4">
                  {isFreelance && <div className="sm:col-span-2 text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide border-b border-green-200 dark:border-green-800 pb-1">Rémunération CDI / Salarié</div>}
                  <div>
                    <Label>Salaire minimum ({currencySymbol}/mois)</Label>
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
                    <Label>Salaire maximum ({currencySymbol}/mois)</Label>
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
                </div>
              )}

              {isFreelance && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {hasSalary && <div className="sm:col-span-2 text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide border-b border-purple-200 dark:border-purple-800 pb-1">Rémunération Freelance / TJM</div>}
                  <div>
                    <Label>TJM minimum ({currencySymbol})</Label>
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
                    <Label>TJM maximum ({currencySymbol})</Label>
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
                </div>
              )}

              {!hasSalary && !isFreelance && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Salaire minimum ({currencySymbol}/mois)</Label>
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
                    <Label>Salaire maximum ({currencySymbol}/mois)</Label>
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
                </div>
              )}
            </div>

            {/* Section 6: Localisation */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                6. Localisation
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <Label>Pays <span className="text-error-500">*</span></Label>
                  <input
                    list="countries-datalist"
                    placeholder="Tapez pour rechercher un pays..."
                    autoComplete="off"
                    {...register("country", {
                      onChange: (e) => {
                        setSelectedCountry(e.target.value);
                        setValue("location", "");
                      },
                    })}
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 bg-white dark:bg-gray-900 dark:text-white/90 ${errors.country ? "border-error-500 focus:ring-error-500/10" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
                  />
                  <datalist id="countries-datalist">
                    {COUNTRIES.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.country && <p className="mt-1 text-sm text-error-500">{errors.country.message}</p>}
                </div>

                <div>
                  <Label>Ville <span className="text-error-500">*</span></Label>
                  <input
                    list="cities-datalist"
                    placeholder="Tapez pour rechercher une ville..."
                    autoComplete="off"
                    {...register("location")}
                    className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 bg-white dark:bg-gray-900 dark:text-white/90 ${errors.location ? "border-error-500 focus:ring-error-500/10" : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"}`}
                  />
                  <datalist id="cities-datalist">
                    {(CITIES_BY_COUNTRY[selectedCountry] || []).map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.location && <p className="mt-1 text-sm text-error-500">{errors.location.message}</p>}
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
                {/* 1.3 — Niveau requis par langue (étoiles) */}
                {selectedLanguages.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedLanguages.map((langValue) => {
                      const label = LANGUAGES.find((l) => l.value === langValue)?.label || langValue;
                      return (
                        <div key={langValue} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                          <StarRating
                            value={languageLevels[langValue] ?? 3}
                            onChange={(v) => setLanguageLevels((prev) => ({ ...prev, [langValue]: v }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.languages && (
                  <p className="mt-1 text-sm text-error-500">{errors.languages.message}</p>
                )}
              </div>
            </div>

            {/* Section 8b: Workflow / étapes (1.2) */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Workflow du recrutement
              </h3>
              <WorkflowStepsEditor value={workflowSteps} onChange={setWorkflowSteps} />
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

            {/* Notes */}
            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl mt-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                Notes
              </h3>
              <div className="space-y-4">
                <div>
                  <Label>Note client</Label>
                  <TextArea
                    placeholder="Note visible par le client et l'équipe RH..."
                    {...register("note_client" as any)}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-400">Visible par le client et l'équipe RH</p>
                </div>
                <div>
                  <Label>Note interne</Label>
                  <TextArea
                    placeholder="Note interne (non visible par le client)..."
                    {...register("note_interne" as any)}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-400">Uniquement visible par l'équipe RH</p>
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
