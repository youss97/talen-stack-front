import * as yup from "yup";

export const applicationStatusSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: yup
    .string()
    .required("La description est requise"),
  color: yup.string(),
  is_active: yup.boolean(),
  is_final: yup.boolean(),
  display_order: yup.number().integer().min(0),
});

export type ApplicationStatusFormData = yup.InferType<typeof applicationStatusSchema>;
