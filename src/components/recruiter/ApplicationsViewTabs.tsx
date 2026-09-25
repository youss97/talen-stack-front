"use client";
import { useTranslations } from "next-intl";

// Sélecteur de vue en mode Kanban : même style que Tableau | Cartes | Kanban du tableau
export default function ApplicationsViewTabs({ onTable, onCards }: { onTable: () => void; onCards: () => void }) {
  const t = useTranslations("applications.list");
  const tc = useTranslations("common");
  const inactive = "text-[var(--text-2)] hover:text-[var(--text)]";

  return (
    <div className="mb-3 flex justify-end">
      <div className="inline-flex rounded-lg border border-[color:var(--border)] p-0.5 bg-[var(--surface-2)]">
        <button onClick={onTable} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inactive}`}>{tc("views.table")}</button>
        <button onClick={onCards} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${inactive}`}>{tc("views.cards")}</button>
        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--surface)] text-[var(--brand-deep)] shadow-sm">{t("kanbanButton")}</button>
      </div>
    </div>
  );
}
