import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface ReportErrorRequest {
  page: string;
  action?: string;
  message: string;
}

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    reportError: builder.mutation<{ success: boolean }, ReportErrorRequest>({
      query: (data) => ({ url: "/support/report", method: "POST", body: data }),
    }),
  }),
});

export const { useReportErrorMutation } = supportApi;
