"use client";
import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { useGetDashboardStatsQuery } from "@/lib/services/statsApi";
import dynamic from "next/dynamic";

const DashboardCharts = dynamic(() => import("@/components/dashboard/DashboardCharts"), { ssr: false });

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div
        className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${color}`}
      >
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <div className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            (value ?? 0).toLocaleString("fr-FR")
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: stats, isLoading } = useGetDashboardStatsQuery();

  const isSuperAdmin =
    user?.role?.code === "super_admin" ||
    (!user?.company && user?.role?.level != null && (user.role.level as number) >= 999);

  // Client users belong to a child company (parent_company_id !== null)
  const isClient = !isSuperAdmin && user?.company?.parent_company_id != null;

  const superAdminCards = [
    { label: "Sociétés", value: stats?.totals?.companies, icon: "🏢", color: "bg-brand-50 dark:bg-brand-500/10" },
    { label: "Clients", value: stats?.totals?.clients, icon: "👥", color: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Candidats (Vivier)", value: stats?.totals?.cvs, icon: "📄", color: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Demandes", value: stats?.totals?.recruitmentRequests, icon: "📋", color: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Candidatures", value: stats?.totals?.applications, icon: "✅", color: "bg-green-50 dark:bg-green-500/10" },
    { label: "Intégrations", value: stats?.totals?.integrations, icon: "🔗", color: "bg-rose-50 dark:bg-rose-500/10" },
    { label: "Utilisateurs", value: stats?.totals?.users, icon: "👤", color: "bg-teal-50 dark:bg-teal-500/10" },
  ];

  const companyCards = [
    { label: "Clients", value: stats?.totals?.clients, icon: "👥", color: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Vivier (CVs)", value: stats?.totals?.cvs, icon: "📄", color: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Demandes", value: stats?.totals?.recruitmentRequests, icon: "📋", color: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Candidatures", value: stats?.totals?.applications, icon: "✅", color: "bg-brand-50 dark:bg-brand-500/10" },
    { label: "Intégrations", value: stats?.totals?.integrations, icon: "🔗", color: "bg-rose-50 dark:bg-rose-500/10" },
  ];

  const clientCards = [
    { label: "Demandes", value: stats?.totals?.recruitmentRequests, icon: "📋", color: "bg-orange-50 dark:bg-orange-500/10" },
    { label: "Candidatures", value: stats?.totals?.applications, icon: "✅", color: "bg-brand-50 dark:bg-brand-500/10" },
    { label: "Intégrations", value: stats?.totals?.integrations, icon: "🔗", color: "bg-rose-50 dark:bg-rose-500/10" },
  ];

  const cards = isSuperAdmin ? superAdminCards : isClient ? clientCards : companyCards;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isSuperAdmin ? "Dashboard Global — TalentStack" : isClient ? "Mon espace client" : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isSuperAdmin
            ? "Vue d'ensemble de toutes les sociétés"
            : isClient
            ? "Vos demandes et candidatures"
            : "Statistiques de votre société"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} loading={isLoading} />
        ))}
      </div>

      {/* Charts */}
      {!isLoading && stats && (
        <DashboardCharts stats={stats} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}
