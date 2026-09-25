"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { CheckCircle, FileText, Menu, Globe, LayoutTemplate, Mail, CreditCard, ChevronRight, Building2 } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("settings.hub");
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isAuthorized, setIsAuthorized] = useState(false);
  // Strict : seul le super admin (rôle dédié) voit le paramétrage du site vitrine
  const isSuperAdmin = user?.role?.code === "super_admin";

  useEffect(() => {
    // Vérifier si l'utilisateur est SuperAdmin OU appartient à une société créée par le superadmin
    // SuperAdmin: role.code === 'super_admin'
    // Société principale: parent_company_id === null
    if (user?.role?.code === 'super_admin' || user?.company?.parent_company_id === null) {
      setIsAuthorized(true);
    } else {
      // Rediriger vers la page d'accueil si non autorisé
      router.push("/");
    }
  }, [user, router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {t("unauthorized")}
          </p>
        </div>
      </div>
    );
  }

  const settingsCategories = [
    {
      id: "application-statuses",
      title: t("categories.applicationStatuses.title"),
      description: t("categories.applicationStatuses.description"),
      icon: (
        <CheckCircle className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/application-statuses",
      color: "blue",
    },
    {
      id: "contract-types",
      title: t("categories.contractTypes.title"),
      description: t("categories.contractTypes.description"),
      icon: (
        <FileText className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/contract-types",
      color: "green",
    },
    {
      id: "sidebar-order",
      title: t("categories.sidebarOrder.title"),
      description: t("categories.sidebarOrder.description"),
      icon: (
        <Menu className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/sidebar-order",
      color: "purple",
    },
    {
      id: "public-site",
      title: t("categories.publicSite.title"),
      description: t("categories.publicSite.description"),
      icon: (
        <Globe className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/public-site",
      color: "blue",
    },
    {
      id: "landing",
      title: t("categories.landing.title"),
      description: t("categories.landing.description"),
      icon: (
        <LayoutTemplate className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/landing",
      color: "purple",
    },
    {
      id: "cv-sources",
      title: t("categories.cvSources.title"),
      description: t("categories.cvSources.description"),
      icon: (
        <FileText className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/cv-sources",
      color: "green",
    },
    {
      id: "email-templates",
      title: t("categories.emailTemplates.title"),
      description: t("categories.emailTemplates.description"),
      icon: (
        <Mail className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/email-templates",
      color: "purple",
    },
    {
      id: "business-cards",
      title: t("categories.businessCards.title"),
      description: t("categories.businessCards.description"),
      icon: (
        <CreditCard className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/business-cards",
      color: "green",
    },
    {
      id: "crm-industries",
      title: t("categories.crmIndustries.title"),
      description: t("categories.crmIndustries.description"),
      icon: (
        <Building2 className="icon-glow" size={24} strokeWidth={1.8} />
      ),
      href: "/settings/crm-industries",
      color: "blue",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-600 dark:text-blue-400",
        hover: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-600 dark:text-green-400",
        hover: "hover:bg-green-100 dark:hover:bg-green-900/30",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-600 dark:text-purple-400",
        hover: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsCategories
          .filter((c) => c.id !== "landing" || isSuperAdmin)
          // Templates emails : réservé aux sociétés RH — pas pertinent pour le Super Admin (multi-sociétés)
          .filter((c) => c.id !== "email-templates" || !isSuperAdmin)
          .map((category) => {
          const colors = getColorClasses(category.color);
          return (
            <Link
              key={category.id}
              href={category.href}
              className={`block rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all ${colors.hover}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {category.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
                <ChevronRight className="text-gray-400 flex-shrink-0 icon-glow" size={20} strokeWidth={1.8} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
