import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  ApplicationRequest,
  CreateApplicationRequestRequest,
  UpdateApplicationRequestRequest,
  ApplicationRequestPaginationParams,
} from "@/types/applicationRequest";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface ApplicationRequestPaginatedResponse {
  data: ApplicationRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const applicationRequestApi = createApi({
  reducerPath: "applicationRequestApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ApplicationRequest"],
  endpoints: (builder) => ({
    // GET /applications/requests/paginated - Get all application requests with pagination
    getApplicationRequests: builder.query<ApplicationRequestPaginatedResponse, ApplicationRequestPaginationParams>({
      query: (params) => ({
        url: "/applications/requests/paginated",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.required_skills && { required_skills: params.required_skills }),
          ...(params.experience_level && { experience_level: params.experience_level }),
          ...(params.contract_type && { contract_type: params.contract_type }),
          ...(params.location && { location: params.location }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "ApplicationRequest" as const,
                id,
              })),
              { type: "ApplicationRequest", id: "LIST" },
            ]
          : [{ type: "ApplicationRequest", id: "LIST" }],
    }),

    // Infinite query for application requests (for select dropdowns)
    getApplicationRequestsForSelect: builder.infiniteQuery<
      ApplicationRequestPaginatedResponse,
      { search?: string },
      { page: number; limit: number }
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.meta.page;
          const totalPages = lastPage.meta.totalPages;
          if (currentPage >= totalPages) {
            return undefined;
          }
          return {
            ...lastPageParam,
            page: lastPageParam.page + 1,
          };
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          if (firstPageParam.page > 1) {
            return {
              ...firstPageParam,
              page: firstPageParam.page - 1,
            };
          }
          return undefined;
        },
      },
      query: ({ pageParam, queryArg }) => ({
        url: "/applications/requests/paginated",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "ApplicationRequest", id: "INFINITE_LIST" }],
    }),

    // GET /applications/requests/:id - Get application request by ID
    getApplicationRequestById: builder.query<ApplicationRequest, string>({
      query: (id) => ({
        url: `/applications/requests/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "ApplicationRequest", id }],
    }),

    // POST /applications/requests - Create a new application request
    createApplicationRequest: builder.mutation<ApplicationRequest, CreateApplicationRequestRequest>({
      query: (body) => ({
        url: "/applications/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ApplicationRequest", id: "LIST" }],
    }),

    // PATCH /applications/requests/:id - Update an application request
    updateApplicationRequest: builder.mutation<ApplicationRequest, { id: string; data: UpdateApplicationRequestRequest }>({
      query: ({ id, data }) => ({
        url: `/applications/requests/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "ApplicationRequest", id },
        { type: "ApplicationRequest", id: "LIST" },
      ],
    }),

    // DELETE /applications/requests/:id - Delete an application request
    deleteApplicationRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/applications/requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ApplicationRequest", id: "LIST" }],
    }),
  }),
});

export const {
  useGetApplicationRequestsQuery,
  useGetApplicationRequestsForSelectInfiniteQuery,
  useGetApplicationRequestByIdQuery,
  useLazyGetApplicationRequestByIdQuery,
  useCreateApplicationRequestMutation,
  useUpdateApplicationRequestMutation,
  useDeleteApplicationRequestMutation,
} = applicationRequestApi;
