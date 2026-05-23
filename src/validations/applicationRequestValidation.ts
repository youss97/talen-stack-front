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
    .min(1, "Au moins une compétence est requise")
    .required("Les compétences sont requises"),

  // Expérience
  min_experience: yup
    .number()
    .typeError("Veuillez saisir un nombre d'années valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "L'expérience doit être positive")
    .nullable(),
  max_experience: yup
    .number()
    .typeError("Veuillez saisir un nombre d'années valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "L'expérience doit être positive")
    .nullable()
    .test('is-greater', "L'expérience max doit être supérieure ou égale au minimum", function(value) {
      const { min_experience } = this.parent;
      if (!value || !min_experience) return true;
      return value >= min_experience;
    }),

  // Type de contrat
  contract_types: yup
    .array()
    .of(yup.string().required())
    .min(1, "Au moins un type de contrat est requis")
    .required("Le type de contrat est requis"),

  // Freelance
  mission_duration_months: yup
    .number()
    .typeError("Veuillez saisir une durée valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(1, "La durée doit être d'au moins 1 mois")
    .nullable()
    .when('contract_types', {
      is: (val: string[]) => val?.some(v => v?.toLowerCase() === 'freelance'),
      then: (schema) => schema.required("La durée de mission est requise pour un freelance"),
    }),
  mission_renewable: yup
    .boolean()
    .nullable(),

  // Budget
  min_salary: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le salaire doit être positif")
    .nullable(),
  max_salary: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le salaire doit être positif")
    .nullable()
    .test('is-greater', "Le salaire maximum doit être supérieur ou égal au minimum", function(value) {
      const { min_salary } = this.parent;
      if (!value || !min_salary) return true;
      return value >= min_salary;
    }),
  daily_rate_min: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le TJM doit être positif")
    .nullable(),
  daily_rate_max: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le TJM doit être positif")
    .nullable()
    .test('is-greater', "Le TJM maximum doit être supérieur ou égal au minimum", function(value) {
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
    .typeError("Veuillez saisir un nombre de jours valide")
    .transform((v) => (isNaN(v) ? null : v))
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

  // Softskills
  soft_skills: yup
    .array()
    .of(yup.string().required())
    .nullable(),

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
    .typeError("Veuillez saisir un nombre valide")
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
  required_skills: yup.array(),
  min_experience: yup
    .number()
    .typeError("Veuillez saisir un nombre d'années valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "L'expérience doit être positive")
    .nullable(),
  max_experience: yup
    .number()
    .typeError("Veuillez saisir un nombre d'années valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "L'expérience doit être positive")
    .nullable(),
  contract_type: yup.string(),
  contract_types: yup.array().of(yup.string().required()),
  mission_duration_months: yup
    .number()
    .typeError("Veuillez saisir une durée valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(1, "La durée doit être d'au moins 1 mois")
    .nullable(),
  mission_renewable: yup.boolean().nullable(),
  min_salary: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le salaire doit être positif")
    .nullable(),
  max_salary: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le salaire doit être positif")
    .nullable(),
  daily_rate_min: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le TJM doit être positif")
    .nullable(),
  daily_rate_max: yup
    .number()
    .typeError("Veuillez saisir un montant valide")
    .transform((v) => (isNaN(v) ? null : v))
    .min(0, "Le TJM doit être positif")
    .nullable(),
  location: yup.string(),
  country: yup.string(),
  work_type: yup
    .string()
    .oneOf(["on_site", "remote", "hybrid"], "Type de travail invalide"),
  remote_days_per_week: yup
    .number()
    .typeError("Veuillez saisir un nombre de jours valide")
    .transform((v) => (isNaN(v) ? null : v))
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
    .typeError("Veuillez saisir un nombre valide")
    .min(1, "Au moins 1 profil requis"),
  currency: yup.string().default("MAD"),
});

export type CreateApplicationRequestFormData = yup.InferType<typeof createApplicationRequestSchema>;
export type UpdateApplicationRequestFormData = yup.InferType<typeof updateApplicationRequestSchema>;
