import * as yup from "yup";

export const createClientSchema = yup.object({
  name: yup
    .string()
    .required("La raison sociale est requise")
    .min(2, "La raison sociale doit contenir au moins 2 caractères"),
  ice: yup
    .string()
    .required("L'ICE est requis")
    .matches(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres"),
  address: yup
    .string()
    .required("L'adresse est requise"),
  city: yup
    .string()
    .required("La ville est requise"),
  postal_code: yup
    .string()
    .optional(),
  country: yup
    .string()
    .required("Le pays est requis"),
  phone: yup
    .string()
    .required("Le téléphone est requis"),
  email: yup
    .string()
    .required("L'email est requis")
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
  adminPhone: yup
    .string()
    .required("Le téléphone de l'administrateur est requis"),
  adminPosition: yup
    .string()
    .optional(),
});

export const updateClientSchema = yup.object({
  name: yup
    .string()
    .min(2, "La raison sociale doit contenir au moins 2 caractères"),
  ice: yup
    .string()
    .matches(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres")
    .optional(),
  address: yup.string(),
  city: yup.string(),
  postal_code: yup.string(),
  country: yup.string(),
  phone: yup.string(),
  email: yup.string().email("Email invalide"),
  status: yup.string().oneOf(["active", "inactive"], "Statut invalide"),
});

export type CreateClientFormData = yup.InferType<typeof createClientSchema> & {
  logo?: File | string | null;
  adminPhoto?: File | string | null;
};
export type UpdateClientFormData = yup.InferType<typeof updateClientSchema> & {
  logo?: File | string | null;
};
