import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié | Talent Stack",
  description: "Réinitialisez votre mot de passe Talent Stack",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}
