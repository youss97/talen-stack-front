"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
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
            Accès non autorisé. Redirection...
          </p>
        </div>
      </div>
    );
  }

  const settingsCategories = [
    {
      id: "application-statuses",
      title: "Statuts de Candidatures",
      description: "Gérer les statuts des candidatures (En attente, Accepté, Refusé, etc.)",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      href: "/settings/application-statuses",
      color: "blue",
    },
    {
      id: "contract-types",
      title: "Types de Contrats",
      description: "Gérer les types de contrats (CDI, CDD, Freelance, etc.)",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      href: "/settings/contract-types",
      color: "green",
    },
    {
      id: "sidebar-order",
      title: "Ordre de la sidebar",
      description: "Définir l'ordre d'affichage des modules (features) dans le menu latéral",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      ),
      href: "/settings/sidebar-order",
      color: "purple",
    },
    {
      id: "public-site",
      title: "Site public & branding",
      description: "Personnaliser la page publique de l'entreprise (slug, présentation, couleur, « Powered by »)",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
        </svg>
      ),
      href: "/settings/public-site",
      color: "blue",
    },
    {
      id: "landing",
      title: "Landing page",
      description: "Gérer la page publique : textes, tarifs, témoignages, formulaire de contact (super admin)",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h16M8 13h8M8 16h5" />
        </svg>
      ),
      href: "/settings/landing",
      color: "purple",
    },
    {
      id: "cv-sources",
      title: "Gestion des sources de CV",
      description: "Gérer les sources de CV (Offre publique, Cooptation, LinkedIn, etc.)",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: "/settings/cv-sources",
      color: "green",
    },
    {
      id: "email-templates",
      title: "Templates emails",
      description: "Personnaliser le contenu des emails envoyés automatiquement par la plateforme (candidatures, entretiens, notifications)",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      href: "/settings/email-templates",
      color: "purple",
    },
    {
      id: "business-cards",
      title: "Cartes de visite",
      description: "Créer et gérer les cartes de visite QR (RH, Client, Employé)",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h4M7 12h4M15 8h2M15 12h2M7 16h10" />
        </svg>
      ),
      href: "/business-cards",
      color: "green",
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
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gérez les paramètres de votre application
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
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
