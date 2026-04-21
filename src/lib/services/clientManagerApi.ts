import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";
import type { ApplicationRequest, CreateApplicationRequestRequest } from "@/types/applicationRequest";
import type { Recruiter } from "@/types/recruiter";

interface ManagerRequestWithStats extends ApplicationRequest {
  candidates_count: number;
}

interface ManagerRequestsPaginatedResponse {
  data: ManagerRequestWithStats[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CandidatesPaginatedResponse {
  data: Recruiter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ManagerRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  contract_type?: string;
}

interface CandidatesParams {
  requestId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const clientManagerApi = createApi({
  reducerPath: "clientManagerApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ManagerRequest", "ManagerCandidate"],
  endpoints: (builder) => ({
    // GET /applications/manager/my-requests - Get manager's requests with stats
    getManagerRequests: builder.query<
      ManagerRequestsPaginatedResponse,
      ManagerRequestsParams
    >({
      query: (params) => ({
        url: "/applications/manager/my-requests",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.contract_type && { contract_type: params.contract_type }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "ManagerRequest" as const,
                id,
              })),
              { type: "ManagerRequest", id: "LIST" },
            ]
          : [{ type: "ManagerRequest", id: "LIST" }],
    }),

    // GET /applications/manager/request/:requestId/candidates - Get candidates for a request
    getCandidatesForRequest: builder.query<
      CandidatesPaginatedResponse,
      CandidatesParams
    >({
      query: ({ requestId, ...params }) => ({
        url: `/applications/manager/request/${requestId}/candidates`,
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
        },
      }),
      providesTags: (result, error, { requestId }) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "ManagerCandidate" as const,
                id,
              })),
              { type: "ManagerCandidate", id: `REQUEST-${requestId}` },
            ]
          : [{ type: "ManagerCandidate", id: `REQUEST-${requestId}` }],
    }),

    // POST /applications/manager/requests - Create a recruitment request as a client manager
    createManagerRequest: builder.mutation<
      ApplicationRequest,
      Omit<CreateApplicationRequestRequest, 'client_id' | 'manager_id'>
    >({
      query: (dto) => ({
        url: "/applications/manager/requests",
        method: "POST",
        body: dto,
      }),
      invalidatesTags: [{ type: "ManagerRequest", id: "LIST" }],
    }),

    // PATCH /applications/:id/manager-notes - Update manager notes
    updateManagerNotes: builder.mutation<
      Recruiter,
      { applicationId: string; manager_notes: string }
    >({
      query: ({ applicationId, manager_notes }) => ({
        url: `/applications/${applicationId}/manager-notes`,
        method: "PATCH",
        body: { manager_notes },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: "ManagerCandidate", id: applicationId },
        { type: "ManagerCandidate", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetManagerRequestsQuery,
  useGetCandidatesForRequestQuery,
  useCreateManagerRequestMutation,
  useUpdateManagerNotesMutation,
} = clientManagerApi;
