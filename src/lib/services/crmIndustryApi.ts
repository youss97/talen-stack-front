import { createApi } from "@reduxjs/toolkit/query/react";
import type { CrmIndustry, CrmIndustriesResponse } from "@/types/crmIndustry";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const crmIndustryApi = createApi({
  reducerPath: "crmIndustryApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CrmIndustry"],
  endpoints: (builder) => ({
    getCrmIndustries: builder.query<
      CrmIndustriesResponse,
      { page?: number; limit?: number; search?: string; is_active?: boolean } | void
    >({
      query: (params) => {
        const { page = 1, limit = 100, search, is_active } = params || {};
        const query: Record<string, string> = { page: page.toString(), limit: limit.toString() };
        if (search) query.search = search;
        if (is_active !== undefined) query.is_active = is_active.toString();
        return { url: "/crm-industries", method: "GET", params: query };
      },
      providesTags: ["CrmIndustry"],
    }),
    createCrmIndustry: builder.mutation<CrmIndustry, { name: string; description?: string; is_active?: boolean }>({
      query: (data) => ({ url: "/crm-industries", method: "POST", body: data }),
      invalidatesTags: ["CrmIndustry"],
    }),
    updateCrmIndustry: builder.mutation<CrmIndustry, { id: string; data: { name?: string; description?: string; is_active?: boolean } }>({
      query: ({ id, data }) => ({ url: `/crm-industries/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["CrmIndustry"],
    }),
    deleteCrmIndustry: builder.mutation<void, string>({
      query: (id) => ({ url: `/crm-industries/${id}`, method: "DELETE" }),
      invalidatesTags: ["CrmIndustry"],
    }),
  }),
});

export const {
  useGetCrmIndustriesQuery,
  useCreateCrmIndustryMutation,
  useUpdateCrmIndustryMutation,
  useDeleteCrmIndustryMutation,
} = crmIndustryApi;
