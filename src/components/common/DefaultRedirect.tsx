"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { useAppSelector } from "@/lib/hooks";

export default function DefaultRedirect() {
  const router = useRouter();
  const { allowedPaths } = usePermissions();
  const { permissionsReady, user } = useAppSelector((state) => state.auth);

  const isSuperAdmin = !!(
    user?.role?.code === 'super_admin' ||
    (!user?.company && user?.role?.level != null && user.role.level >= 999)
  );

  useEffect(() => {
    if (permissionsReady) {
      if (isSuperAdmin) {
        router.replace("/companies");
        return;
      }
      const firstPath = allowedPaths[0] || "/dashboard";
      router.replace(firstPath);
    }
  }, [permissionsReady, isSuperAdmin, allowedPaths, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Redirection...
        </p>
      </div>
    </div>
  );
}
