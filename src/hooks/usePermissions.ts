"use client";
import { useMemo } from "react";
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

  const canAccessPath = (path: string): boolean => {
    // Si pas de features, pas d'accès
    if (!features || features.length === 0) return false;
    
    // Vérifier que path est une chaîne valide
    if (!path || typeof path !== "string") return false;
    
    // Remove trailing slash for comparison
    const normalizedPath = path.replace(/\/$/, "") || "/";
    
    // Exception spéciale pour /settings et ses sous-pages
    // Accessible uniquement pour SuperAdmin ou sociétés principales
    if (normalizedPath === "/settings" || normalizedPath.startsWith("/settings/")) {
      const isSuperAdmin = user?.role?.code === 'super_admin';
      const isMainCompany = user?.company?.parent_company_id === null;
      return isSuperAdmin || isMainCompany;
    }
    
    // Restrictions pour Super Admin : exclure Integrations et Agenda
    if (user?.role?.code === 'super_admin') {
      if (normalizedPath === "/integrations" || normalizedPath === "/agenda") {
        return false; // Super Admin ne peut pas accéder à ces sections
      }
    }
    
    return allowedPaths.some((allowedPath) => {
      const normalizedAllowed = allowedPath.replace(/\/$/, "") || "/";
      return normalizedPath === normalizedAllowed || normalizedPath.startsWith(normalizedAllowed + "/");
    });
  };

  const canDoAction = (actionCode: string): boolean => {
    return allActions.some((action) => action.code === actionCode);
  };

  const getActionsForPath = (path: string): UserAction[] => {
    // Vérifier que path est une chaîne valide
    if (!path || typeof path !== "string") return [];
    
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
  };

  const getPageByPath = (path: string): UserPage | undefined => {
    // Vérifier que path est une chaîne valide
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
  };

  return {
    features,
    allowedPaths,
    canAccessPath,
    canDoAction,
    getActionsForPath,
    getPageByPath,
  };
}
