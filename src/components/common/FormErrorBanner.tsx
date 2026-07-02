"use client";

/** Bandeau d'erreur persistant affiché dans les modals de création/modification. */
export default function FormErrorBanner({ message, className = "" }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div className={`rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 ${className}`}>
      <span className="mr-1">⚠️</span>
      {message}
    </div>
  );
}
