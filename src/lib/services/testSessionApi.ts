import { createApi } from "@reduxjs/toolkit/query/react";
import type { TestSession, TestSessionDetail, CreateTestSessionRequest, TestSessionStatus, TestSessionType } from "@/types/testSession";
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
}

export const testSessionApi = createApi({
  reducerPath: "testSessionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TestSession"],
  endpoints: (builder) => ({
    getTestSessions: builder.query<TestSessionsResponse, TestSessionsParams | void>({
      query: (params) => {
        const { page = 1, limit = 20, search, status, type, cv_id } = params || {};
        const query: Record<string, string> = { page: page.toString(), limit: limit.toString() };
        if (search) query.search = search;
        if (status) query.status = status;
        if (type) query.type = type;
        if (cv_id) query.cv_id = cv_id;
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
  useCreateTestSessionMutation,
  useDeleteTestSessionMutation,
} = testSessionApi;
