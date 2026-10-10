"use client";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { Smartphone, Link as LinkIcon, Briefcase, Globe, Eye, FileText, BarChart3 } from "lucide-react";
import type { PublicJobOfferStats } from "@/types/publicJobOffer";

const SOURCE_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  qr: Smartphone,
  direct: LinkIcon,
  linkedin: Briefcase,
  other: Globe,
};

interface OfferStatsProps {
  stats: PublicJobOfferStats;
  brandColor?: string;
}

export default function OfferStats({ stats, brandColor = "#3B82F6" }: OfferStatsProps) {
  const t = useTranslations("publicOffers.stats");
  const sourceLabels: Record<string, string> = {
    qr: t("sourceLabels.qr"),
    direct: t("sourceLabels.direct"),
    linkedin: t("sourceLabels.linkedin"),
    other: t("sourceLabels.other"),
  };

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title={t("views")}
          value={stats.views}
          icon={Eye}
          color="blue"
        />
        <StatCard
          title={t("applications")}
          value={stats.applications}
          icon={FileText}
          color="green"
        />
        <StatCard
          title={t("conversionRate")}
          value={`${stats.conversionRate}%`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Sources de candidatures */}
      {Object.keys(stats.sourceStats).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
            {t("sources")}
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.sourceStats).map(([source, count]) => {
              const percentage = stats.applications > 0 
                ? ((count / stats.applications) * 100).toFixed(1)
                : 0;
              
              return (
                <div key={source} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      {(() => { const SourceIcon = SOURCE_ICONS[source] || Globe; return <SourceIcon size={14} strokeWidth={1.8} className="icon-glow" />; })()}
                      {sourceLabels[source] || source}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: brandColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  color: "blue" | "green" | "purple";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={24} strokeWidth={1.8} className="icon-glow text-gray-600 dark:text-gray-300" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
