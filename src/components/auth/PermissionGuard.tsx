"use client";

import type { ReactNode } from "react";
import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  children: ReactNode;
}

export default function PermissionGuard({ children }: PermissionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuth, permissionsReady, user } = useAppSelector((state) => state.auth);
  const { canAccessPath } = usePermissions();

  // Super admin bypasses ALL permission checks — check directly here as a hard override
  const isSuperAdmin = !!(
    user?.role?.code === 'super_admin' ||
    (!user?.company && user?.role?.level != null && user.role.level >= 999)
  );

  const checkAndRedirect = useCallback(() => {
    if (isAuth && permissionsReady && user) {
      if (isSuperAdmin) {
        // Super admin cannot access integrations or agenda
        if (pathname === "/integrations" || pathname === "/agenda") {
          router.push("/companies");
        }
        return;
      }
      if (!canAccessPath(pathname) && pathname !== "/access-denied") {
        router.push("/access-denied");
      }
    }
  }, [isAuth, permissionsReady, user, isSuperAdmin, pathname, canAccessPath, router]);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  if (!isAuth) {
    return <>{children}</>;
  }

  if (!permissionsReady || !user) {
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

  // Super admin cannot access integrations or agenda — redirect to companies
  if (isSuperAdmin) {
    if (pathname === "/integrations" || pathname === "/agenda") {
      return null; // effect will redirect
    }
    return <>{children}</>;
  }

  if (!canAccessPath(pathname) && pathname !== "/access-denied") {
    return null;
  }

  return <>{children}</>;
}
