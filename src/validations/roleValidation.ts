import * as yup from "yup";

export const createRoleSchema = yup.object({
  name: yup.string().required("Le nom du rôle est requis"),
  description: yup.string().required("La description est requise"),
});

export const updateRoleSchema = yup.object({
  name: yup.string().required("Le nom du rôle est requis"),
  description: yup.string().required("La description est requise"),
});

export type CreateRoleFormData = yup.InferType<typeof createRoleSchema>;
export type UpdateRoleFormData = yup.InferType<typeof updateRoleSchema>;
