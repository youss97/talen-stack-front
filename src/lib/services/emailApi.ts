import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Email,
  SendEmailRequest,
  EmailPaginationParams,
} from "@/types/email";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface EmailPaginatedResponse {
  data: Email[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const emailApi = createApi({
  reducerPath: "emailApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Email"],
  endpoints: (builder) => ({
    // GET /emails - Get all emails with pagination
    getEmails: builder.query<EmailPaginatedResponse, EmailPaginationParams>({
      query: (params) => ({
        url: "/emails",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.sender_email && { sender_email: params.sender_email }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Email" as const,
                id,
              })),
              { type: "Email", id: "LIST" },
            ]
          : [{ type: "Email", id: "LIST" }],
    }),

    // GET /emails/:id - Get email by ID
    getEmailById: builder.query<Email, string>({
      query: (id) => ({
        url: `/emails/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Email", id }],
    }),

    // POST /emails/send - Send bulk email
    sendEmail: builder.mutation<Email, SendEmailRequest>({
      query: (body) => ({
        url: "/emails/send-bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Email", id: "LIST" }],
    }),

    // DELETE /emails/:id - Delete an email
    deleteEmail: builder.mutation<void, string>({
      query: (id) => ({
        url: `/emails/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Email", id: "LIST" }],
    }),
  }),
});

export const {
  useGetEmailsQuery,
  useGetEmailByIdQuery,
  useSendEmailMutation,
  useDeleteEmailMutation,
} = emailApi;
