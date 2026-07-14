"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";

export default function AdminHomePage() {
  const router = useRouter();
  const { isAuth, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    console.log('🔍 Admin page - État auth:', { isAuth, user: user?.email });
    
    if (isAuth && user) {
      // Page d'accueil = Statistiques pour tous les rôles, SAUF l'espace client
      // qui n'a pas accès aux statistiques (voir usePermissions.ts::canAccessPath).
      const u = user as unknown as {
        company?: { parent_company_id?: string | null };
        client_id?: string | null;
        role?: { code?: string };
      };
      const isClientSpace =
        !!u?.company?.parent_company_id ||
        !!u?.client_id ||
        (u?.role?.code || "").toUpperCase().startsWith("CLIENT_MANAGER");
      router.push(isClientSpace ? '/my-requests' : '/statistics');
    } else if (isAuth === false) {
      // Si pas connecté, rediriger vers la page de connexion (pas la landing)
      console.log('🚫 Utilisateur non connecté, redirection vers /signin');
      router.push('/signin');
    }
  }, [isAuth, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Redirection en cours...
        </p>
      </div>
    </div>
  );
}
