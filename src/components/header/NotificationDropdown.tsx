"use client";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  type AppNotification,
} from "@/lib/services/notificationApi";

function timeAgo(date: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return t("time.now");
  if (m < 60) return t("time.minutesAgo", { minutes: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("time.hoursAgo", { hours: h });
  return t("time.daysAgo", { days: Math.floor(h / 24) });
}

const typeColors: Record<string, string> = {
  application: "bg-brand-500",
  recruitment: "bg-blue-500",
  integration: "bg-green-500",
  system: "bg-gray-400",
};

export default function NotificationDropdown() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data: countData } = useGetUnreadCountQuery(undefined, { pollingInterval: 60000 });
  const { data, isLoading } = useGetNotificationsQuery({ page: 1, limit: 10 }, { skip: !isOpen });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const unread = countData?.count ?? 0;
  const items = data?.data ?? [];

  const openItem = async (n: AppNotification) => {
    setIsOpen(false);
    if (!n.is_read) { try { await markRead(n.id).unwrap(); } catch { /* */ } }
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative">
      <button
        style={{ borderColor: "var(--border-strong)" }}
        className="relative flex items-center justify-center transition-colors border rounded-full h-11 w-11 text-gray-600 hover:text-gray-900 hover:bg-[var(--brand-soft)] dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={t("page.title")}
      >
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 z-10 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z" fill="currentColor" />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="absolute -end-[240px] mt-[17px] flex max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[380px] lg:end-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("page.title")} {unread > 0 && <span className="text-sm font-normal text-gray-400">({unread})</span>}
          </h5>
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {t("actions.markAllRead")}
            </button>
          )}
        </div>

        <ul className="flex flex-col overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <li className="py-8 text-center text-sm text-gray-400">{tc("status.loading")}</li>
          ) : items.length === 0 ? (
            <li className="py-10 text-center text-sm text-gray-400">{t("emptyState.title")}</li>
          ) : (
            items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 rounded-lg p-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 ${!n.is_read ? "bg-brand-50/40 dark:bg-brand-500/5" : ""}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : typeColors[n.type] || "bg-brand-500"}`} />
                  <span className="block min-w-0 flex-1">
                    <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{n.title}</span>
                    {n.message && <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.message}</span>}
                    <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.created_at, t)}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <Link
          href="/notifications"
          onClick={() => setIsOpen(false)}
          className="mt-3 block rounded-lg border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("dropdown.viewAll")}
        </Link>
      </Dropdown>
    </div>
  );
}
