"use client";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import type { Manager } from "@/types/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager | null;
}

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value ? (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:w-36 shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  ) : null;

export default function ManagerDetailModal({ isOpen, onClose, manager }: Props) {
  const t = useTranslations("managers");

  if (!manager) return null;

  const mgr = manager as any;
  const name = mgr.displayName || `${mgr.firstName || ""} ${mgr.lastName || ""}`.trim() || t("detail.defaultName");

  const getStatusBadge = (status?: string) => {
    if (status === "inactive") return <Badge variant="light" color="warning">{t("list.status.inactive")}</Badge>;
    if (status === "blocked") return <Badge variant="light" color="error">{t("list.status.blocked")}</Badge>;
    return <Badge variant="light" color="success">{t("list.status.active")}</Badge>;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6 sm:p-8 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-semibold text-sm">
            {(mgr.firstName?.[0] || "C").toUpperCase()}{(mgr.lastName?.[0] || "").toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{name}</h2>
            {mgr.position && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{mgr.position}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-4">
        <Row label={t("detail.email")} value={mgr.email} />
        <Row label={t("detail.phone")} value={mgr.phone || "-"} />
        <Row label={t("detail.position")} value={mgr.position} />
        <Row label={t("detail.status")} value={getStatusBadge(mgr.status)} />
      </div>

      <div className="flex justify-end gap-3 p-6 sm:p-8 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose}>
          {t("detail.close")}
        </Button>
      </div>
    </Modal>
  );
}
