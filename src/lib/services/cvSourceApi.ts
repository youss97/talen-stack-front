import { createApi } from "@reduxjs/toolkit/query/react";
import type { CvSource, CvSourcesResponse } from "@/types/cvSource";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const cvSourceApi = createApi({
  reducerPath: "cvSourceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CvSource"],
  endpoints: (builder) => ({
    getCvSources: builder.query<
      CvSourcesResponse,
      { page?: number; limit?: number; search?: string; is_active?: boolean } | void
    >({
      query: (params) => {
        const { page = 1, limit = 100, search, is_active } = params || {};
        const query: Record<string, string> = {
          page: page.toString(),
          limit: limit.toString(),
        };
        if (search) query.search = search;
        if (is_active !== undefined) query.is_active = is_active.toString();

        return {
          url: "/cv-sources",
          method: "GET",
          params: query,
        };
      },
      providesTags: ["CvSource"],
    }),
    getCvSourceById: builder.query<CvSource, string>({
      query: (id) => ({
        url: `/cv-sources/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "CvSource", id }],
    }),
    createCvSource: builder.mutation<
      CvSource,
      { name: string; description?: string; is_active?: boolean }
    >({
      query: (data) => ({
        url: "/cv-sources",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CvSource"],
    }),
    updateCvSource: builder.mutation<
      CvSource,
      { id: string; data: { name?: string; description?: string; is_active?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/cv-sources/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CvSource"],
    }),
    deleteCvSource: builder.mutation<void, string>({
      query: (id) => ({
        url: `/cv-sources/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CvSource"],
    }),
  }),
});

export const {
  useGetCvSourcesQuery,
  useGetCvSourceByIdQuery,
  useLazyGetCvSourceByIdQuery,
  useCreateCvSourceMutation,
  useUpdateCvSourceMutation,
  useDeleteCvSourceMutation,
} = cvSourceApi;
