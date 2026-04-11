"use client";

import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

export default function AccessDeniedPage() {
  const router = useRouter();
  const { allowedPaths } = usePermissions();

  const firstAllowedPath = allowedPaths.length > 0 ? allowedPaths[0] : "/";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mx-auto w-24 h-24 mb-8 rounded-full bg-error-50 dark:bg-error-500/15 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-error-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Accès refusé
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button
          onClick={() => router.push(firstAllowedPath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Accueil
        </button>
      </div>
    </div>
  );
}
