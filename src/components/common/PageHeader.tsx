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
          <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--brand-soft)", color: "var(--brand-deep)" }}>
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold leading-tight tracking-tight" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm sm:text-[15px]" style={{ color: "var(--text-2)" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
    </div>
  );
}
