"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import type { User } from "@/types/auth";

type UserRecord = User & Record<string, unknown>;
import { useGetUsersForSelectInfiniteQuery } from "@/lib/services/userApi";

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (responsibleIds: string[]) => Promise<void>;
  currentResponsibles?: Array<{ id: string; first_name?: string; last_name?: string; email?: string }> | null;
  /** @deprecated use currentResponsibles */
  currentResponsible?: { id: string; first_name?: string; last_name?: string; email?: string } | null;
  entityLabel?: string;
  isLoading?: boolean;
}

export default function AssignModal({
  isOpen,
  onClose,
  onAssign,
  currentResponsibles,
  currentResponsible,
  entityLabel,
  isLoading = false,
}: AssignModalProps) {
  const t = useTranslations("assignModal");
  const tc = useTranslations("common");
  const resolvedEntityLabel = entityLabel ?? t("defaultEntityLabel");
  // Support both the new array prop and the legacy single prop
  const initial = currentResponsibles
    ? currentResponsibles
    : currentResponsible
    ? [currentResponsible]
    : [];

  const [selected, setSelected] = useState<UserRecord[]>(initial as UserRecord[]);

  useEffect(() => {
    const init = currentResponsibles
      ? currentResponsibles
      : currentResponsible
      ? [currentResponsible]
      : [];
    setSelected(init as UserRecord[]);
  }, [isOpen]);

  const getUserLabel = (u: UserRecord): string => {
    const name = u.first_name || u.last_name
      ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
      : String(u.email || u.id);
    const title = u.position || (u.role as { name?: string } | undefined)?.name;
    return title ? `${name} — ${title}` : name;
  };

  const handleAdd = (id: string, item?: UserRecord) => {
    if (!item || selected.some(u => u.id === id)) return;
    setSelected(prev => [...prev, item]);
  };

  const handleRemoveChip = (id: string) => {
    setSelected(prev => prev.filter(u => u.id !== id));
  };

  // Marque cette personne comme responsable principal : le backend calcule toujours
  // responsible_id = responsible_ids[0], donc la placer en tête suffit, sans changement API.
  const handleSetPrimary = (id: string) => {
    setSelected(prev => {
      const target = prev.find(u => u.id === id);
      if (!target) return prev;
      return [target, ...prev.filter(u => u.id !== id)];
    });
  };

  const handleSubmit = async () => {
    await onAssign(selected.map(u => u.id as string));
    onClose();
  };

  const handleClear = async () => {
    await onAssign([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {t("title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t("subtitle", { entityLabel: resolvedEntityLabel })}
        </p>

        <InfiniteSelect<UserRecord>
          label={t("addResponsible")}
          value=""
          onChange={handleAdd}
          useInfiniteQuery={useGetUsersForSelectInfiniteQuery as any}
          getOptionLabel={getUserLabel}
          itemValueKey="id"
          placeholder={t("searchPlaceholder")}
          emptyMessage={t("emptyResults")}
          excludeValues={selected.map((u) => u.id)}
        />

        {selected.length > 0 && (
          <>
            <p className="mt-3 text-xs text-gray-400">{t("primaryHint")}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {selected.map((u, index) => {
                const name = getUserLabel(u);
                const isPrimary = index === 0;
                return (
                  <span
                    key={u.id as string}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 rounded-full text-sm font-medium border border-brand-200 dark:border-brand-500/30"
                  >
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(u.id as string)}
                      title={t("setPrimary")}
                      className="flex items-center"
                    >
                      <Star
                        size={14}
                        strokeWidth={1.8}
                        className={isPrimary ? "text-amber-400 fill-amber-400" : "text-brand-300 hover:text-amber-400 dark:text-brand-500/50"}
                      />
                    </button>
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveChip(u.id as string)}
                      className="ms-0.5 text-brand-500 hover:text-brand-900 text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </>
        )}

        <div className="flex justify-between gap-3 mt-6">
          {initial.length > 0 && (
            <Button variant="outline" onClick={handleClear} disabled={isLoading} className="text-error-500 border-error-300">
              {t("clearAll")}
            </Button>
          )}
          <div className="flex gap-3 ms-auto">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {tc("actions.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? t("assigning") : t("assign")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
