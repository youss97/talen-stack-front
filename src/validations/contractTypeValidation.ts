import * as yup from "yup";

export const contractTypeSchema = yup.object({
  name: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: yup
    .string()
    .required("La description est requise"),
  is_active: yup.boolean(),
  display_order: yup.number().integer().min(0),
});

export type ContractTypeFormData = yup.InferType<typeof contractTypeSchema>;
