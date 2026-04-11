import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  CompanyPaginationParams,
} from "@/types/company";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface CompanyPaginatedResponse {
  data: Company[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Company"],
  endpoints: (builder) => ({
    // GET /company - Get all companies with pagination
    getCompanies: builder.query<CompanyPaginatedResponse, CompanyPaginationParams>({
      query: (params) => ({
        url: "/company",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Company" as const,
                id,
              })),
              { type: "Company", id: "LIST" },
            ]
          : [{ type: "Company", id: "LIST" }],
    }),

    // Infinite query for companies (for select dropdowns)
    getCompaniesInfinite: builder.infiniteQuery<
      CompanyPaginatedResponse,
      CompanyPaginationParams,
      number
    >({
      query: ({ queryArg, pageParam }) => ({
        url: "/company",
        method: "GET",
        params: {
          page: pageParam,
          limit: queryArg.limit || 10,
          ...(queryArg.search && { search: queryArg.search }),
        },
      }),
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
          if (lastPage.meta.page < lastPage.meta.totalPages) {
            return lastPage.meta.page + 1;
          }
          return undefined;
        },
      },
      providesTags: [{ type: "Company", id: "INFINITE_LIST" }],
    }),

    // GET /company/:id - Get company by ID
    getCompanyById: builder.query<Company, string>({
      query: (id) => ({
        url: `/company/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Company", id }],
    }),

    // POST /company - Create a new company
    createCompany: builder.mutation<Company, FormData>({
      query: (body) => ({
        url: "/company",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),

    // PATCH /company/:id - Update a company
    updateCompany: builder.mutation<
      Company,
      { id: string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/company/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Company", id },
        { type: "Company", id: "LIST" },
      ],
    }),

    // DELETE /company/:id - Delete a company
    deleteCompany: builder.mutation<void, string>({
      query: (id) => ({
        url: `/company/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompaniesInfiniteQuery,
  useGetCompanyByIdQuery,
  useLazyGetCompanyByIdQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companyApi;
