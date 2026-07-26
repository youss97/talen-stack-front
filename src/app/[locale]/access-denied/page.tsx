"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { XCircle, Home } from "lucide-react";

export default function AccessDeniedPage() {
  const t = useTranslations("auth.accessDenied");
  const router = useRouter();
  const { allowedPaths } = usePermissions();

  const firstAllowedPath = allowedPaths.length > 0 ? allowedPaths[0] : "/";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mx-auto w-24 h-24 mb-8 rounded-full bg-error-50 dark:bg-error-500/15 flex items-center justify-center">
          <XCircle className="text-error-500 icon-glow" size={48} strokeWidth={1.8} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {t("title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          {t("message")}
        </p>
        <button
          onClick={() => router.push(firstAllowedPath)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
        >
          <Home className="icon-glow" size={20} strokeWidth={1.8} />
          {t("home")}
        </button>
      </div>
    </div>
  );
}
