"use client";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { SubscriptionsStats } from "@/lib/services/statsApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const BRAND = "#8AB925";
const COLORS = [BRAND, "#739c1e", "#5c7d17", "#a3cf4d", "#d8ecaa", "#bedd77", "#476211"];

const BILLING_LABELS: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  one_time: "Unique",
};

function formatMonth(iso: string) {
  const [y, m] = iso.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

export default function SubscriptionCharts({ stats }: { stats: SubscriptionsStats }) {
  const hasDistrib = stats.plansDistribution.length > 0;
  const hasApi = stats.apiConsumption.length > 0;

  if (!hasDistrib && !hasApi) return null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Distribution des plans */}
      {hasDistrib && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Sociétés par plan
          </h3>
          {stats.plansDistribution.every((p) => p.companyCount === 0) ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune société abonnée</p>
          ) : (
            <div className="flex justify-center">
              <div className="w-full max-w-[280px]">
                <Doughnut
                  data={{
                    labels: stats.plansDistribution.map(
                      (p) => `${p.name} (${BILLING_LABELS[p.billingCycle] ?? p.billingCycle})`
                    ),
                    datasets: [
                      {
                        data: stats.plansDistribution.map((p) => p.companyCount),
                        backgroundColor: COLORS.slice(0, stats.plansDistribution.length),
                        borderWidth: 2,
                        borderColor: "#fff",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "bottom", labels: { padding: 10, font: { size: 11 } } },
                    },
                    cutout: "62%",
                  }}
                />
              </div>
            </div>
          )}

          {/* Barres horizontales */}
          <div className="mt-5 space-y-3">
            {stats.plansDistribution.map((p, i) => {
              const max = Math.max(...stats.plansDistribution.map((x) => x.companyCount), 1);
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {p.name}{" "}
                      <span className="text-gray-400 font-normal">
                        — {BILLING_LABELS[p.billingCycle] ?? p.billingCycle} · {p.price} MAD
                      </span>
                    </span>
                    <span className="text-gray-500">{p.companyCount} société{p.companyCount !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(p.companyCount / max) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consommation API / Intégrations */}
      {hasApi && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Consommation API — Intégrations / mois
          </h3>
          <Bar
            data={{
              labels: stats.apiConsumption.map((r) => formatMonth(r.month)),
              datasets: [
                {
                  label: "Actives",
                  data: stats.apiConsumption.map((r) => r.active),
                  backgroundColor: BRAND + "cc",
                  borderColor: BRAND,
                  borderWidth: 1,
                  borderRadius: 5,
                },
                {
                  label: "Inactives",
                  data: stats.apiConsumption.map((r) => r.inactive),
                  backgroundColor: "#94a3b8aa",
                  borderColor: "#94a3b8",
                  borderWidth: 1,
                  borderRadius: 5,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "bottom", labels: { padding: 12, font: { size: 11 } } },
              },
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
              },
            }}
          />

          {/* Totaux rapides */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Total intégrations", value: stats.apiConsumption.reduce((s, r) => s + r.total, 0), color: "text-gray-800 dark:text-white" },
              { label: "Actives", value: stats.apiConsumption.reduce((s, r) => s + r.active, 0), color: "text-brand-600" },
              { label: "Inactives", value: stats.apiConsumption.reduce((s, r) => s + r.inactive, 0), color: "text-gray-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
