"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { useGetCrmDashboardQuery } from "@/lib/services/crmApi";
import { LEAD_STATUSES } from "@/constants/crmProspecting";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BRAND = "#8AB925";
const PALETTE = ["#8AB925", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: "success" | "error" | "warning" }) {
  const color =
    accent === "success" ? "var(--brand-deep)" : accent === "error" ? "#EF4444" : accent === "warning" ? "#F59E0B" : "var(--text)";
  return (
    <div className="gw-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="gw-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

function GaugeCard({ title, value, label, color }: { title: string; value: number; label: string; color: string }) {
  return (
    <div className="gw-card p-5 flex flex-col items-center">
      <h3 className="mb-1 self-start text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
      <ReactApexChart
        type="radialBar"
        height={200}
        series={[Math.min(value, 100)]}
        options={{
          chart: { fontFamily: "inherit", sparkline: { enabled: true } },
          colors: [color],
          plotOptions: {
            radialBar: {
              hollow: { size: "60%" },
              dataLabels: {
                value: { fontSize: "22px", fontWeight: 700, formatter: () => `${value}%` },
                name: { show: false },
              },
            },
          },
          labels: [label],
        }}
      />
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

export default function CrmDashboardPage() {
  const t = useTranslations("crm.dashboard");
  const tp = useTranslations("crm.prospecting");
  const { data, isLoading } = useGetCrmDashboardQuery();
  const matrix = data?.poleStatusMatrix || [];

  return (
    <div className="w-full">
      <PageHeader title={t("title")} description={t("subtitle")} icon={<LayoutDashboard size={20} strokeWidth={1.8} />} />

      {isLoading || !data ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Suivi de prospection : entreprises par pôle et par statut du lead */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{tp("matrix.title")}</h2>
          <div className="gw-card mb-6 overflow-x-auto">
            {matrix.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">{tp("matrix.empty")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3 text-start font-semibold">{tp("matrix.pole")}</th>
                    {LEAD_STATUSES.map((s) => (
                      <th key={s.value} className="px-3 py-3 text-center font-semibold whitespace-nowrap">{tp(`leadStatus.${s.key}`)}</th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold">{tp("matrix.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row) => (
                    <tr key={row.pole || "__none"} className="border-b border-gray-50 dark:border-gray-800/60">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{row.pole || tp("noPole")}</td>
                      {LEAD_STATUSES.map((s) => (
                        <td key={s.value} className="px-3 py-3 text-center text-gray-600 dark:text-gray-300">{row.counts[s.value] || 0}</td>
                      ))}
                      <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-white/[0.03] font-semibold">
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{tp("matrix.total")}</td>
                    {LEAD_STATUSES.map((s) => (
                      <td key={s.value} className="px-3 py-3 text-center">{matrix.reduce((sum, r) => sum + (r.counts[s.value] || 0), 0)}</td>
                    ))}
                    <td className="px-4 py-3 text-center">{matrix.reduce((sum, r) => sum + r.total, 0)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Pipeline */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("sections.pipeline")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={t("kpis.openValue")} value={data.totalOpenValue.toLocaleString()} />
            <KpiCard label={t("kpis.openCount")} value={data.totalOpenCount} />
            <KpiCard label={t("kpis.avgDealSize")} value={data.avgDealSize.toLocaleString()} />
            <GaugeCard title={t("kpis.conversionRate")} value={data.conversionRate} label={t("charts.series.won")} color={BRAND} />
          </div>

          {/* Résultats */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("sections.results")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={t("kpis.wonCount")} value={data.wonCount} accent="success" />
            <KpiCard label={t("kpis.wonValue")} value={data.wonValue.toLocaleString()} accent="success" />
            <KpiCard label={t("kpis.lostCount")} value={data.lostCount} accent="error" />
            <KpiCard label={t("kpis.avgSalesCycleDays")} value={t("kpis.daysValue", { count: data.avgSalesCycleDays })} />
          </div>

          {/* Prospection & activité */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("sections.activity")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label={t("kpis.totalProspects")} value={data.totalProspects} />
            <KpiCard label={t("kpis.newProspectsThisMonth")} value={data.newProspectsThisMonth} />
            <KpiCard label={t("kpis.totalClients")} value={data.totalClients} accent="success" />
            <KpiCard label={t("kpis.activitiesThisMonth")} value={data.activitiesThisMonthCount} />
          </div>

          {/* Tâches */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">{t("sections.tasks")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <KpiCard label={t("kpis.pendingTasks")} value={data.pendingTasksCount} />
            <GaugeCard
              title={t("kpis.overdueTasks")}
              value={data.pendingTasksCount > 0 ? Math.round((data.overdueTasksCount / data.pendingTasksCount) * 100) : 0}
              label={t("kpis.overdueTasksCountLabel", { count: data.overdueTasksCount })}
              color={data.overdueTasksCount > 0 ? "#F59E0B" : "#22C55E"}
            />
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.byStage.length > 0 && (
              <ChartCard title={t("charts.byStage")}>
                <ReactApexChart
                  type="bar"
                  height={280}
                  series={[{ name: t("charts.count"), data: data.byStage.map((s) => s.count) }]}
                  options={{
                    chart: { toolbar: { show: false }, fontFamily: "inherit" },
                    colors: [BRAND],
                    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "55%" } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: data.byStage.map((s) => s.stage), labels: { style: { colors: "#9ca3af" } } },
                    yaxis: { labels: { style: { colors: "#9ca3af" } } },
                    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
                  }}
                />
              </ChartCard>
            )}

            {data.byStage.length > 0 && (
              <ChartCard title={t("charts.valueByStage")}>
                <ReactApexChart
                  type="donut"
                  height={280}
                  series={data.byStage.map((s) => s.value)}
                  options={{
                    labels: data.byStage.map((s) => s.stage),
                    colors: PALETTE,
                    legend: { position: "bottom", labels: { colors: "#9ca3af" } },
                    dataLabels: { enabled: true },
                    stroke: { width: 0 },
                  }}
                />
              </ChartCard>
            )}

            {(data.wonCount > 0 || data.lostCount > 0) && (
              <ChartCard title={t("charts.wonVsLost")}>
                <ReactApexChart
                  type="donut"
                  height={280}
                  series={[data.wonCount, data.lostCount]}
                  options={{
                    labels: [t("charts.series.won"), t("charts.series.lost")],
                    colors: ["#22C55E", "#EF4444"],
                    legend: { position: "bottom", labels: { colors: "#9ca3af" } },
                    dataLabels: { enabled: true },
                    stroke: { width: 0 },
                  }}
                />
              </ChartCard>
            )}

            {data.topResponsibles.length > 0 && (
              <ChartCard title={t("charts.topResponsibles")}>
                <ReactApexChart
                  type="bar"
                  height={280}
                  series={[{ name: t("charts.series.wonValue"), data: data.topResponsibles.map((r) => r.wonValue) }]}
                  options={{
                    chart: { toolbar: { show: false }, fontFamily: "inherit" },
                    colors: [BRAND],
                    plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "55%" } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: data.topResponsibles.map((r) => r.name), labels: { style: { colors: "#9ca3af" } } },
                    yaxis: { labels: { style: { colors: "#9ca3af" } } },
                    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
                  }}
                />
              </ChartCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}
