import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  EmailTemplate,
  EmailTemplateType,
  EmailTemplateVariableInfo,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  DefaultEmailTemplateContent,
  PreviewEmailTemplateResponse,
} from "@/types/emailTemplate";
import type { PaginatedResponse } from "@/types/company";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const emailTemplateApi = createApi({
  reducerPath: "emailTemplateApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["EmailTemplate"],
  endpoints: (builder) => ({
    getEmailTemplateVariables: builder.query<EmailTemplateVariableInfo[], void>({
      query: () => ({ url: "/email-templates/variables", method: "GET" }),
    }),

    // Tous les templates enregistrés de la société, tous types confondus (le frontend groupe par type).
    getEmailTemplates: builder.query<EmailTemplate[], void>({
      query: () => ({ url: "/email-templates", method: "GET" }),
      providesTags: (result) =>
        result
          ? [...result.map((t) => ({ type: "EmailTemplate" as const, id: t.id })), "EmailTemplate"]
          : ["EmailTemplate"],
    }),

    // Recherche paginée par nom pour un type — utilisé par le select autocomplete (TemplatePickerModal)
    getEmailTemplatesForSelect: builder.infiniteQuery<
      PaginatedResponse<EmailTemplate>,
      { type: EmailTemplateType; search?: string },
      { page: number; limit: number }
    >({
      infiniteQueryOptions: {
        initialPageParam: {
          page: 1,
          limit: 10,
        },
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
          const currentPage = lastPage.pagination.page;
          const totalPages = lastPage.pagination.totalPages;
          if (currentPage >= totalPages) {
            return undefined;
          }
          return {
            ...lastPageParam,
            page: lastPageParam.page + 1,
          };
        },
        getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => {
          if (firstPageParam.page > 1) {
            return {
              ...firstPageParam,
              page: firstPageParam.page - 1,
            };
          }
          return undefined;
        },
      },
      query: ({ pageParam, queryArg }) => ({
        url: "/email-templates/search",
        method: "GET",
        params: {
          type: queryArg.type,
          page: pageParam.page,
          limit: pageParam.limit,
          ...(queryArg?.search && { search: queryArg.search }),
        },
      }),
      providesTags: ["EmailTemplate"],
    }),

    getEmailTemplateDefault: builder.query<DefaultEmailTemplateContent, EmailTemplateType>({
      query: (type) => ({ url: `/email-templates/default/${type}`, method: "GET" }),
    }),

    getEmailTemplate: builder.query<EmailTemplate, string>({
      query: (id) => ({ url: `/email-templates/${id}`, method: "GET" }),
      providesTags: (result, error, id) => [{ type: "EmailTemplate", id }],
    }),

    createEmailTemplate: builder.mutation<EmailTemplate, CreateEmailTemplateRequest>({
      query: (data) => ({ url: "/email-templates", method: "POST", body: data }),
      invalidatesTags: ["EmailTemplate"],
    }),

    updateEmailTemplate: builder.mutation<EmailTemplate, { id: string; data: UpdateEmailTemplateRequest }>({
      query: ({ id, data }) => ({ url: `/email-templates/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: "EmailTemplate", id }, "EmailTemplate"],
    }),

    deleteEmailTemplate: builder.mutation<void, string>({
      query: (id) => ({ url: `/email-templates/${id}`, method: "DELETE" }),
      invalidatesTags: ["EmailTemplate"],
    }),

    setDefaultEmailTemplate: builder.mutation<EmailTemplate, string>({
      query: (id) => ({ url: `/email-templates/${id}/set-default`, method: "PATCH" }),
      invalidatesTags: ["EmailTemplate"],
    }),

    previewEmailTemplate: builder.mutation<PreviewEmailTemplateResponse, { type: EmailTemplateType; data: { subject: string; body_html: string } }>({
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
  useGetEmailTemplatesForSelectInfiniteQuery,
  useGetEmailTemplateDefaultQuery,
  useGetEmailTemplateQuery,
  useCreateEmailTemplateMutation,
  useUpdateEmailTemplateMutation,
  useDeleteEmailTemplateMutation,
  useSetDefaultEmailTemplateMutation,
  usePreviewEmailTemplateMutation,
} = emailTemplateApi;
