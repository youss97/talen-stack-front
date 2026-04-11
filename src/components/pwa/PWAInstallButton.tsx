"use client";
import { usePWA } from '@/hooks/usePWA';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      console.log('Application installée avec succès');
    }
  };

  // Ne pas afficher si déjà installé ou non installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full"
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
          d="M12 3.25C12.4142 3.25 12.75 3.58579 12.75 4V11.1893L15.4697 8.46967C15.7626 8.17678 16.2374 8.17678 16.5303 8.46967C16.8232 8.76256 16.8232 9.23744 16.5303 9.53033L12.5303 13.5303C12.2374 13.8232 11.7626 13.8232 11.4697 13.5303L7.46967 9.53033C7.17678 9.23744 7.17678 8.76256 7.46967 8.46967C7.76256 8.17678 8.23744 8.17678 8.53033 8.46967L11.25 11.1893V4C11.25 3.58579 11.5858 3.25 12 3.25ZM4 14.25C4.41421 14.25 4.75 14.5858 4.75 15V19C4.75 19.1989 4.82902 19.3897 4.96967 19.5303C5.11032 19.671 5.30109 19.75 5.5 19.75H18.5C18.6989 19.75 18.8897 19.671 19.0303 19.5303C19.171 19.3897 19.25 19.1989 19.25 19V15C19.25 14.5858 19.5858 14.25 20 14.25C20.4142 14.25 20.75 14.5858 20.75 15V19C20.75 19.5967 20.5129 20.169 20.091 20.591C19.669 21.0129 19.0967 21.25 18.5 21.25H5.5C4.90326 21.25 4.33097 21.0129 3.90901 20.591C3.48705 20.169 3.25 19.5967 3.25 19V15C3.25 14.5858 3.58579 14.25 4 14.25Z"
          fill=""
        />
      </svg>
      📱 Installer l'app
    </button>
  );
}