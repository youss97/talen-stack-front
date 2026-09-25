import * as yup from "yup";

export const createUserSchema = yup.object({
  email: yup
    .string()
    .required("L'email est requis")
    .email("Email invalide"),
  // Identifiant de connexion — optionnel (reprend l'email par défaut côté backend), et pas
  // nécessairement une adresse email valide (ex. "youssefmehri+hutchinson").
  login: yup.string().optional(),
  password: yup
    .string()
    .required("Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  first_name: yup
    .string()
    .required("Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  role_id: yup.string().required("Le rôle est requis"),
  phone: yup.string().optional(),
  status: yup
    .string()
    .oneOf(["active", "inactive"], "Statut invalide")
    .required("Le statut est requis"),
  internal_note: yup.string().optional(),
});

export const updateUserSchema = yup.object({
  email: yup.string().email("Email invalide"),
  login: yup.string().optional(),
  password: yup
    .string()
    .optional()
    .test(
      "min-length",
      "Le mot de passe doit contenir au moins 8 caractères",
      (value) => !value || value.length >= 8
    ),
  first_name: yup
    .string()
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: yup
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  role_id: yup.string(),
  phone: yup.string().optional(),
  status: yup.string().oneOf(["active", "inactive"], "Statut invalide"),
  internal_note: yup.string().optional(),
});

export type CreateUserFormData = yup.InferType<typeof createUserSchema> & {
  photo?: File | null;
};
export type UpdateUserFormData = yup.InferType<typeof updateUserSchema> & {
  photo?: File | null;
};
