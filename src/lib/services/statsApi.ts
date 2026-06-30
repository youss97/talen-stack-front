import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface StatsTotals {
  companies?: number;
  clients?: number;
  cvs?: number;
  recruitmentRequests?: number;
  applications?: number;
  integrations?: number;
  users?: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface TopItem {
  name: string;
  clientsCount?: number;
  requestsCount?: number;
}

export interface DashboardStats {
  totals: StatsTotals;
  monthlyApplications?: MonthCount[];
  monthlyRequests?: MonthCount[];
  applicationsByMonth?: MonthCount[];
  requestsByStatus?: StatusCount[];
  integrationsByStatus?: StatusCount[];
  topCompanies?: TopItem[];
  topClients?: TopItem[];
  // Vue super admin centrée entreprises
  monthlyCompanies?: MonthCount[];
  companiesByStatus?: StatusCount[];
  topCompaniesTraffic?: { name: string; value: number }[];
}

export interface SearchResult {
  type: 'cv' | 'client' | 'request' | 'application';
  id: string;
  label: string;
  sublabel: string;
  url: string;
}

export interface RoleStatItem {
  id: string;
  name: string;
  code: string;
  level: number;
  userCount: number;
}

export interface RolesStats {
  totalRoles: number;
  totalUsers: number;
  rolesDistribution: RoleStatItem[];
}

export interface PlanStatItem {
  id: string;
  name: string;
  billingCycle: string;
  price: number;
  companyCount: number;
}

export interface ApiConsumptionItem {
  month: string;
  total: number;
  active: number;
  inactive: number;
}

export interface SubscriptionsStats {
  totalPlans: number;
  totalSubscribed: number;
  plansDistribution: PlanStatItem[];
  apiConsumption: ApiConsumptionItem[];
}

export const statsApi = createApi({
  reducerPath: 'statsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Stats'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, { startDate?: string; endDate?: string; companyId?: string } | void>({
      query: (params) => ({
        url: '/stats',
        params: {
          ...(params && params.startDate ? { startDate: params.startDate } : {}),
          ...(params && params.endDate ? { endDate: params.endDate } : {}),
          ...(params && params.companyId ? { companyId: params.companyId } : {}),
        },
      }),
      providesTags: ['Stats'],
    }),
    globalSearch: builder.query<{ results: SearchResult[] }, string>({
      query: (q) => `/stats/search?q=${encodeURIComponent(q)}`,
    }),
    getRolesStats: builder.query<RolesStats, void>({
      query: () => '/stats/roles',
    }),
    getSubscriptionsStats: builder.query<SubscriptionsStats, void>({
      query: () => '/stats/subscriptions',
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGlobalSearchQuery,
  useGetRolesStatsQuery,
  useGetSubscriptionsStatsQuery,
} = statsApi;
