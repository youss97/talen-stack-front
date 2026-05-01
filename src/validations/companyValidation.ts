import * as yup from "yup";

export const createCompanySchema = yup.object({
  name: yup
    .string()
    .required("La raison sociale est requise")
    .min(2, "La raison sociale doit contenir au moins 2 caractères"),
  ice: yup
    .string()
    .optional()
    .test("ice", "L'ICE doit contenir exactement 15 chiffres", (value) => {
      if (!value || value === "") return true;
      return /^[0-9]{15}$/.test(value);
    }),
  address: yup.string().optional(),
  city: yup.string().optional(),
  postal_code: yup.string().optional(),
  country: yup.string().optional(),
  phone: yup
    .string()
    .required("Le téléphone est requis")
    .matches(/^\+?[0-9]{10,15}$/, "Le numéro de téléphone doit contenir entre 10 et 15 chiffres"),
  email: yup
    .string()
    .required("L'email de l'entreprise est requis")
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
  adminPhone: yup.string().optional(),
  adminPosition: yup.string().optional(),
});

export const updateCompanySchema = yup.object({
  name: yup.string().min(2, "La raison sociale doit contenir au moins 2 caractères"),
  ice: yup.string().test("ice", "L'ICE doit contenir exactement 15 chiffres", (value) => {
    if (!value || value === "") return true;
    return /^[0-9]{15}$/.test(value);
  }),
  address: yup.string(),
  city: yup.string(),
  postal_code: yup.string(),
  country: yup.string(),
  phone: yup.string().test("phone", "Numéro de téléphone invalide", (value) => {
    if (!value || value === "") return true;
    return /^\+?[0-9]{10,15}$/.test(value);
  }),
  email: yup.string().email("Email invalide"),
  status: yup.string().oneOf(["active", "inactive"], "Statut invalide"),
  adminPhone: yup.string().optional(),
  adminPosition: yup.string().optional(),
});

export type CreateCompanyFormData = yup.InferType<typeof createCompanySchema> & {
  logo?: File | null;
  adminPhoto?: File | null;
};
export type UpdateCompanyFormData = yup.InferType<typeof updateCompanySchema> & {
  logo?: File | null;
};
