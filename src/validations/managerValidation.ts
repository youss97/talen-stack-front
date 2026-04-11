import { z } from "zod";

export const createManagerSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  photo: z.union([z.instanceof(File), z.null(), z.undefined()]).optional(),
});

export type CreateManagerFormData = z.infer<typeof createManagerSchema>;
