import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  TestSession,
  TestSessionDetail,
  CreateTestSessionRequest,
  TestSessionStatus,
  TestSessionType,
  TalopsiaProfile,
  TalopsiaReport,
  TalopsiaReportVariant,
  TalopsiaAlignment,
  TalopsiaManagerClientReport,
} from "@/types/testSession";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface TestSessionsResponse {
  data: TestSession[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface TestSessionsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TestSessionStatus;
  type?: TestSessionType;
  cv_id?: string;
  application_id?: string;
  recruitment_request_id?: string;
}

export const testSessionApi = createApi({
  reducerPath: "testSessionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TestSession"],
  endpoints: (builder) => ({
    getTestSessions: builder.query<TestSessionsResponse, TestSessionsParams | void>({
      query: (params) => {
        const { page = 1, limit = 20, search, status, type, cv_id, application_id, recruitment_request_id } = params || {};
        const query: Record<string, string> = { page: page.toString(), limit: limit.toString() };
        if (search) query.search = search;
        if (status) query.status = status;
        if (type) query.type = type;
        if (cv_id) query.cv_id = cv_id;
        if (application_id) query.application_id = application_id;
        if (recruitment_request_id) query.recruitment_request_id = recruitment_request_id;
        return { url: "/test-sessions", method: "GET", params: query };
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "TestSession" as const, id })), { type: "TestSession", id: "LIST" }]
          : [{ type: "TestSession", id: "LIST" }],
    }),
    getTestSessionById: builder.query<TestSessionDetail, string>({
      query: (id) => ({ url: `/test-sessions/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "TestSession", id }],
    }),
    getTalopsiaProfile: builder.query<TalopsiaProfile, string>({
      query: (id) => ({ url: `/test-sessions/${id}/talopsia-profile`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "TestSession", id }],
    }),
    // TALOPSIA — rapports différenciés (le filtrage des champs est fait côté serveur)
    getTalopsiaReport: builder.query<TalopsiaReport, { id: string; variant: TalopsiaReportVariant }>({
      query: ({ id, variant }) => ({ url: `/test-sessions/${id}/report/${variant}`, method: "GET" }),
      providesTags: (_r, _e, { id }) => [{ type: "TestSession", id }],
    }),
    getTalopsiaAlignment: builder.query<TalopsiaAlignment, string>({
      query: (id) => ({ url: `/test-sessions/${id}/alignment`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "TestSession", id }],
    }),
    // Portail client : rapport client d'une candidature proposée (manager de la demande)
    getManagerClientTalopsiaReport: builder.query<TalopsiaManagerClientReport, string>({
      query: (applicationId) => ({ url: `/test-sessions/manager/application/${applicationId}/client-report`, method: "GET" }),
    }),
    createTestSession: builder.mutation<TestSession, CreateTestSessionRequest>({
      query: (data) => ({ url: "/test-sessions", method: "POST", body: data }),
      invalidatesTags: [{ type: "TestSession", id: "LIST" }],
    }),
    deleteTestSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/test-sessions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "TestSession", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTestSessionsQuery,
  useGetTestSessionByIdQuery,
  useGetTalopsiaProfileQuery,
  useGetTalopsiaReportQuery,
  useGetTalopsiaAlignmentQuery,
  useGetManagerClientTalopsiaReportQuery,
  useCreateTestSessionMutation,
  useDeleteTestSessionMutation,
} = testSessionApi;
