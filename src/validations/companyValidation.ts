import * as yup from "yup";

export const createCompanySchema = yup.object({
  name: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  siret: yup
    .string()
    .required("Le SIRET est requis")
    .matches(/^[0-9]{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  address: yup.string().optional(),
  city: yup.string().optional(),
  postal_code: yup
    .string()
    .optional()
    .test('postal-code', 'Le code postal doit contenir 5 chiffres', function(value) {
      if (!value || value === '') return true; // Optional field
      return /^[0-9]{5}$/.test(value);
    }),
  country: yup.string().optional(),
  phone: yup
    .string()
    .optional()
    .test('phone', 'Numéro de téléphone invalide', function(value) {
      if (!value || value === '') return true; // Optional field
      return /^\+?[0-9]{10,15}$/.test(value);
    }),
  email: yup
    .string()
    .optional()
    .email("Email invalide"),
  status: yup
    .string()
    .oneOf(["active", "inactive"], "Statut invalide")
    .required("Le statut est requis"),
  adminEmail: yup
    .string()
    .required("L'email de l'administrateur est requis")
    .email("Email invalide"),
  adminPassword: yup
    .string()
    .required("Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  adminFirstName: yup
    .string()
    .required("Le prénom de l'administrateur est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  adminLastName: yup
    .string()
    .required("Le nom de l'administrateur est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
});

export const updateCompanySchema = yup.object({
  name: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  siret: yup
    .string()
    .matches(/^[0-9]{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  address: yup.string(),
  city: yup.string(),
  postal_code: yup
    .string()
    .test('postal-code', 'Le code postal doit contenir 5 chiffres', function(value) {
      if (!value || value === '') return true; // Optional field
      return /^[0-9]{5}$/.test(value);
    }),
  country: yup.string(),
  phone: yup
    .string()
    .test('phone', 'Numéro de téléphone invalide', function(value) {
      if (!value || value === '') return true; // Optional field
      return /^\+?[0-9]{10,15}$/.test(value);
    }),
  email: yup
    .string()
    .email("Email invalide"),
  status: yup
    .string()
    .oneOf(["active", "inactive"], "Statut invalide"),
});

export type CreateCompanyFormData = yup.InferType<typeof createCompanySchema> & {
  logo?: File | null;
  adminPhoto?: File | null;
};
export type UpdateCompanyFormData = yup.InferType<typeof updateCompanySchema> & {
  logo?: File | null;
};
