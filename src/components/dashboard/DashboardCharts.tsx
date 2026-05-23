"use client";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import type { DashboardStats, MonthCount, StatusCount, TopItem } from "@/lib/services/statsApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const STATUS_LABELS: Record<string, string> = {
  in_progress: "En cours",
  standby: "Standby",
  abandoned: "Abandonnée",
  filled: "Comblée",
  open: "Ouverte",
  archived: "Archivée",
  completed: "Terminée",
  failed: "Échouée",
};

const BRAND = "#8AB925";
const COLORS = [BRAND, "#739c1e", "#5c7d17", "#a3cf4d", "#d8ecaa", "#bedd77", "#476211"];

function formatMonths(months: MonthCount[]) {
  return months.map((m) => {
    const [y, mo] = m.month.split("-");
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
  });
}

function MonthlyBarChart({
  data,
  label,
  color,
}: {
  data: MonthCount[];
  label: string;
  color: string;
}) {
  if (!data || data.length === 0) return null;
  return (
    <Bar
      data={{
        labels: formatMonths(data),
        datasets: [
          {
            label,
            data: data.map((m) => m.count),
            backgroundColor: color + "cc",
            borderColor: color,
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      }}
    />
  );
}

function StatusDoughnut({ data, title }: { data: StatusCount[]; title: string }) {
  if (!data || data.length === 0) return null;
  return (
    <Doughnut
      data={{
        labels: data.map((d) => STATUS_LABELS[d.status] ?? d.status),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: COLORS.slice(0, data.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { padding: 12, font: { size: 12 } } },
          title: { display: true, text: title, font: { size: 13 } },
        },
        cutout: "65%",
      }}
    />
  );
}

function TopBar({ items, valueKey, title }: { items: TopItem[]; valueKey: keyof TopItem; title: string }) {
  if (!items || items.length === 0) return null;
  const max = Math.max(...items.map((i) => (i[valueKey] as number) ?? 0), 1);
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span className="truncate">{item.name}</span>
              <span className="font-semibold ml-2">{item[valueKey] as number}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(((item[valueKey] as number) ?? 0) / max) * 100}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  stats: DashboardStats;
  isSuperAdmin: boolean;
}

export default function DashboardCharts({ stats, isSuperAdmin }: Props) {
  const monthlyData = isSuperAdmin ? stats.monthlyApplications : stats.applicationsByMonth;
  const monthlyRequests = isSuperAdmin ? stats.monthlyRequests : undefined;

  return (
    <div className="space-y-6">
      {/* Monthly trends row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {monthlyData && monthlyData.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Candidatures / mois (6 derniers mois)
            </h3>
            <MonthlyBarChart data={monthlyData} label="Candidatures" color={BRAND} />
          </div>
        )}

        {isSuperAdmin && monthlyRequests && monthlyRequests.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Demandes / mois (6 derniers mois)
            </h3>
            <MonthlyBarChart data={monthlyRequests} label="Demandes" color="#739c1e" />
          </div>
        )}
      </div>

      {/* Status + Top row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.requestsByStatus && stats.requestsByStatus.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-center">
            <div className="w-full max-w-[240px]">
              <StatusDoughnut data={stats.requestsByStatus} title="Demandes par statut" />
            </div>
          </div>
        )}

        {stats.integrationsByStatus && stats.integrationsByStatus.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] flex items-center justify-center">
            <div className="w-full max-w-[240px]">
              <StatusDoughnut data={stats.integrationsByStatus} title="Intégrations par statut" />
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          {isSuperAdmin && stats.topCompanies && (
            <TopBar
              items={stats.topCompanies}
              valueKey="clientsCount"
              title="Top sociétés (nb clients)"
            />
          )}
          {!isSuperAdmin && stats.topClients && (
            <TopBar
              items={stats.topClients}
              valueKey="requestsCount"
              title="Top clients (nb demandes)"
            />
          )}
        </div>
      </div>
    </div>
  );
}
