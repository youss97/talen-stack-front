import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  Recruiter,
  CreateRecruiterRequest,
  UpdateRecruiterRequest,
  RecruiterPaginationParams,
  ApplicationStatusHistory,
  ApplicationFeedback,
} from "@/types/recruiter";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface RecruiterPaginatedResponse {
  data: Recruiter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const recruiterApi = createApi({
  reducerPath: "recruiterApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Recruiter"],
  endpoints: (builder) => ({
    // GET /applications - Get all applications with pagination
    getRecruiters: builder.query<RecruiterPaginatedResponse, RecruiterPaginationParams>({
      query: (params) => ({
        url: "/applications",
        method: "GET",
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.search && { search: params.search }),
          ...(params.status && { status: params.status }),
          ...(params.workflow_status && { workflow_status: params.workflow_status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: "Recruiter" as const,
                id,
              })),
              { type: "Recruiter", id: "LIST" },
            ]
          : [{ type: "Recruiter", id: "LIST" }],
    }),

    // GET /applications/:id - Get application by ID
    getRecruiterById: builder.query<Recruiter, string>({
      query: (id) => ({
        url: `/applications/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Recruiter", id }],
    }),

    // POST /applications - Create a new application
    createRecruiter: builder.mutation<Recruiter, CreateRecruiterRequest>({
      query: (body) => ({
        url: "/applications",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Recruiter", id: "LIST" }],
    }),

    // PATCH /applications/:id - Update an application
    updateRecruiter: builder.mutation<Recruiter, { id: string; data: UpdateRecruiterRequest }>({
      query: ({ id, data }) => ({
        url: `/applications/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Recruiter", id },
        { type: "Recruiter", id: "LIST" },
      ],
    }),

    // DELETE /applications/:id - Delete an application
    deleteRecruiter: builder.mutation<void, string>({
      query: (id) => ({
        url: `/applications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Recruiter", id: "LIST" }],
    }),

    // POST /applications/:id/change-status - Change application status
    changeApplicationStatus: builder.mutation<
      Recruiter,
      { id: string; new_status: string; note?: string }
    >({
      query: ({ id, new_status, note }) => ({
        url: `/applications/${id}/change-status`,
        method: "POST",
        body: { new_status, note },
      }),
      // Mise à jour optimiste du cache
      async onQueryStarted({ id, new_status }, { dispatch, queryFulfilled }) {
        // Mise à jour optimiste du cache pour getRecruiterById
        const patchResult = dispatch(
          recruiterApi.util.updateQueryData('getRecruiterById', id, (draft) => {
            if (draft) {
              draft.status = new_status as Recruiter['status'];
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // En cas d'erreur, annuler les mises à jour optimistes
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Recruiter", id },
        { type: "Recruiter", id: "LIST" },
      ],
    }),

    // GET /applications/:id/status-history - Get status change history
    getApplicationStatusHistory: builder.query<ApplicationStatusHistory[], string>({
      query: (id) => ({
        url: `/applications/${id}/status-history`,
        method: "GET",
      }),
    }),

    // POST /applications/:id/activate - Activate application
    activateApplication: builder.mutation<Recruiter, string>({
      query: (id) => ({
        url: `/applications/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Recruiter", id },
        { type: "Recruiter", id: "LIST" },
      ],
    }),

    // POST /applications/:id/feedbacks - Create feedback
    createFeedback: builder.mutation<
      ApplicationFeedback,
      { id: string; title: string; description: string }
    >({
      query: ({ id, title, description }) => ({
        url: `/applications/${id}/feedbacks`,
        method: "POST",
        body: { title, description },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Recruiter", id },
      ],
    }),

    // GET /applications/:id/feedbacks - Get feedbacks
    getApplicationFeedbacks: builder.query<ApplicationFeedback[], string>({
      query: (id) => ({
        url: `/applications/${id}/feedbacks`,
        method: "GET",
      }),
    }),

    // POST /applications/:id/send-email - Send email to candidate, client, or both
    sendApplicationEmail: builder.mutation<
      { success: boolean; message: string },
      { id: string; recipients: ('candidate' | 'client')[]; subject: string; message: string }
    >({
      query: ({ id, recipients, subject, message }) => ({
        url: `/applications/${id}/send-email`,
        method: "POST",
        body: { recipients, subject, message },
      }),
    }),
  }),
});

export const {
  useGetRecruitersQuery,
  useGetRecruiterByIdQuery,
  useLazyGetRecruiterByIdQuery,
  useCreateRecruiterMutation,
  useUpdateRecruiterMutation,
  useDeleteRecruiterMutation,
  useChangeApplicationStatusMutation,
  useGetApplicationStatusHistoryQuery,
  useLazyGetApplicationStatusHistoryQuery,
  useActivateApplicationMutation,
  useCreateFeedbackMutation,
  useGetApplicationFeedbacksQuery,
  useLazyGetApplicationFeedbacksQuery,
  useSendApplicationEmailMutation,
} = recruiterApi;
