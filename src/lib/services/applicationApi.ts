import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';
import type { Application, CreateApplicationRequest, UpdateApplicationRequest } from '@/types/application';

export interface ApplicationsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  workflow_status?: string;
  request_id?: string;
  recruiter_id?: string;
}

export interface ApplicationSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  active_only?: boolean;
}

export interface ApplicationSearchResponse {
  data: Array<{
    id: string;
    candidate_name: string;
    position: string;
    client_name: string;
    reference: string;
    cv?: {
      candidate_first_name?: string;
      candidate_last_name?: string;
    };
    request?: {
      title?: string;
      reference?: string;
      client?: {
        name?: string;
      };
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SendEmailRequest {
  id: string;
  recipients: ('candidate' | 'client')[];
  subject: string;
  message: string;
}

export interface ApplicationsResponse {
  data: Application[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const applicationApi = createApi({
  reducerPath: 'applicationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Application'],
  endpoints: (builder) => ({
    getApplications: builder.query<ApplicationsResponse, ApplicationsQueryParams>({
      query: (params) => ({
        url: '/applications',
        params,
      }),
      providesTags: ['Application'],
    }),

    searchApplicationsForAutocomplete: builder.query<ApplicationSearchResponse, ApplicationSearchParams>({
      query: (params) => ({
        url: '/applications/search',
        params: {
          ...params,
          active_only: true, // Toujours filtrer les candidatures actives pour l'autocomplete
        },
      }),
      providesTags: ['Application'],
    }),

    getApplicationById: builder.query<Application, string>({
      query: (id) => `/applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Application', id }],
    }),

    createApplication: builder.mutation<Application, CreateApplicationRequest>({
      query: (data) => ({
        url: '/applications',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Application'],
    }),

    updateApplication: builder.mutation<Application, { id: string; data: UpdateApplicationRequest }>({
      query: ({ id, data }) => ({
        url: `/applications/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Application', id }, 'Application'],
    }),

    deleteApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Application'],
    }),

    bulkDeleteApplications: builder.mutation<{ success: boolean; deleted: number; errors?: string[] }, string[]>({
      query: (ids) => ({
        url: '/applications/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['Application'],
    }),

    activateApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/applications/${id}/activate`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Application', id }, 'Application'],
    }),

    sendApplicationEmail: builder.mutation<void, SendEmailRequest>({
      query: ({ id, ...data }) => ({
        url: `/applications/${id}/send-email`,
        method: 'POST',
        body: data,
      }),
    }),

    changeApplicationStatus: builder.mutation<void, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/applications/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Application', id }, 'Application'],
    }),
  }),
});

export const {
  useGetApplicationsQuery,
  useLazyGetApplicationByIdQuery,
  useSearchApplicationsForAutocompleteQuery,
  useLazySearchApplicationsForAutocompleteQuery,
  useCreateApplicationMutation,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
  useBulkDeleteApplicationsMutation,
  useActivateApplicationMutation,
  useSendApplicationEmailMutation,
  useChangeApplicationStatusMutation,
} = applicationApi;