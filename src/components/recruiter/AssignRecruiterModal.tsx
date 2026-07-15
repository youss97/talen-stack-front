"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useGetUsersQuery } from "@/lib/services/userApi";

interface AssignRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (recruiterId: string, recruiterName: string) => Promise<void>;
  applicationCount: number;
  isLoading?: boolean;
}

export default function AssignRecruiterModal({
  isOpen,
  onClose,
  onAssign,
  applicationCount,
  isLoading = false,
}: AssignRecruiterModalProps) {
  const t = useTranslations("applications.assignRecruiter");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedName, setSelectedName] = useState<string>("");

  const { data, isLoading: isLoadingUsers } = useGetUsersQuery(
    { page: 1, limit: 50, search: search || undefined },
    { skip: !isOpen }
  );

  const users = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await onAssign(selectedId, selectedName);
    setSelectedId("");
    setSelectedName("");
    setSearch("");
  };

  const handleClose = () => {
    setSelectedId("");
    setSelectedName("");
    setSearch("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="p-6 pb-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {applicationCount > 1 ? t("subtitlePlural", { count: applicationCount }) : t("subtitle", { count: applicationCount })}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("searchLabel")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }}
              placeholder={t("searchPlaceholder")}
              className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
            {isLoadingUsers ? (
              <div className="text-center py-4 text-sm text-gray-400">{t("loading")}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">{t("noUserFound")}</div>
            ) : (
              users.map((user) => {
                const fullName = `${user.first_name} ${user.last_name}`.trim();
                const isSelected = selectedId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => { setSelectedId(user.id); setSelectedName(fullName); }}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-300 dark:border-brand-500/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="font-medium">{fullName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.email} · {user.role?.name}</div>
                  </button>
                );
              })
            )}
          </div>

          {selectedId && (
            <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/30 text-sm text-brand-700 dark:text-brand-400">
              {t("selected", { name: selectedName })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            {tc("actions.cancel")}
          </Button>
          <Button type="submit" disabled={!selectedId || isLoading}>
            {isLoading ? t("assigning") : t("assignButton")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
