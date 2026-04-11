"use client";
import { useMemo } from "react";
import { usePermissions } from "./usePermissions";
import { NAV_CONFIG, DEFAULT_ICON } from "@/layout/nav-config";
import type { NavItem } from "@/layout/nav-config";

// ----------------------------------------------------------------------

export function useNavigation() {
  const { features, canAccessPath } = usePermissions();

  const navItems: NavItem[] = useMemo(() => {
    if (!features || features.length === 0) {
      return [];
    }

    const allowedPaths = new Set<string>();
    features.forEach((feature) => {
      feature.pages?.forEach((page) => {
        if (page.path) {
          allowedPaths.add(page.path);
        }
      });
    });

    const items: NavItem[] = [];

    allowedPaths.forEach((path) => {
      // Utiliser canAccessPath pour vérifier l'accès (inclut les restrictions Super Admin)
      if (canAccessPath(path)) {
        const config = NAV_CONFIG[path];
        if (config) {
          items.push({
            title: config.title,
            path,
            icon: config.icon,
          });
        }
      }
      // Ne plus afficher les paths sans config (comme /profile)
      // Ils sont accessibles mais ne doivent pas apparaître dans la sidebar
    });

    return items;
  }, [features, canAccessPath]);

  return navItems;
}
