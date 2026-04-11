import * as yup from "yup";

export const createCVSchema = yup.object({
  file: yup.mixed<File>().required("Le fichier CV est requis"),
  candidate_email: yup.string().email("Email invalide").required("L'email est requis"),
  candidate_phone: yup.string().required("Le téléphone est requis"),
  candidate_first_name: yup.string().required("Le prénom est requis"),
  candidate_last_name: yup.string().required("Le nom est requis"),
  skills: yup.array().of(yup.string()).optional(),
  total_experience: yup.number()
    .transform((value, originalValue) => originalValue === "" ? undefined : value)
    .required("L'expérience est requise"),
  last_education: yup.string().required("La formation est requise"),
  last_position: yup.string().required("Le poste est requis"),
  industry_experience: yup.string().required("Le secteur d'activité est requis"),
  geographic_mobility: yup.string().required("Champs requis"),
  contract_type_preferences: yup.string().required("Champs requis"),
  remote_preferred: yup.boolean().optional(),
  status: yup.string().oneOf(["new", "reviewed", "shortlisted", "interviewed", "hired", "rejected", "archived"], "Champs requis").required("Champs requis"),
});

export const updateCVSchema = yup.object({
  candidate_email: yup.string().email("Email invalide").required("L'email est requis"),
  candidate_phone: yup.string().required("Le téléphone est requis"),
  candidate_first_name: yup.string().required("Le prénom est requis"),
  candidate_last_name: yup.string().required("Le nom est requis"),
  skills: yup.array().of(yup.string()).optional(),
  total_experience: yup.number()
    .transform((value, originalValue) => originalValue === "" ? undefined : value)
    .required("L'expérience est requise"),
  last_education: yup.string().required("La formation est requise"),
  last_position: yup.string().required("Le poste est requis"),
  industry_experience: yup.string().required("Le secteur d'activité est requis"),
  geographic_mobility: yup.string().required("Champs requis"),
  contract_type_preferences: yup.string().required("Champs requis"),
  remote_preferred: yup.boolean().optional(),
  status: yup.string().oneOf(["new", "reviewed", "shortlisted", "interviewed", "hired", "rejected", "archived"], "Champs requis").required("Champs requis"),
});

export type CreateCVFormData = yup.InferType<typeof createCVSchema>;
export type UpdateCVFormData = yup.InferType<typeof updateCVSchema>;
