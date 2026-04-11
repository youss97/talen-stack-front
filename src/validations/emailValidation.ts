import { z } from "zod";

export const sendEmailSchema = z.object({
  subject: z.string().min(1, "Le sujet est requis"),
  body: z.string().min(1, "Le message est requis"),
  recipientType: z.enum(["candidates", "clients", "users", "managers"], {
    required_error: "Le type de destinataire est requis",
  }),
  recipients: z.array(z.string().email("Email invalide")).min(1, "Au moins un destinataire est requis"),
  scheduled_at: z.string().optional(),
});

export type SendEmailFormData = z.infer<typeof sendEmailSchema>;
