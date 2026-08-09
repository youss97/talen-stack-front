"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/hooks";
import { useVerifyUserQuery } from "@/lib/services/authApi";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  // localStorage n'existe pas côté serveur — lire le token au premier rendu créerait un
  // écart SSR/client (hydration mismatch). On le lit après montage uniquement ; tant que ce
  // n'est pas fait, le rendu (serveur et client) reste identique (spinner via tokenChecked=false).
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("token"));
    setTokenChecked(true);
  }, []);

  // Sans token en local, on sait déjà que l'utilisateur n'est pas connecté — inutile
  // d'appeler /auth/me (401 garanti) juste pour le rediriger vers /signin.
  const { isLoading: isVerifying } = useVerifyUserQuery(undefined, { skip: !tokenChecked || !hasToken });
  const { isAuth } = useAppSelector((state) => state.auth);
  const isLoading = !tokenChecked || isVerifying;

  useEffect(() => {
    if (!isLoading && !isAuth) {
      router.push("/signin");
    }
  }, [isLoading, isAuth, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return null;
  }

  return <>{children}</>;
}
