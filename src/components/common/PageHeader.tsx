"use client";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Boutons / actions à droite */
  actions?: React.ReactNode;
  /** Icône optionnelle à gauche du titre */
  icon?: React.ReactNode;
}

/**
 * En-tête de page unifié (ATS) — titre large à gauche, description, actions à droite.
 * À réutiliser sur toutes les pages pour une cohérence visuelle.
 */
export default function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
}
