"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/common/EmptyState";
import Pagination from "@/components/tables/Pagination";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  type AppNotification,
} from "@/lib/services/notificationApi";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

const typeColors: Record<string, string> = {
  application: "bg-brand-500",
  recruitment: "bg-blue-500",
  integration: "bg-green-500",
  system: "bg-gray-400",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading } = useGetNotificationsQuery({ page, limit });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();

  const items = data?.data ?? [];

  const open = async (n: AppNotification) => {
    if (!n.is_read) { try { await markRead(n.id).unwrap(); } catch { /* */ } }
    if (n.link) router.push(n.link);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Notifications"
        description="Toutes vos notifications et alertes"
        actions={
          <Button variant="outline" onClick={() => markAllRead()} disabled={markingAll || items.length === 0}>
            Tout marquer comme lu
          </Button>
        }
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Aucune notification" message="Vous serez notifié ici des nouvelles candidatures et événements." />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${!n.is_read ? "bg-brand-50/40 dark:bg-brand-500/5" : ""}`}>
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? "bg-gray-200 dark:bg-gray-700" : typeColors[n.type] || "bg-brand-500"}`} />
                <button onClick={() => open(n)} className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">{n.title}</p>
                  {n.message && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.message}</p>}
                  <p className="mt-1 text-xs text-gray-400">{timeAgo(n.created_at)}</p>
                </button>
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                  title="Supprimer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {data && data.totalPages > 1 && (
          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={data.totalPages}
              totalItems={data.total}
              itemsPerPage={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
