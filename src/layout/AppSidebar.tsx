"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useNavigation } from "@/hooks/useNavigation";
import { HorizontaLDots } from "../icons/index";
import type { NavItem } from "./nav-config";
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
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const navItems = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);

  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  const showFull = isExpanded || isHovered || isMobileOpen;

  const companyLogoSrc = getImageUrl(user?.company?.logo_path ?? null);
  const companyName: string | null = user?.company?.name ?? null;
  // Afficher le branding entreprise pour tous les non-super_admin qui ont une company
  const useCompanyBrand = user?.role?.code !== 'super_admin' && !!(user?.company);
  const isSuperAdmin = user?.role?.code === 'super_admin';

  const renderMenuItems = (items: NavItem[]) => (
    <motion.ul
      className="flex flex-col gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((nav) => (
        <motion.li key={nav.path} variants={itemVariants}>
          <Link
            href={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <motion.span
              className={`${
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
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
                className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-500"
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo section */}
      <div
        className={`flex items-center border-b border-gray-100 dark:border-gray-800 py-5 mb-2 transition-all duration-300 ${
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
                      {companyName ?? "Mon espace"}
                    </p>
                    <p className="text-[10px] text-brand-500 font-medium tracking-wide uppercase leading-tight">
                      {user?.company?.parent_company_id ? "Espace client" : "Espace recruteur"}
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
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !showFull ? "lg:justify-center" : "justify-start"
                }`}
              >
                {showFull ? (
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400/80">
                    Navigation
                  </span>
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
      </div>

      {/* User profile at bottom */}
      <div className="border-t border-gray-100 dark:border-gray-800 py-4">
        <AnimatePresence mode="wait">
          {showFull ? (
            <motion.div
              key="profile-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <UserAvatar user={user ?? undefined} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email ?? "Utilisateur"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role?.name ?? "—"}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" title="En ligne" />
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
