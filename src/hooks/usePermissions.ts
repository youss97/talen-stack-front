"use client";
import { useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import type { UserFeature, UserPage, UserAction } from "@/types/auth";

interface UsePermissionsReturn {
  features: UserFeature[];
  allowedPaths: string[];
  canAccessPath: (path: string) => boolean;
  canDoAction: (actionCode: string) => boolean;
  getActionsForPath: (path: string) => UserAction[];
  getPageByPath: (path: string) => UserPage | undefined;
}

export function usePermissions(): UsePermissionsReturn {
  const user = useSelector((state: RootState) => state.auth.user);
  const features = user?.features || [];

  const allowedPaths = useMemo(() => {
    const paths: string[] = [];
    features.forEach((feature) => {
      feature.pages?.forEach((page) => {
        if (page.path) {
          paths.push(page.path);
        }
      });
    });
    return paths;
  }, [features]);

  const allActions = useMemo(() => {
    const actions: UserAction[] = [];
    features.forEach((feature) => {
      feature.pages?.forEach((page) => {
        page.actions?.forEach((action) => {
          actions.push(action);
        });
      });
    });
    return actions;
  }, [features]);

  const canAccessPath = useCallback((path: string): boolean => {
    if (!path || typeof path !== "string") return false;
    if (!user) return false;

    const normalizedPath = path.replace(/\/$/, "") || "/";

    const isSuperAdmin = user.role?.code === 'super_admin' || (!user.company && user.role?.level >= 999);
    if (isSuperAdmin) {
      if (normalizedPath === "/integrations" || normalizedPath === "/agenda") {
        return false;
      }
      return true;
    }

    // Notifications + Statistiques : accessibles à tout utilisateur authentifié
    if (normalizedPath === "/notifications" || normalizedPath === "/statistics") return true;

    if (!features || features.length === 0) return false;

    if (
      normalizedPath === "/settings" ||
      normalizedPath.startsWith("/settings/") ||
      normalizedPath === "/business-cards" ||
      normalizedPath.startsWith("/business-cards/")
    ) {
      const isMainCompany = user?.company?.parent_company_id === null;
      return isMainCompany;
    }

    return allowedPaths.some((allowedPath) => {
      const normalizedAllowed = allowedPath.replace(/\/$/, "") || "/";
      return normalizedPath === normalizedAllowed || normalizedPath.startsWith(normalizedAllowed + "/");
    });
  }, [user, features, allowedPaths]);

  const canDoAction = useCallback((actionCode: string): boolean => {
    return allActions.some((action) => action.code === actionCode);
  }, [allActions]);

  const getActionsForPath = useCallback((path: string): UserAction[] => {
    if (!path || typeof path !== "string") return [];

    const isSuperAdmin =
      user?.role?.code === 'super_admin' ||
      (!user?.company && user?.role?.level != null && user.role.level >= 999);

    if (isSuperAdmin) {
      return [
        { id: 'sa-create', name: 'create', code: 'create' },
        { id: 'sa-read',   name: 'read',   code: 'read'   },
        { id: 'sa-update', name: 'update', code: 'update' },
        { id: 'sa-delete', name: 'delete', code: 'delete' },
      ];
    }

    const normalizedPath = path.replace(/\/$/, "") || "/";
    for (const feature of features) {
      for (const page of feature.pages || []) {
        const normalizedPagePath = page.path?.replace(/\/$/, "") || "/";
        if (normalizedPath === normalizedPagePath) {
          return page.actions || [];
        }
      }
    }
    return [];
  }, [user, features]);

  const getPageByPath = useCallback((path: string): UserPage | undefined => {
    if (!path || typeof path !== "string") return undefined;

    const normalizedPath = path.replace(/\/$/, "") || "/";
    for (const feature of features) {
      for (const page of feature.pages || []) {
        const normalizedPagePath = page.path?.replace(/\/$/, "") || "/";
        if (normalizedPath === normalizedPagePath) {
          return page;
        }
      }
    }
    return undefined;
  }, [features]);

  return {
    features,
    allowedPaths,
    canAccessPath,
    canDoAction,
    getActionsForPath,
    getPageByPath,
  };
}
