"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import { useGetRolesForSelectInfiniteQuery } from "@/lib/services/roleApi";
import type { User } from "@/types/user";
import type { Role } from "@/types/role";

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (roleId: string) => void;
  isLoading?: boolean;
}

export default function RoleChangeModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isLoading = false,
}: RoleChangeModalProps) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const [roleId, setRoleId] = useState<string>(user?.role_id || "");

  useEffect(() => {
    setRoleId(user?.role_id || "");
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!roleId) return;
    onSubmit(roleId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md max-h-[90vh] flex flex-col">
      <div className="flex-shrink-0 p-6 pb-0">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {t("roleChange.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {user
            ? t("roleChange.subtitleWithUser", { name: `${user.first_name} ${user.last_name}` })
            : t("roleChange.subtitle")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        <InfiniteSelect<Role>
          label={t("roleChange.roleLabel")}
          value={roleId}
          onChange={(value) => setRoleId(value as string)}
          useInfiniteQuery={useGetRolesForSelectInfiniteQuery}
          itemLabelKey="name"
          itemValueKey="id"
          placeholder={t("roleChange.rolePlaceholder")}
          emptyMessage={t("roleChange.roleEmpty")}
          initialSelectedItems={user?.role ? [user.role as Role] : []}
        />
      </div>

      <div className="flex-shrink-0 flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {tc("actions.cancel")}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || !roleId}>
          {isLoading ? t("roleChange.saving") : tc("actions.save")}
        </Button>
      </div>
    </Modal>
  );
}
