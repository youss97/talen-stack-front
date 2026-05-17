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
      const userRoleCode = user.role?.code;
      const isSuperAdmin =
        userRoleCode === 'super_admin' ||
        (!user.company && user.role?.level != null && user.role.level >= 999);

      if (isSuperAdmin) {
        router.push('/companies');
        return;
      }

      if (userRoleCode?.startsWith('CLIENT_MANAGER_')) {
        router.push('/my-requests');
        return;
      }

      const firstFeaturePath = user.features?.[0]?.pages?.[0]?.path;
      const redirectPath = firstFeaturePath || "/dashboard";
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
