"use client";
import React from "react";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/** État vide illustré et professionnel (icône + message + action). */
export default function EmptyState({ title = "Aucune donnée", message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
        {icon || (
          <FileText size={32} strokeWidth={1.5} className="icon-glow" />
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
