import { createApi } from "@reduxjs/toolkit/query/react";
import type { ContractType, ContractTypesResponse } from "@/types/contractType";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const contractTypeApi = createApi({
  reducerPath: "contractTypeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ContractType"],
  endpoints: (builder) => ({
    getContractTypes: builder.query<
      ContractTypesResponse,
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
          url: "/contract-types",
          method: "GET",
          params,
        };
      },
      providesTags: ["ContractType"],
    }),
    getContractTypeById: builder.query<ContractType, string>({
      query: (id) => ({
        url: `/contract-types/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "ContractType", id }],
    }),
    createContractType: builder.mutation<
      ContractType,
      { name: string; description?: string; is_active?: boolean }
    >({
      query: (data) => ({
        url: "/contract-types",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ContractType"],
    }),
    updateContractType: builder.mutation<
      ContractType,
      { id: string; data: { name?: string; description?: string; is_active?: boolean } }
    >({
      query: ({ id, data }) => ({
        url: `/contract-types/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ContractType"],
    }),
    deleteContractType: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contract-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContractType"],
    }),
  }),
});

export const {
  useGetContractTypesQuery,
  useGetContractTypeByIdQuery,
  useCreateContractTypeMutation,
  useUpdateContractTypeMutation,
  useDeleteContractTypeMutation,
} = contractTypeApi;
