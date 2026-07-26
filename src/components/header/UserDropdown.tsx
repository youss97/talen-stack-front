import React, { useState, useCallback } from "react";
import { ChevronDown, UserRound, Settings, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSelector } from "react-redux";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useLogoutMutation } from "@/lib/services/authApi";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";
import UserAvatar from "../common/UserAvatar";
import { store } from "@/lib/store";
import type { RootState } from "@/lib/store";

export default function UserDropdown() {
  const t = useTranslations("layout.header");
  const tSidebar = useTranslations("layout.sidebar");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Vérifier si l'utilisateur est SuperAdmin OU appartient à une société créée par le superadmin
  const isMainCompany = user?.role?.code === 'super_admin' || user?.company?.parent_company_id === null;

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      // Call API to logout on backend with refresh token
      await logout({ refresh_token: refreshToken || undefined }).unwrap();
    } catch (error) {
      // Even if API fails, still logout locally
      console.error("Logout API error:", error);
    } finally {
      // Reset all app state and API caches
      store.resetApp();
      closeDropdown();
      router.push("/signin");
    }
  }, [logout, router]);

  const fullName = user ? `${user.first_name} ${user.last_name}` : tSidebar("user");
  const email = user?.email || "";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <UserAvatar
          user={user ?? undefined}
          size={44}
          className="me-3"
        />

        <span className="block me-1 font-medium text-theme-sm">{user?.first_name || tSidebar("user")}</span>

        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={`icon-glow transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute end-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {fullName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
        </div>

        {user?.role?.code !== 'super_admin' && (
          <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
            <li>
              <Link
                href="/profile"
                onClick={closeDropdown}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <UserRound
                  size={20}
                  strokeWidth={1.8}
                  className="icon-glow text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                />
                {t("profile")}
              </Link>
            </li>
            {isMainCompany && (
              <li>
                <Link
                  href="/settings"
                  onClick={closeDropdown}
                  className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  <Settings
                    size={20}
                    strokeWidth={1.8}
                    className="icon-glow text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                  />
                  {t("settings")}
                </Link>
              </li>
            )}
          </ul>
        )}
        
        <PWAInstallButton />
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full disabled:opacity-50"
        >
          <LogOut
            size={20}
            strokeWidth={1.8}
            className="icon-glow text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
          />
          {isLoggingOut ? `${t("logout")}...` : t("logout")}
        </button>
      </Dropdown>
    </div>
  );
}
