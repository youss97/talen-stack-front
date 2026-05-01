import * as yup from "yup";

export const createApplicationRequestSchema = yup.object({
  client_id: yup
    .string()
    .required("Le client est requis"),
  manager_id: yup
    .string()
    .required("Le manager est requis"),
  title: yup
    .string()
    .required("Le titre est requis")
    .min(2, "Le titre doit contenir au moins 2 caractères"),
  description: yup
    .string()
    .required("La description est requise"),
  required_skills: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins une compétence est requise")
    .required("Les compétences sont requises"),
  
  // Expérience
  min_experience: yup
    .number()
    .min(0, "L'expérience doit être positive")
    .nullable(),
  max_experience: yup
    .number()
    .min(0, "L'expérience doit être positive")
    .nullable()
    .test('is-greater', 'L\'expérience max doit être >= min', function(value) {
      const { min_experience } = this.parent;
      if (!value || !min_experience) return true;
      return value >= min_experience;
    }),
  
  // Type de contrat
  contract_type: yup
    .string()
    .required("Le type de contrat est requis"),
  
  // Freelance
  mission_duration_months: yup
    .number()
    .min(1, "La durée doit être d'au moins 1 mois")
    .nullable()
    .when('contract_type', {
      is: (val: string) => val?.toLowerCase() === 'freelance',
      then: (schema) => schema.required("La durée de mission est requise pour un freelance"),
    }),
  mission_renewable: yup
    .boolean()
    .nullable(),
  
  // Budget
  min_salary: yup
    .number()
    .min(0, "Le salaire doit être positif")
    .nullable(),
  max_salary: yup
    .number()
    .min(0, "Le salaire doit être positif")
    .nullable()
    .test('is-greater', 'Le salaire max doit être >= min', function(value) {
      const { min_salary } = this.parent;
      if (!value || !min_salary) return true;
      return value >= min_salary;
    }),
  daily_rate_min: yup
    .number()
    .min(0, "Le TJM doit être positif")
    .nullable(),
  daily_rate_max: yup
    .number()
    .min(0, "Le TJM doit être positif")
    .nullable()
    .test('is-greater', 'Le TJM max doit être >= min', function(value) {
      const { daily_rate_min } = this.parent;
      if (!value || !daily_rate_min) return true;
      return value >= daily_rate_min;
    }),
  
  // Localisation
  location: yup
    .string()
    .required("La ville est requise"),
  country: yup
    .string()
    .required("Le pays est requis"),
  
  // Type de travail
  work_type: yup
    .string()
    .oneOf(["on_site", "remote", "hybrid"], "Type de travail invalide")
    .required("Le type de travail est requis"),
  remote_days_per_week: yup
    .number()
    .min(1, "Au moins 1 jour")
    .max(5, "Maximum 5 jours")
    .nullable()
    .when('work_type', {
      is: 'hybrid',
      then: (schema) => schema.required("Le nombre de jours de télétravail est requis pour le mode hybride"),
    }),
  remote_possible: yup
    .boolean()
    .nullable(),
  
  // Langues
  languages: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins une langue est requise")
    .required("Les langues sont requises"),
  
  // Avantages
  benefits: yup
    .string()
    .nullable(),
  bonuses: yup
    .string()
    .nullable(),
  variables: yup
    .string()
    .nullable(),
  
  // Priorité
  priority: yup
    .string()
    .oneOf(["low", "normal", "high", "urgent"], "Priorité invalide")
    .required("La priorité est requise"),
  
  // Statut
  status: yup
    .string()
    .oneOf(["in_progress", "standby", "abandoned", "filled", "open"], "Statut invalide")
    .nullable(),
  
  // Dates
  desired_start_date: yup
    .string()
    .nullable(),
  
  // Nombre de profils
  number_of_profiles: yup
    .number()
    .min(1, "Au moins 1 profil requis")
    .required("Le nombre de profils est requis"),

  // Devise
  currency: yup.string().default("MAD"),
});

export const updateApplicationRequestSchema = yup.object({
  title: yup
    .string()
    .min(2, "Le titre doit contenir au moins 2 caractères"),
  description: yup.string(),
  required_skills: yup
    .array()
    .of(yup.string().required()),
  min_experience: yup
    .number()
    .min(0, "L'expérience doit être positive")
    .nullable(),
  max_experience: yup
    .number()
    .min(0, "L'expérience doit être positive")
    .nullable(),
  contract_type: yup.string(),
  mission_duration_months: yup
    .number()
    .min(1, "La durée doit être d'au moins 1 mois")
    .nullable(),
  mission_renewable: yup.boolean().nullable(),
  min_salary: yup
    .number()
    .min(0, "Le salaire doit être positif")
    .nullable(),
  max_salary: yup
    .number()
    .min(0, "Le salaire doit être positif")
    .nullable(),
  daily_rate_min: yup
    .number()
    .min(0, "Le TJM doit être positif")
    .nullable(),
  daily_rate_max: yup
    .number()
    .min(0, "Le TJM doit être positif")
    .nullable(),
  location: yup.string(),
  country: yup.string(),
  work_type: yup
    .string()
    .oneOf(["on_site", "remote", "hybrid"], "Type de travail invalide"),
  remote_days_per_week: yup
    .number()
    .min(1, "Au moins 1 jour")
    .max(5, "Maximum 5 jours")
    .nullable(),
  remote_possible: yup.boolean().nullable(),
  languages: yup
    .array()
    .of(yup.string().required()),
  benefits: yup.string().nullable(),
  bonuses: yup.string().nullable(),
  variables: yup.string().nullable(),
  priority: yup
    .string()
    .oneOf(["low", "normal", "high", "urgent"], "Priorité invalide"),
  status: yup
    .string()
    .oneOf(["in_progress", "standby", "abandoned", "filled"], "Statut invalide"),
  desired_start_date: yup.string().nullable(),
  number_of_profiles: yup
    .number()
    .min(1, "Au moins 1 profil requis"),
  currency: yup.string().default("MAD"),
});

export type CreateApplicationRequestFormData = yup.InferType<typeof createApplicationRequestSchema>;
export type UpdateApplicationRequestFormData = yup.InferType<typeof updateApplicationRequestSchema>;
