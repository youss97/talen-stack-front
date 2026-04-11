import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useLogoutMutation } from "@/lib/services/authApi";
import PWAInstallButton from "@/components/pwa/PWAInstallButton";
import UserAvatar from "../common/UserAvatar";
import { store } from "@/lib/store";
import type { RootState } from "@/lib/store";

export default function UserDropdown() {
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

  const fullName = user ? `${user.first_name} ${user.last_name}` : "Utilisateur";
  const email = user?.email || "";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <UserAvatar
          user={user}
          size={44}
          className="mr-3"
        />

        <span className="block mr-1 font-medium text-theme-sm">{user?.first_name || "Utilisateur"}</span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {fullName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          {/* Super admin ne voit ni profil ni paramètres */}
          {user?.role?.code !== 'super_admin' && (
            <li>
              <a
                href="/profile"
                onClick={closeDropdown}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <svg
                  className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z"
                    fill=""
                  />
                </svg>
                Mon profil
              </a>
            </li>
          )}
          {isMainCompany && user?.role?.code !== 'super_admin' && (
            <li>
              <a
                href="/settings"
                onClick={closeDropdown}
                className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                <svg
                  className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.0001 1.25C11.3097 1.25 10.75 1.80964 10.75 2.5V3.67939C10.75 3.98813 10.5468 4.26172 10.2501 4.35826C9.95345 4.4548 9.62791 4.35362 9.43298 4.10223L8.61627 3.08402C8.17021 2.54432 7.37428 2.46441 6.83458 3.01047L5.01047 4.83458C4.46441 5.37428 4.54432 6.17021 5.08402 6.61627L6.10223 7.43298C6.35362 7.62791 6.4548 7.95345 6.35826 8.2501C6.26172 8.54675 5.98813 8.75 5.67939 8.75H4.5C3.80964 8.75 3.25 9.30964 3.25 10V14C3.25 14.6904 3.80964 15.25 4.5 15.25H5.67939C5.98813 15.25 6.26172 15.4532 6.35826 15.7499C6.4548 16.0466 6.35362 16.3721 6.10223 16.567L5.08402 17.3837C4.54432 17.8298 4.46441 18.6257 5.01047 19.1654L6.83458 20.9895C7.37428 21.5356 8.17021 21.4557 8.61627 20.916L9.43298 19.8978C9.62791 19.6464 9.95345 19.5452 10.2501 19.6417C10.5468 19.7383 10.75 20.0119 10.75 20.3206V21.5C10.75 22.1904 11.3097 22.75 12.0001 22.75H16.0001C16.6904 22.75 17.2501 22.1904 17.2501 21.5V20.3206C17.2501 20.0119 17.4533 19.7383 17.7499 19.6417C18.0466 19.5452 18.3721 19.6464 18.567 19.8978L19.3837 20.916C19.8298 21.4557 20.6257 21.5356 21.1654 20.9895L22.9895 19.1654C23.5356 18.6257 23.4557 17.8298 22.916 17.3837L21.8978 16.567C21.6464 16.3721 21.5452 16.0466 21.6417 15.7499C21.7383 15.4532 22.0119 15.25 22.3206 15.25H23.5C24.1904 15.25 24.75 14.6904 24.75 14V10C24.75 9.30964 24.1904 8.75 23.5 8.75H22.3206C22.0119 8.75 21.7383 8.54675 21.6417 8.2501C21.5452 7.95345 21.6464 7.62791 21.8978 7.43298L22.916 6.61627C23.4557 6.17021 23.5356 5.37428 22.9895 4.83458L21.1654 3.01047C20.6257 2.46441 19.8298 2.54432 19.3837 3.08402L18.567 4.10223C18.3721 4.35362 18.0466 4.4548 17.7499 4.35826C17.4533 4.26172 17.2501 3.98813 17.2501 3.67939V2.5C17.2501 1.80964 16.6904 1.25 16.0001 1.25H12.0001ZM12.0001 9.25C10.4812 9.25 9.25006 10.4812 9.25006 12C9.25006 13.5188 10.4812 14.75 12.0001 14.75C13.5189 14.75 14.7501 13.5188 14.7501 12C14.7501 10.4812 13.5189 9.25 12.0001 9.25ZM7.75006 12C7.75006 9.65279 9.65285 7.75 12.0001 7.75C14.3473 7.75 16.2501 9.65279 16.2501 12C16.2501 14.3472 14.3473 16.25 12.0001 16.25C9.65285 16.25 7.75006 14.3472 7.75006 12Z"
                    fill=""
                  />
                </svg>
                Paramètres
              </a>
            </li>
          )}
        </ul>
        
        {/* Section PWA Install */}
        <div className="py-3 border-b border-gray-200 dark:border-gray-800">
          <PWAInstallButton />
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full disabled:opacity-50"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill=""
            />
          </svg>
          {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
        </button>
      </Dropdown>
    </div>
  );
}
