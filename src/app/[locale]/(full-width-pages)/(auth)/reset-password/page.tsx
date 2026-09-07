import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe | Talent Stack",
  description: "Choisissez un nouveau mot de passe pour votre compte Talent Stack",
};

export default function ResetPassword() {
  return <ResetPasswordForm />;
}
