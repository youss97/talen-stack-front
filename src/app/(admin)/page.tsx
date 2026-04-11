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
      // Si l'utilisateur est un client manager, rediriger vers "Mes offres"
      const userRoleCode = user.role?.code;
      if (userRoleCode?.startsWith('CLIENT_MANAGER_')) {
        console.log('👤 Client Manager détecté, redirection vers /my-requests');
        router.push('/my-requests');
        return;
      }

      // Sinon, rediriger vers le premier chemin autorisé
      const firstFeaturePath = user.features?.[0]?.pages?.[0]?.path;
      const redirectPath = firstFeaturePath || "/dashboard";
      
      console.log('🎯 Redirection depuis admin page vers:', redirectPath);
      router.push(redirectPath);
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
