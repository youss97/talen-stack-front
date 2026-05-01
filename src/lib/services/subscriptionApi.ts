import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type {
  SubscriptionPlan,
  CreateSubscriptionPlanRequest,
  UpdateSubscriptionPlanRequest,
} from "@/types/subscription";

export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["SubscriptionPlan", "CompanyPlan"],
  endpoints: (builder) => ({
    // GET /subscriptions/plans
    getSubscriptionPlans: builder.query<SubscriptionPlan[], void>({
      query: () => ({ url: "/subscriptions/plans", method: "GET" }),
      providesTags: [{ type: "SubscriptionPlan", id: "LIST" }],
    }),

    // GET /subscriptions/plans/:id
    getSubscriptionPlanById: builder.query<SubscriptionPlan, string>({
      query: (id) => ({ url: `/subscriptions/plans/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "SubscriptionPlan", id }],
    }),

    // POST /subscriptions/plans
    createSubscriptionPlan: builder.mutation<SubscriptionPlan, CreateSubscriptionPlanRequest>({
      query: (body) => ({ url: "/subscriptions/plans", method: "POST", body }),
      invalidatesTags: [{ type: "SubscriptionPlan", id: "LIST" }],
    }),

    // PATCH /subscriptions/plans/:id
    updateSubscriptionPlan: builder.mutation<SubscriptionPlan, { id: string; data: UpdateSubscriptionPlanRequest }>({
      query: ({ id, data }) => ({ url: `/subscriptions/plans/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SubscriptionPlan", id },
        { type: "SubscriptionPlan", id: "LIST" },
      ],
    }),

    // DELETE /subscriptions/plans/:id
    deleteSubscriptionPlan: builder.mutation<void, string>({
      query: (id) => ({ url: `/subscriptions/plans/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "SubscriptionPlan", id: "LIST" }],
    }),

    // POST /subscriptions/companies/:companyId/assign/:planId
    assignPlanToCompany: builder.mutation<void, { companyId: string; planId: string }>({
      query: ({ companyId, planId }) => ({
        url: `/subscriptions/companies/${companyId}/assign/${planId}`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, { companyId }) => [{ type: "CompanyPlan", id: companyId }],
    }),

    // DELETE /subscriptions/companies/:companyId/plan
    removeCompanyPlan: builder.mutation<void, string>({
      query: (companyId) => ({ url: `/subscriptions/companies/${companyId}/plan`, method: "DELETE" }),
      invalidatesTags: (_r, _e, companyId) => [{ type: "CompanyPlan", id: companyId }],
    }),

    // GET /subscriptions/companies/:companyId/plan
    getCompanyPlan: builder.query<SubscriptionPlan | null, string>({
      query: (companyId) => ({ url: `/subscriptions/companies/${companyId}/plan`, method: "GET" }),
      providesTags: (_r, _e, companyId) => [{ type: "CompanyPlan", id: companyId }],
    }),
  }),
});

export const {
  useGetSubscriptionPlansQuery,
  useGetSubscriptionPlanByIdQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useAssignPlanToCompanyMutation,
  useRemoveCompanyPlanMutation,
  useGetCompanyPlanQuery,
} = subscriptionApi;
