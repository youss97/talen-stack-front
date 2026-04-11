"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  children: ReactNode;
}

export default function PermissionGuard({ children }: PermissionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuth, permissionsReady } = useAppSelector((state) => state.auth);
  const { canAccessPath } = usePermissions();

  useEffect(() => {
    // Only check permissions after they are loaded
    if (isAuth && permissionsReady) {
      if (!canAccessPath(pathname) && pathname !== "/access-denied") {
        router.push("/access-denied");
      }
    }
  }, [isAuth, permissionsReady, pathname, canAccessPath, router]);

  // If user is not authenticated, let AuthGuard handle it
  if (!isAuth) {
    return <>{children}</>;
  }

  // Wait for permissions to load before checking access
  if (!permissionsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargement des permissions...
          </p>
        </div>
      </div>
    );
  }

  // If no access after permissions are ready, show nothing while redirecting
  if (!canAccessPath(pathname) && pathname !== "/access-denied") {
    return null;
  }

  return <>{children}</>;
}
