"use client";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { useGetDashboardStatsQuery } from "@/lib/services/statsApi";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BRAND = "#8AB925";
const PALETTE = ["#8AB925", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientId: string | null;
  clientName?: string;
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="gw-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{value ?? 0}</p>
    </div>
  );
}

export default function ClientStatsModal({ isOpen, onClose, clientId, clientName }: Props) {
  const t = useTranslations("clients.statsModal");
  const { data, isLoading } = useGetDashboardStatsQuery(clientId ? { clientId } : undefined, { skip: !isOpen || !clientId });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{t("title")}</h2>
        {clientName && <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{clientName}</p>}

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label={t("kpis.requests")} value={data.totals.recruitmentRequests || 0} />
              <KpiCard label={t("kpis.applications")} value={data.totals.applications || 0} />
              <KpiCard label={t("kpis.integrations")} value={data.totals.integrations || 0} />
            </div>

            {(data.applicationsByMonth || []).length > 0 && (
              <div className="gw-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">{t("charts.applicationsPerMonth")}</h3>
                <ReactApexChart
                  type="area"
                  height={240}
                  series={[{ name: t("kpis.applications"), data: (data.applicationsByMonth || []).map((m) => m.count) }]}
                  options={{
                    chart: { toolbar: { show: false }, fontFamily: "inherit" },
                    colors: [BRAND],
                    dataLabels: { enabled: false },
                    stroke: { curve: "smooth", width: 3 },
                    fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
                    xaxis: { categories: (data.applicationsByMonth || []).map((m) => m.month), labels: { style: { colors: "#9ca3af" } } },
                    grid: { borderColor: "#f1f5f9", strokeDashArray: 4 },
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(data.requestsByStatus || []).length > 0 && (
                <div className="gw-card p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">{t("charts.requestsByStatus")}</h3>
                  <ReactApexChart
                    type="donut"
                    height={220}
                    series={(data.requestsByStatus || []).map((r) => r.count)}
                    options={{
                      labels: (data.requestsByStatus || []).map((r) => r.status || "—"),
                      colors: PALETTE,
                      legend: { position: "bottom", labels: { colors: "#9ca3af" } },
                      dataLabels: { enabled: true },
                      stroke: { width: 0 },
                    }}
                  />
                </div>
              )}
              {(data.applicationsByStatus || []).length > 0 && (
                <div className="gw-card p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white">{t("charts.applicationsByStatus")}</h3>
                  <ReactApexChart
                    type="donut"
                    height={220}
                    series={(data.applicationsByStatus || []).map((r) => r.count)}
                    options={{
                      labels: (data.applicationsByStatus || []).map((r) => r.status || "—"),
                      colors: PALETTE,
                      legend: { position: "bottom", labels: { colors: "#9ca3af" } },
                      dataLabels: { enabled: true },
                      stroke: { width: 0 },
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
