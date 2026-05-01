"use client";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { usePermissions } from "./usePermissions";
import { NAV_CONFIG } from "@/layout/nav-config";
import type { NavItem } from "@/layout/nav-config";

// ----------------------------------------------------------------------

export function useNavigation() {
  const { features, canAccessPath } = usePermissions();
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = user?.role?.code === "super_admin";

  const navItems: NavItem[] = useMemo(() => {
    if (!features || features.length === 0) {
      return [];
    }

    const allowedPaths = new Set<string>();
    features.forEach((feature) => {
      feature.pages?.forEach((page) => {
        if (page.path) allowedPaths.add(page.path);
      });
    });

    const items: NavItem[] = [];

    allowedPaths.forEach((path) => {
      if (canAccessPath(path)) {
        const config = NAV_CONFIG[path];
        if (config) items.push({ title: config.title, path, icon: config.icon });
      }
    });

    // Injecter /subscriptions uniquement pour le super admin
    if (isSuperAdmin && !items.find((i) => i.path === "/subscriptions")) {
      const subConfig = NAV_CONFIG["/subscriptions"];
      if (subConfig) items.push({ title: subConfig.title, path: "/subscriptions", icon: subConfig.icon });
    }

    return items;
  }, [features, canAccessPath, isSuperAdmin]);

  return navItems;
}
