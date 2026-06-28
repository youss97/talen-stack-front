"use client";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { ToastContainer, ToastItem } from "@/components/ui/toast/Toast";
import { NAV_CONFIG } from "@/layout/nav-config";
import { getSidebarGroupOrder, setSidebarGroupOrder } from "@/lib/sidebarOrder";

export default function SidebarOrderPage() {
  const [items, setItems] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (variant: ToastItem["variant"], title: string, message?: string) =>
    setToasts((prev) => [...prev, { id: Date.now().toString(), variant, title, message }]);
  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Liste des modules (groupes) existants dans la navigation
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    Object.values(NAV_CONFIG).forEach((c) => { if (c.group) set.add(c.group); });
    return Array.from(set);
  }, []);

  useEffect(() => {
    const saved = getSidebarGroupOrder();
    // Ordre = sauvegardé (filtré sur ce qui existe) + modules restants
    const ordered = [
      ...saved.filter((g) => allGroups.includes(g)),
      ...allGroups.filter((g) => !saved.includes(g)),
    ];
    setItems(ordered);
  }, [allGroups]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const handleSave = () => {
    setSidebarGroupOrder(items);
    addToast("success", "Succès", "Ordre des modules enregistré. Le menu est mis à jour.");
  };

  return (
    <div className="w-full">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <a href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">
        ← Retour aux paramètres
      </a>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ordre de la sidebar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Réorganisez l&apos;ordre des <strong>modules</strong> (sections) du menu latéral.
          </p>
        </div>
        <Button onClick={handleSave} disabled={items.length === 0}>Enregistrer l&apos;ordre</Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun module.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((g, i) => (
              <li
                key={g}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400 text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{g}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40" aria-label="Monter">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40" aria-label="Descendre">↓</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
