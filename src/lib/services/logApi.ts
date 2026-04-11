import { createApi } from "@reduxjs/toolkit/query/react";
import type { Log, LogPaginationParams } from "@/types/log";
import type { PaginatedResponse } from "@/types/company";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const logApi = createApi({
  reducerPath: "logApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Log"],
  endpoints: (builder) => ({
    // GET /logs/audit - Get all audit logs with pagination
    getLogs: builder.query<PaginatedResponse<Log>, LogPaginationParams>({
      query: (params) => ({
        url: "/logs/audit",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.userId && { userId: params.userId }),
          ...(params.action && { action: params.action }),
          ...(params.tableName && { tableName: params.tableName }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Log" as const,
                id,
              })),
              { type: "Log", id: "LIST" },
            ]
          : [{ type: "Log", id: "LIST" }],
    }),
  }),
});

export const { useGetLogsQuery } = logApi;
