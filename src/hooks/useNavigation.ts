"use client";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import { usePermissions } from "./usePermissions";
import { NAV_CONFIG } from "@/layout/nav-config";
import type { NavItem } from "@/layout/nav-config";

// ----------------------------------------------------------------------

export function useNavigation() {
  const t = useTranslations("layout.nav");
  const { features, canAccessPath } = usePermissions();
  const user = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = user?.role?.code === "super_admin";

  // Espace client : société rattachée à une société mère (parent_company_id),
  // rôle Client Manager, ou utilisateur lié à un client.
  const u = user as unknown as {
    company?: { parent_company_id?: string | null };
    client_id?: string | null;
    role?: { code?: string };
  } | null;
  const isClientSpace =
    !!u?.company?.parent_company_id ||
    !!u?.client_id ||
    (u?.role?.code || "").toUpperCase().startsWith("CLIENT_MANAGER");

  const navItems: NavItem[] = useMemo(() => {
    if (!features || features.length === 0) {
      return [];
    }

    // Trier les features par ordre d'affichage (display_order) pour la sidebar (8.3)
    const orderedFeatures = [...features].sort(
      (a, b) =>
        (((a as { display_order?: number }).display_order) ?? 0) -
        (((b as { display_order?: number }).display_order) ?? 0),
    );

    const items: NavItem[] = [];
    const seenPaths = new Set<string>();

    // Statistiques : masquée pour les espaces client (uniquement RH / super admin)
    const statsConfig = NAV_CONFIG["/statistics"];
    if (statsConfig && !isClientSpace) {
      items.push({ title: t(`items./statistics`), path: "/statistics", icon: statsConfig.icon, group: statsConfig.group });
      seenPaths.add("/statistics");
    }

    orderedFeatures.forEach((feature) => {
      feature.pages?.forEach((page) => {
        const path = page.path;
        if (!path || seenPaths.has(path)) return;
        // "Mes Offres" (/my-requests) est réservé à l'espace client uniquement
        if (path === "/my-requests" && !isClientSpace) return;
        // "Entreprises" (/companies) est réservé au super admin uniquement
        if (path === "/companies" && !isSuperAdmin) return;
        if (canAccessPath(path)) {
          const config = NAV_CONFIG[path];
          if (config) {
            items.push({ title: t(`items.${path}`), path, icon: config.icon, group: config.group });
            seenPaths.add(path);
          }
        }
      });
    });

    // Injecter /subscriptions uniquement pour le super admin
    if (isSuperAdmin && !items.find((i) => i.path === "/subscriptions")) {
      const subConfig = NAV_CONFIG["/subscriptions"];
      if (subConfig) items.push({ title: t(`items./subscriptions`), path: "/subscriptions", icon: subConfig.icon, group: subConfig.group });
    }

    // Site vitrine (landing) — super admin uniquement
    if (isSuperAdmin && !items.find((i) => i.path === "/settings/landing")) {
      const lc = NAV_CONFIG["/settings/landing"];
      if (lc) items.push({ title: t(`items./settings/landing`), path: "/settings/landing", icon: lc.icon, group: lc.group });
    }

    return items;
  }, [features, canAccessPath, isSuperAdmin, isClientSpace, t]);

  return navItems;
}
