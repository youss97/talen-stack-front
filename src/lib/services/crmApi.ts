import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmPipelineStage,
  CreateCrmCompanyRequest,
  UpdateCrmCompanyRequest,
  CreateCrmContactRequest,
  UpdateCrmContactRequest,
  CreateCrmDealRequest,
  UpdateCrmDealRequest,
  ConvertToClientRequest,
  CrmCompanyPaginationParams,
  CrmActivity,
  CrmTask,
  CreateCrmActivityRequest,
  CreateCrmTaskRequest,
  UpdateCrmTaskRequest,
  SendCrmFollowupEmailRequest,
  CrmDashboard,
} from "@/types/crm";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface CrmCompanyPaginatedResponse {
  data: CrmCompany[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

type CrmCompaniesPageParam = { page: number; limit: number };

export const crmApi = createApi({
  reducerPath: "crmApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CrmCompany", "CrmDeal", "CrmPipeline", "CrmActivity", "CrmTask", "CrmDashboard"],
  endpoints: (builder) => ({
    // ── Tableau de bord ───────────────────────────────────────
    getCrmDashboard: builder.query<CrmDashboard, void>({
      query: () => ({ url: "/crm/dashboard", method: "GET" }),
      providesTags: ["CrmDashboard"],
    }),

    // ── Pipeline ──────────────────────────────────────────────
    getCrmPipelineStages: builder.query<CrmPipelineStage[], void>({
      query: () => ({ url: "/crm/pipeline-stages", method: "GET" }),
      providesTags: ["CrmPipeline"],
    }),
    updateCrmPipelineStages: builder.mutation<CrmPipelineStage[], CrmPipelineStage[]>({
      query: (stages) => ({ url: "/crm/pipeline-stages", method: "PATCH", body: { stages } }),
      invalidatesTags: ["CrmPipeline"],
    }),

    // ── Sociétés prospects ───────────────────────────────────
    getCrmCompanies: builder.query<CrmCompanyPaginatedResponse, CrmCompanyPaginationParams>({
      query: (params) => ({
        url: "/crm/companies",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          ...(params.search && { search: params.search }),
          ...(params.stage && { stage: params.stage }),
          ...(params.industry && { industry: params.industry }),
          ...(params.responsible_id && { responsible_id: params.responsible_id }),
          ...(params.lead_status && { lead_status: params.lead_status }),
          ...(params.pipeline_stage && { pipeline_stage: params.pipeline_stage }),
          ...(params.priority && { priority: params.priority }),
          ...(params.pole && { pole: params.pole }),
        },
      }),
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "CrmCompany" as const, id })), { type: "CrmCompany", id: "LIST" }]
          : [{ type: "CrmCompany", id: "LIST" }],
    }),
    // Infinite query pour le select "société prospect" dans le formulaire d'opportunité
    getCrmCompaniesForSelect: builder.infiniteQuery<CrmCompanyPaginatedResponse, { search?: string }, CrmCompaniesPageParam>({
      infiniteQueryOptions: {
        initialPageParam: { page: 1, limit: 10 },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          if (lastPage.pagination.page >= lastPage.pagination.totalPages) return undefined;
          return { ...lastPageParam, page: lastPageParam.page + 1 };
        },
      },
      query: ({ pageParam, queryArg }) => ({
        url: "/crm/companies",
        method: "GET",
        params: { page: pageParam.page, limit: pageParam.limit, ...(queryArg?.search && { search: queryArg.search }) },
      }),
      providesTags: [{ type: "CrmCompany", id: "INFINITE_LIST" }],
    }),

    getCrmLocationSuggestions: builder.query<{ cities: string[]; countries: string[]; poles: string[] }, void>({
      query: () => ({ url: "/crm/companies/meta/locations", method: "GET" }),
    }),

    getCrmCompanyById: builder.query<CrmCompany, string>({
      query: (id) => ({ url: `/crm/companies/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "CrmCompany", id }],
    }),
    createCrmCompany: builder.mutation<CrmCompany, CreateCrmCompanyRequest>({
      query: (data) => ({ url: "/crm/companies", method: "POST", body: data }),
      invalidatesTags: [{ type: "CrmCompany", id: "LIST" }],
    }),
    updateCrmCompany: builder.mutation<CrmCompany, { id: string; data: UpdateCrmCompanyRequest }>({
      query: ({ id, data }) => ({ url: `/crm/companies/${id}`, method: "PATCH", body: data }),
      // Les opportunités embarquent le prospect (statut du lead, étape) : elles et le tableau de bord se rafraîchissent aussi
      invalidatesTags: (_r, _e, { id }) => [
        { type: "CrmCompany", id },
        { type: "CrmCompany", id: "LIST" },
        { type: "CrmDeal", id: "LIST" },
        "CrmDashboard",
      ],
    }),
    deleteCrmCompany: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm/companies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "CrmCompany", id: "LIST" }],
    }),
    assignCrmCompany: builder.mutation<CrmCompany, { id: string; responsible_ids: string[] }>({
      query: ({ id, responsible_ids }) => ({ url: `/crm/companies/${id}/assign`, method: "PATCH", body: { responsible_ids } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CrmCompany", id }, { type: "CrmCompany", id: "LIST" }],
    }),
    convertCrmCompanyToClient: builder.mutation<{ id: string }, { id: string; data: ConvertToClientRequest }>({
      query: ({ id, data }) => ({ url: `/crm/companies/${id}/convert-to-client`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CrmCompany", id }, { type: "CrmCompany", id: "LIST" }],
    }),
    sendCrmFollowupEmail: builder.mutation<{ success: boolean }, { id: string; data: SendCrmFollowupEmailRequest }>({
      query: ({ id, data }) => ({ url: `/crm/companies/${id}/send-followup-email`, method: "POST", body: data }),
      invalidatesTags: [{ type: "CrmActivity", id: "LIST" }],
    }),

    // ── Contacts ──────────────────────────────────────────────
    createCrmContact: builder.mutation<CrmContact, { crmCompanyId: string; data: CreateCrmContactRequest }>({
      query: ({ crmCompanyId, data }) => ({ url: `/crm/companies/${crmCompanyId}/contacts`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { crmCompanyId }) => [{ type: "CrmCompany", id: crmCompanyId }],
    }),
    updateCrmContact: builder.mutation<CrmContact, { id: string; crmCompanyId: string; data: UpdateCrmContactRequest }>({
      query: ({ id, crmCompanyId, data }) => ({ url: `/crm/companies/${crmCompanyId}/contacts/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { crmCompanyId }) => [{ type: "CrmCompany", id: crmCompanyId }],
    }),
    deleteCrmContact: builder.mutation<void, { id: string; crmCompanyId: string }>({
      query: ({ id, crmCompanyId }) => ({ url: `/crm/companies/${crmCompanyId}/contacts/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { crmCompanyId }) => [{ type: "CrmCompany", id: crmCompanyId }],
    }),

    // ── Opportunités (deals) ─────────────────────────────────
    getCrmDeals: builder.query<CrmDeal[], { crm_company_id?: string; status?: string } | void>({
      query: (params) => ({ url: "/crm/deals", method: "GET", params: params || {} }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "CrmDeal" as const, id })), { type: "CrmDeal", id: "LIST" }]
          : [{ type: "CrmDeal", id: "LIST" }],
    }),
    getCrmDealById: builder.query<CrmDeal, string>({
      query: (id) => ({ url: `/crm/deals/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "CrmDeal", id }],
    }),
    createCrmDeal: builder.mutation<CrmDeal, CreateCrmDealRequest>({
      query: (data) => ({ url: "/crm/deals", method: "POST", body: data }),
      invalidatesTags: [{ type: "CrmDeal", id: "LIST" }],
    }),
    updateCrmDeal: builder.mutation<CrmDeal, { id: string; data: UpdateCrmDealRequest }>({
      query: ({ id, data }) => ({ url: `/crm/deals/${id}`, method: "PATCH", body: data }),
      // Le statut du lead du prospect suit l'issue de l'opportunité (gagnée/perdue) : liste,
      // fiche et tableau de bord doivent se rafraîchir aussi.
      invalidatesTags: (_r, _e, { id }) => [
        { type: "CrmDeal", id },
        { type: "CrmDeal", id: "LIST" },
        { type: "CrmCompany", id: "LIST" },
        "CrmDashboard",
      ],
    }),
    deleteCrmDeal: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm/deals/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "CrmDeal", id: "LIST" }],
    }),
    assignCrmDeal: builder.mutation<CrmDeal, { id: string; responsible_ids: string[] }>({
      query: ({ id, responsible_ids }) => ({ url: `/crm/deals/${id}/assign`, method: "PATCH", body: { responsible_ids } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CrmDeal", id }, { type: "CrmDeal", id: "LIST" }],
    }),
    convertCrmDealToClient: builder.mutation<{ id: string }, { id: string; data: ConvertToClientRequest }>({
      query: ({ id, data }) => ({ url: `/crm/deals/${id}/convert-to-client`, method: "POST", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CrmDeal", id }, { type: "CrmDeal", id: "LIST" }, { type: "CrmCompany", id: "LIST" }],
    }),

    // ── Activités (historique manuel) ────────────────────────
    getCrmActivities: builder.query<CrmActivity[], { crm_company_id?: string; crm_deal_id?: string } | void>({
      query: (params) => ({ url: "/crm/activities", method: "GET", params: params || {} }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "CrmActivity" as const, id })), { type: "CrmActivity", id: "LIST" }]
          : [{ type: "CrmActivity", id: "LIST" }],
    }),
    createCrmActivity: builder.mutation<CrmActivity, CreateCrmActivityRequest>({
      query: (data) => ({ url: "/crm/activities", method: "POST", body: data }),
      invalidatesTags: [{ type: "CrmActivity", id: "LIST" }],
    }),
    deleteCrmActivity: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm/activities/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "CrmActivity", id: "LIST" }],
    }),

    // ── Tâches & rappels ─────────────────────────────────────
    getCrmTasks: builder.query<CrmTask[], { crm_company_id?: string; crm_deal_id?: string; assigned_to?: string } | void>({
      query: (params) => ({ url: "/crm/tasks", method: "GET", params: params || {} }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "CrmTask" as const, id })), { type: "CrmTask", id: "LIST" }]
          : [{ type: "CrmTask", id: "LIST" }],
    }),
    createCrmTask: builder.mutation<CrmTask, CreateCrmTaskRequest>({
      query: (data) => ({ url: "/crm/tasks", method: "POST", body: data }),
      invalidatesTags: [{ type: "CrmTask", id: "LIST" }],
    }),
    updateCrmTask: builder.mutation<CrmTask, { id: string; data: UpdateCrmTaskRequest }>({
      query: ({ id, data }) => ({ url: `/crm/tasks/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CrmTask", id }, { type: "CrmTask", id: "LIST" }],
    }),
    deleteCrmTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "CrmTask", id: "LIST" }],
    }),
    checkCrmTaskReminders: builder.mutation<CrmTask[], void>({
      query: () => ({ url: "/crm/tasks/check-reminders", method: "POST" }),
      invalidatesTags: [{ type: "CrmTask", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCrmDashboardQuery,
  useGetCrmPipelineStagesQuery,
  useUpdateCrmPipelineStagesMutation,
  useGetCrmCompaniesQuery,
  useGetCrmCompaniesForSelectInfiniteQuery,
  useGetCrmCompanyByIdQuery,
  useLazyGetCrmCompanyByIdQuery,
  useCreateCrmCompanyMutation,
  useUpdateCrmCompanyMutation,
  useDeleteCrmCompanyMutation,
  useAssignCrmCompanyMutation,
  useGetCrmLocationSuggestionsQuery,
  useConvertCrmCompanyToClientMutation,
  useSendCrmFollowupEmailMutation,
  useCreateCrmContactMutation,
  useUpdateCrmContactMutation,
  useDeleteCrmContactMutation,
  useGetCrmDealsQuery,
  useGetCrmDealByIdQuery,
  useLazyGetCrmDealByIdQuery,
  useCreateCrmDealMutation,
  useUpdateCrmDealMutation,
  useDeleteCrmDealMutation,
  useAssignCrmDealMutation,
  useConvertCrmDealToClientMutation,
  useGetCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useDeleteCrmActivityMutation,
  useGetCrmTasksQuery,
  useCreateCrmTaskMutation,
  useUpdateCrmTaskMutation,
  useDeleteCrmTaskMutation,
  useCheckCrmTaskRemindersMutation,
} = crmApi;
