import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CV,
  UpdateCVRequest,
  CVPaginationParams,
} from "@/types/cv";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface CVPaginatedResponse {
  data: CV[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const cvApi = createApi({
  reducerPath: "cvApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CV"],
  endpoints: (builder) => ({
    // GET /cvs - Get all CVs with pagination
    getCVs: builder.query<CVPaginatedResponse, CVPaginationParams>({
      query: (params) => ({
        url: "/cvs",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.skills && { skills: params.skills }),
          ...(params.min_experience && { min_experience: params.min_experience }),
          ...(params.max_experience && { max_experience: params.max_experience }),
          ...(params.industry && { industry: params.industry }),
          ...(params.email && { email: params.email }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "CV" as const,
                id,
              })),
              { type: "CV", id: "LIST" },
            ]
          : [{ type: "CV", id: "LIST" }],
    }),

    // Infinite query for CVs (for select dropdowns)
    getCVsForSelect: builder.infiniteQuery<
      CVPaginatedResponse,
      { search?: string },
      { page: number; limit: number }
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination.page;
          const totalPages = lastPage.pagination.totalPages;
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
        url: "/cvs",
        method: "GET",
        params: {
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: [{ type: "CV", id: "INFINITE_LIST" }],
    }),

    // GET /cvs/:id - Get CV by ID
    getCVById: builder.query<CV, string>({
      query: (id) => ({
        url: `/cvs/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "CV", id }],
    }),

    // POST /cvs - Create a new CV with file upload
    createCV: builder.mutation<CV, FormData>({
      query: (formData) => ({
        url: "/cvs",  // Changé de /cvs/manual à /cvs pour utiliser l'extraction automatique
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "CV", id: "LIST" }],
    }),

    // POST /cvs/extract - Extract data from CV file
    extractCV: builder.mutation<{
      cv_id: string | null;
      message: string;
      extracted_data: {
        name?: string;
        email?: string;
        phone?: string;
        skills?: string[];
        experience_years?: number;
        education?: string;
        current_position?: string;
        industry?: string;
        locations?: string[];
        languages?: string[];
        summary?: string;
      };
      confidence_score?: number;
      file_type?: string;
      file_size?: number;
    }, FormData>({
      query: (formData) => ({
        url: "/cvs/extract",
        method: "POST",
        body: formData,
      }),
    }),

    // PATCH /cvs/:id - Update a CV
    updateCV: builder.mutation<CV, { id: string; data: UpdateCVRequest }>({
      query: ({ id, data }) => ({
        url: `/cvs/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CV", id },
        { type: "CV", id: "LIST" },
      ],
    }),

    // DELETE /cvs/:id - Delete a CV
    deleteCV: builder.mutation<void, string>({
      query: (id) => ({
        url: `/cvs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "CV", id: "LIST" }],
    }),

    // PATCH /cvs/:id/status - Update CV status
    updateCVStatus: builder.mutation<CV, { id: string; status: string; comment?: string }>({
      query: ({ id, status, comment }) => ({
        url: `/cvs/${id}/status`,
        method: "PATCH",
        body: { status, comment },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "CV", id },
        { type: "CV", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCVsQuery,
  useGetCVsForSelectInfiniteQuery,
  useGetCVByIdQuery,
  useLazyGetCVByIdQuery,
  useCreateCVMutation,
  useUpdateCVMutation,
  useDeleteCVMutation,
  useUpdateCVStatusMutation,
  useExtractCVMutation,
} = cvApi;
