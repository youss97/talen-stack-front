"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";
import type { RootState } from "@/lib/store";
import { useGetDashboardStatsQuery } from "@/lib/services/statsApi";
import { useGetCompaniesInfiniteInfiniteQuery } from "@/lib/services/companyApi";
import InfiniteSelect from "@/components/form/InfiniteSelect";
import PageHeader from "@/components/common/PageHeader";
import DatePicker from "@/components/form/date-picker";

const PRESETS: { id: string; days: number | null }[] = [
  { id: "7d", days: 7 },
  { id: "30d", days: 30 },
  { id: "3m", days: 90 },
  { id: "12m", days: 365 },
  { id: "all", days: null },
];

const fmt = (d: Date) => d.toISOString().slice(0, 10);

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BRAND = "#8AB925";
const PALETTE = ["#8AB925", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="gw-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{value ?? 0}</p>
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

function AreaChart({ title, name, points }: { title: string; name: string; points?: { month: string; count: number }[] }) {
  if (!points || points.length === 0) return null;
  return (
    <ChartCard title={title}>
      <ReactApexChart
        type="area"
        height={280}
        series={[{ name, data: points.map((m) => m.count) }]}
        options={{
          chart: { toolbar: { show: false }, fontFamily: "inherit" },
          colors: [BRAND],
          dataLabels: { enabled: false },
          stroke: { curve: "smooth", width: 3 },
          fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
          xaxis: { categories: points.map((m) => m.month), labels: { style: { colors: "#9ca3af" } } },
          yaxis: { labels: { style: { colors: "#9ca3af" } } },
          grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
        }}
      />
    </ChartCard>
  );
}

function DonutChart({ title, rows }: { title: string; rows?: { status: string; count: number }[] }) {
  if (!rows || rows.length === 0) return null;
  return (
    <ChartCard title={title}>
      <ReactApexChart
        type="donut"
        height={280}
        series={rows.map((r) => r.count)}
        options={{
          labels: rows.map((r) => r.status || "—"),
          colors: PALETTE,
          legend: { position: "bottom", labels: { colors: "#9ca3af" } },
          dataLabels: { enabled: true },
          stroke: { width: 0 },
        }}
      />
    </ChartCard>
  );
}

function BarChart({ title, items, seriesName }: { title: string; items?: { name: string; value: number }[]; seriesName: string }) {
  if (!items || items.length === 0) return null;
  return (
    <ChartCard title={title}>
      <ReactApexChart
        type="bar"
        height={280}
        series={[{ name: seriesName, data: items.map((t) => t.value || 0) }]}
        options={{
          chart: { toolbar: { show: false }, fontFamily: "inherit" },
          colors: [BRAND],
          plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "55%" } },
          dataLabels: { enabled: false },
          xaxis: { categories: items.map((t) => t.name), labels: { style: { colors: "#9ca3af" } } },
          yaxis: { labels: { style: { colors: "#9ca3af" } } },
          grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
        }}
      />
    </ChartCard>
  );
}

export default function StatisticsPage() {
  const t = useTranslations("statistics");
  const tc = useTranslations("common");
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const isSuperAdminUser = currentUser?.role?.code === "super_admin";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [activePreset, setActivePreset] = useState<string>("all");
  const [pickerKey, setPickerKey] = useState(0); // force le remount du picker sur preset
  const { data, isLoading } = useGetDashboardStatsQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    companyId: companyFilter || undefined,
  });

  const TOTAL_LABELS: Record<string, string> = {
    companies: t("kpis.companies"),
    clients: t("kpis.clients"),
    cvs: t("kpis.cvs"),
    recruitmentRequests: t("kpis.recruitmentRequests"),
    applications: t("kpis.applications"),
    integrations: t("kpis.integrations"),
    users: t("kpis.users"),
  };

  const handleRangeChange = useCallback((dates: Date[]) => {
    if (dates.length === 2) {
      setStartDate(fmt(dates[0]));
      setEndDate(fmt(dates[1]));
      setActivePreset("");
    } else if (dates.length === 0) {
      setStartDate("");
      setEndDate("");
    }
  }, []);

  const applyPreset = (p: { id: string; days: number | null }) => {
    setActivePreset(p.id);
    if (p.days === null) {
      setStartDate("");
      setEndDate("");
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - p.days);
      setStartDate(fmt(start));
      setEndDate(fmt(end));
    }
    setPickerKey((k) => k + 1);
  };

  const DateFilter = (
    <div className="mb-6 flex flex-wrap items-center gap-2 gw-card p-3">
      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1 dark:bg-gray-800/40">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => applyPreset(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activePreset === p.id ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {t(`filters.presets.${p.id}`)}
          </button>
        ))}
      </div>
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {isSuperAdminUser && (
          <div className="w-[240px]">
            <InfiniteSelect
              label=""
              value={companyFilter}
              onChange={(value) => setCompanyFilter(value)}
              useInfiniteQuery={useGetCompaniesInfiniteInfiniteQuery}
              itemLabelKey="name"
              itemValueKey="id"
              placeholder={t("filters.companyPlaceholder")}
              emptyMessage={t("filters.companyEmpty")}
            />
          </div>
        )}
        <div className="w-[260px]">
          <DatePicker
            key={pickerKey}
            id="stats-date-range"
            mode="range"
            placeholder={t("filters.dateRangePlaceholder")}
            defaultDate={startDate && endDate ? [startDate, endDate] : undefined}
            onChange={handleRangeChange}
          />
        </div>
        {(startDate || endDate || companyFilter) && (
          <button onClick={() => { applyPreset({ id: "all", days: null }); setCompanyFilter(""); }} className="text-xs font-medium text-gray-500 hover:text-gray-700">{tc("actions.reset")}</button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full">
        <PageHeader title={t("page.title")} description={t("page.loadingDescription")} />
        {DateFilter}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const totalEntries = Object.entries(totals).filter(([k]) => TOTAL_LABELS[k]);

  // Vue super admin = stats centrées entreprises (présence de monthlyCompanies)
  const isSuperAdmin = !!data?.monthlyCompanies;

  const topClientsItems = (data?.topClients || []).map((c) => ({ name: c.name, value: c.requestsCount || 0 }));

  return (
    <div className="w-full">
      <PageHeader title={t("page.title")} description={t("page.description")} />
      {DateFilter}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {totalEntries.map(([key, value]) => (
          <KpiCard key={key} label={TOTAL_LABELS[key]} value={value as number} />
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isSuperAdmin ? (
          <>
            <AreaChart title={t("charts.newCompaniesPerMonth")} name={t("charts.series.companies")} points={data?.monthlyCompanies} />
            <AreaChart title={t("charts.applicationsPerMonthGlobal")} name={t("charts.series.applications")} points={data?.monthlyApplications} />
            <DonutChart title={t("charts.companiesByStatus")} rows={data?.companiesByStatus} />
            <BarChart title={t("charts.trafficByCompany")} items={data?.topCompaniesTraffic} seriesName={t("charts.series.total")} />
          </>
        ) : (
          <>
            <AreaChart title={t("charts.applicationsPerMonth")} name={t("charts.series.applications")} points={data?.applicationsByMonth} />
            <DonutChart title={t("charts.requestsByStatus")} rows={data?.requestsByStatus} />
            <DonutChart title={t("charts.integrationsByStatus")} rows={data?.integrationsByStatus} />
            <BarChart title={t("charts.topClients")} items={topClientsItems} seriesName={t("charts.series.total")} />
          </>
        )}
      </div>

      {totalEntries.length === 0 && (
        <p className="mt-10 text-center text-sm text-gray-400">{t("empty.noStats")}</p>
      )}
    </div>
  );
}
