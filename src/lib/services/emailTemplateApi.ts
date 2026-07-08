import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  EmailTemplate,
  EmailTemplateType,
  EmailTemplateVariableInfo,
  UpdateEmailTemplateRequest,
  PreviewEmailTemplateResponse,
} from "@/types/emailTemplate";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const emailTemplateApi = createApi({
  reducerPath: "emailTemplateApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["EmailTemplate"],
  endpoints: (builder) => ({
    getEmailTemplateVariables: builder.query<EmailTemplateVariableInfo[], void>({
      query: () => ({ url: "/email-templates/variables", method: "GET" }),
    }),

    getEmailTemplates: builder.query<EmailTemplate[], void>({
      query: () => ({ url: "/email-templates", method: "GET" }),
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "EmailTemplate" as const, id: t.type })), "EmailTemplate"]
          : ["EmailTemplate"],
    }),

    getEmailTemplate: builder.query<EmailTemplate, EmailTemplateType>({
      query: (type) => ({ url: `/email-templates/${type}`, method: "GET" }),
      providesTags: (result, error, type) => [{ type: "EmailTemplate", id: type }],
    }),

    updateEmailTemplate: builder.mutation<EmailTemplate, { type: EmailTemplateType; data: UpdateEmailTemplateRequest }>({
      query: ({ type, data }) => ({
        url: `/email-templates/${type}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { type }) => [{ type: "EmailTemplate", id: type }, "EmailTemplate"],
    }),

    resetEmailTemplate: builder.mutation<EmailTemplate, EmailTemplateType>({
      query: (type) => ({
        url: `/email-templates/${type}/reset`,
        method: "POST",
      }),
      invalidatesTags: (result, error, type) => [{ type: "EmailTemplate", id: type }, "EmailTemplate"],
    }),

    previewEmailTemplate: builder.mutation<PreviewEmailTemplateResponse, { type: EmailTemplateType; data: UpdateEmailTemplateRequest }>({
      query: ({ type, data }) => ({
        url: `/email-templates/${type}/preview`,
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetEmailTemplateVariablesQuery,
  useGetEmailTemplatesQuery,
  useGetEmailTemplateQuery,
  useUpdateEmailTemplateMutation,
  useResetEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
} = emailTemplateApi;
