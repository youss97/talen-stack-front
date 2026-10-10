"use client";
import { useTranslations } from "next-intl";
import { useActions } from "@/hooks/useActions";
import { useGetAutoEmailSettingsQuery, useSetAutoEmailSettingMutation } from "@/lib/services/emailTemplateApi";
import { getApiErrorMessage } from "@/utils/errorMessages";
import { useState } from "react";

const AUTO_TYPES = [
  "request_created",
  "request_status",
  "application_proposed",
  "application_status",
  "feedback_created",
  "interview_scheduled",
  "interview_rescheduled",
  "interview_modified",
  "interview_cancelled",
  "candidate_tracking",
  "candidate_application_deleted",
] as const;

export default function EmailNotificationsPage() {
  const t = useTranslations("settings.emailNotifications");
  const { canUpdate } = useActions("/email-templates");
  const { data: settings, isLoading } = useGetAutoEmailSettingsQuery();
  const [setSetting, { isLoading: isSaving }] = useSetAutoEmailSettingMutation();
  const [error, setError] = useState<string | null>(null);

  const toggle = async (type: string, enabled: boolean) => {
    setError(null);
    try {
      await setSetting({ type, enabled }).unwrap();
    } catch (err) {
      setError(getApiErrorMessage(err, t("saveError")));
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      <div className="gw-card divide-y divide-gray-100 dark:divide-gray-800">
        {AUTO_TYPES.map((type) => (
          <label
            key={type}
            className={`flex items-start justify-between gap-4 p-4 ${canUpdate ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-800 dark:text-white">{t(`types.${type}.label`)}</span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t(`types.${type}.description`)}</span>
            </span>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={settings?.[type] ?? true}
              disabled={!canUpdate || isLoading || isSaving}
              onChange={(e) => toggle(type, e.target.checked)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
