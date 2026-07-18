"use client";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("settings");
  const pathname = usePathname();
  const isHub = pathname === "/settings";

  return (
    <div className="w-full">
      {!isHub && (
        <Link
          href="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <span className="inline-block rtl:rotate-180">←</span> {t("backButton")}
        </Link>
      )}
      {children}
    </div>
  );
}
