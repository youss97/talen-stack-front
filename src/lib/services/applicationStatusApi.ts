import { createApi } from "@reduxjs/toolkit/query/react";
import type { ApplicationStatus, ApplicationStatusesResponse } from "@/types/applicationStatus";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const applicationStatusApi = createApi({
  reducerPath: "applicationStatusApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ApplicationStatus"],
  endpoints: (builder) => ({
    getApplicationStatuses: builder.query<
      ApplicationStatusesResponse,
      { page?: number; limit?: number; search?: string; is_active?: boolean }
    >({
      query: ({ page = 1, limit = 100, search, is_active }) => {
        const params: Record<string, string> = {
          page: page.toString(),
          limit: limit.toString(),
        };
        if (search) params.search = search;
        if (is_active !== undefined) params.is_active = is_active.toString();
        
        return {
          url: "/application-statuses",
          method: "GET",
          params,
        };
      },
      providesTags: ["ApplicationStatus"],
    }),
    getApplicationStatusById: builder.query<ApplicationStatus, string>({
      query: (id) => ({
        url: `/application-statuses/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "ApplicationStatus", id }],
    }),
    createApplicationStatus: builder.mutation<
      ApplicationStatus,
      { name: string; description?: string; is_active?: boolean }
    >({
      query: (data) => ({
        url: "/application-statuses",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ApplicationStatus"],
    }),
    updateApplicationStatus: builder.mutation<
      ApplicationStatus,
      { id: string; data: { name?: string; description?: string; is_active?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/application-statuses/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ApplicationStatus"],
    }),
    deleteApplicationStatus: builder.mutation<void, string>({
      query: (id) => ({
        url: `/application-statuses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApplicationStatus"],
    }),
  }),
});

export const {
  useGetApplicationStatusesQuery,
  useGetApplicationStatusByIdQuery,
  useLazyGetApplicationStatusByIdQuery,
  useCreateApplicationStatusMutation,
  useUpdateApplicationStatusMutation,
  useDeleteApplicationStatusMutation,
} = applicationStatusApi;
