"use client";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useNavigation } from "@/hooks/useNavigation";
import { HorizontaLDots } from "../icons/index";
import type { NavItem } from "./nav-config";
import { getSidebarGroupOrder, SIDEBAR_GROUP_EVENT } from "@/lib/sidebarOrder";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import UserAvatar from "@/components/common/UserAvatar";
import { getImageUrl } from "@/utils/imageHelper";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const AppSidebar: React.FC = () => {
  const t = useTranslations("layout");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const navItems = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);

  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  const showFull = isExpanded || isHovered || isMobileOpen;

  // Ordre des MODULES (groupes) configuré par l'utilisateur (page « Ordre de la sidebar »)
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  useEffect(() => {
    const read = () => setGroupOrder(getSidebarGroupOrder());
    read();
    window.addEventListener(SIDEBAR_GROUP_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(SIDEBAR_GROUP_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  // Regrouper les items par groupe, puis ordonner les groupes selon la préférence
  // (fallback : ordre d'apparition piloté par display_order).
  const groupedNav = useMemo(() => {
    const map: Record<string, NavItem[]> = {};
    const appearance: string[] = [];
    navItems.forEach((it) => {
      const g = it.group || "Pilotage";
      if (!map[g]) { map[g] = []; appearance.push(g); }
      map[g].push(it);
    });
    const present = appearance;
    const ordered = [
      ...groupOrder.filter((g) => present.includes(g)),
      ...present.filter((g) => !groupOrder.includes(g)),
    ];
    return ordered.map((g) => ({ group: g, items: map[g] }));
  }, [navItems, groupOrder]);

  const companyLogoSrc = getImageUrl(user?.company?.logo_path ?? null);
  const companyName: string | null = user?.company?.name ?? null;
  // Afficher le branding entreprise pour tous les non-super_admin qui ont une company
  const useCompanyBrand = user?.role?.code !== 'super_admin' && !!(user?.company);
  const isSuperAdmin = user?.role?.code === 'super_admin';

  const renderMenuItems = (items: NavItem[]) => (
    <motion.ul
      className="flex flex-col gap-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((nav) => (
        <motion.li key={nav.path} variants={itemVariants}>
          <Link
            href={nav.path}
            className={`menu-item group ${
              isActive(nav.path)
                ? "font-semibold bg-[var(--brand-soft)] text-[var(--brand-deep)] dark:bg-[var(--brand)] dark:text-[var(--brand-ink)]"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            }`}
          >
            <motion.span
              className={`${
                isActive(nav.path)
                  ? "text-[var(--brand-deep)] dark:text-[var(--brand-ink)]"
                  : "text-gray-500 group-hover:text-gray-700 dark:text-white/55 dark:group-hover:text-white"
              }`}
              whileHover={{ scale: 1.15 }}
              transition={{ duration: 0.2 }}
            >
              {nav.icon}
            </motion.span>
            {showFull && (
              <motion.span
                className="menu-item-text"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                {nav.title}
              </motion.span>
            )}
            {isActive(nav.path) && (
              <motion.span
                layoutId="activeIndicator"
                className="absolute end-3 w-1.5 h-1.5 rounded-full bg-[var(--brand-deep)] dark:bg-[var(--brand-ink)]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 start-0 bg-white text-gray-900 border-gray-200 dark:bg-[#19210E] dark:text-white/90 dark:border-white/10 h-screen transition-all duration-300 ease-in-out z-50 border-e
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : isRtl ? "translate-x-full" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo section */}
      <div
        className={`flex items-center border-b border-gray-100 dark:border-white/10 py-5 mb-2 transition-all duration-300 ${
          showFull ? "justify-start gap-3" : "justify-center"
        }`}
      >
        <AnimatePresence mode="wait">
          {showFull ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5"
            >
              {useCompanyBrand ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Logo ou initiale */}
                  {companyLogoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={companyLogoSrc}
                      alt={companyName ?? "Logo"}
                      className="h-8 w-8 rounded-lg object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-white font-bold text-base leading-none">
                        {companyName?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                  {/* Nom toujours affiché */}
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 dark:text-white truncate leading-tight max-w-[150px]">
                      {companyName ?? t("sidebar.mySpace")}
                    </p>
                    <p className="text-[10px] font-medium tracking-wide uppercase leading-tight" style={{ color: "var(--brand)" }}>
                      {user?.company?.parent_company_id ? t("sidebar.clientSpace") : t("sidebar.recruiterSpace")}
                    </p>
                  </div>
                </div>
              ) : isSuperAdmin ? null : (
                <>
                  <Image
                    src="/images/logo/logo.svg"
                    alt="TalentStack"
                    width={150}
                    height={52}
                    className="dark:hidden"
                  />
                  <Image
                    src="/images/logo/logo-dark.svg"
                    alt="TalentStack"
                    width={150}
                    height={52}
                    className="hidden dark:block"
                  />
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {useCompanyBrand ? (
                companyLogoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={companyLogoSrc}
                    alt={companyName ?? "Logo"}
                    className="h-9 w-9 object-contain rounded-md"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-base leading-none">
                      {companyName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )
              ) : isSuperAdmin ? null : (
                <Image
                  src="/images/logo/logo-icon.svg"
                  alt="TalentStack"
                  width={36}
                  height={36}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-7">
            {groupedNav.map((section) => (
              <div key={section.group}>
                <h2
                  className={`mb-3 flex text-xs uppercase leading-[20px] text-gray-400 dark:text-white/40 ${
                    !showFull ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {showFull ? (
                    <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-white/40">
                      {t(`nav.groups.${section.group}`)}
                    </span>
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(section.items)}
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* User profile at bottom */}
      <div className="border-t border-gray-100 dark:border-white/10 py-4">
        <AnimatePresence mode="wait">
          {showFull ? (
            <motion.div
              key="profile-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 dark:bg-white/5"
            >
              <UserAvatar user={user ?? undefined} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email ?? t("sidebar.user")}
                </p>
                <p className="text-xs text-gray-500 dark:text-white/50 truncate">
                  {user?.role?.name ?? "—"}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" title={t("sidebar.online")} />
            </motion.div>
          ) : (
            <motion.div
              key="profile-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <UserAvatar user={user ?? undefined} size={36} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-gray-900" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};

export default AppSidebar;
