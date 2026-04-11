"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { useVerifyUserQuery } from "@/lib/services/authApi";

interface GuestGuardProps {
  children: ReactNode;
}

export default function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { isLoading } = useVerifyUserQuery();
  const { isAuth } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Si l'utilisateur est déjà authentifié, rediriger vers la page d'accueil
    if (!isLoading && isAuth) {
      router.push("/");
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

  // Si l'utilisateur est authentifié, ne rien afficher (redirection en cours)
  if (isAuth) {
    return null;
  }

  // Si l'utilisateur n'est pas authentifié, afficher la page de connexion
  return <>{children}</>;
}
