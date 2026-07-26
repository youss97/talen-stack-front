"use client";
import { Download } from "lucide-react";
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
      <Download
        size={24}
        strokeWidth={1.8}
        className="icon-glow text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
      />
      📱 Installer l'app
    </button>
  );
}