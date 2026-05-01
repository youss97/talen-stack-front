import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | Talent Stack",
  description: "Connectez-vous à votre compte Talent Stack",
};

export default function SignIn() {
  return <SignInForm />;
}
