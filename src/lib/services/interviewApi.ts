import { createApi } from "@reduxjs/toolkit/query/react";
import type { Interview, CreateInterviewRequest, UpdateInterviewRequest } from "@/types/interview";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const interviewApi = createApi({
  reducerPath: "interviewApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Interview"],
  endpoints: (builder) => ({
    // POST /applications/:id/interviews - Créer un entretien
    createInterview: builder.mutation<Interview, { applicationId: string; data: CreateInterviewRequest }>({
      query: ({ applicationId, data }) => ({
        url: `/applications/${applicationId}/interviews`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: "Interview", id: "LIST" },
        { type: "Interview", id: applicationId },
      ],
    }),

    // GET /applications/:id/interviews - Liste des entretiens d'une candidature
    getApplicationInterviews: builder.query<Interview[], string>({
      query: (applicationId) => ({
        url: `/applications/${applicationId}/interviews`,
        method: "GET",
      }),
      providesTags: (result, error, applicationId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Interview" as const, id })),
              { type: "Interview", id: applicationId },
            ]
          : [{ type: "Interview", id: applicationId }],
    }),

    // GET /applications/interviews - Liste paginée des entretiens
    getInterviews: builder.query<{
      data: Interview[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }, {
      page?: number;
      limit?: number;
      status?: string;
    }>({
      query: ({ page = 1, limit = 10, status }) => ({
        url: "/applications/interviews",
        method: "GET",
        params: {
          page,
          limit,
          ...(status && { status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: "Interview" as const, id })),
              { type: "Interview", id: "LIST" },
            ]
          : [{ type: "Interview", id: "LIST" }],
    }),

    // GET /applications/interviews/all - Tous les entretiens (agenda)
    getAllInterviews: builder.query<Interview[], void>({
      query: () => ({
        url: "/applications/interviews/all",
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Interview" as const, id })),
              { type: "Interview", id: "LIST" },
            ]
          : [{ type: "Interview", id: "LIST" }],
    }),

    // GET /applications/interviews/by-date-range - Entretiens par période (optimisé agenda)
    getInterviewsByDateRange: builder.query<Interview[], { 
      startDate: string; 
      endDate: string; 
      status?: string 
    }>({
      query: ({ startDate, endDate, status }) => ({
        url: "/applications/interviews/by-date-range",
        method: "GET",
        params: {
          startDate,
          endDate,
          ...(status && status !== 'all' && { status }),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Interview" as const, id })),
              { type: "Interview", id: "DATE_RANGE" },
            ]
          : [{ type: "Interview", id: "DATE_RANGE" }],
    }),

    // GET /applications/interviews/:interviewId - Détails d'un entretien
    getInterviewById: builder.query<Interview, string>({
      query: (interviewId) => ({
        url: `/applications/interviews/${interviewId}`,
        method: "GET",
      }),
      providesTags: (result, error, interviewId) => [{ type: "Interview", id: interviewId }],
    }),

    // PATCH /applications/interviews/:interviewId/reschedule - Reporter un entretien
    rescheduleInterview: builder.mutation<Interview, { id: string; scheduled_date: string; duration_minutes?: number }>({
      query: ({ id, scheduled_date, duration_minutes }) => ({
        url: `/applications/interviews/${id}/reschedule`,
        method: "PATCH",
        body: { scheduled_date, duration_minutes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Interview", id },
        { type: "Interview", id: "LIST" },
      ],
    }),

    // PATCH /applications/interviews/:interviewId - Modifier un entretien
    updateInterview: builder.mutation<Interview, { id: string; data: UpdateInterviewRequest }>({
      query: ({ id, data }) => ({
        url: `/applications/interviews/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Interview", id },
        { type: "Interview", id: "LIST" },
      ],
    }),

    // DELETE /applications/interviews/:interviewId - Supprimer un entretien
    deleteInterview: builder.mutation<void, string>({
      query: (interviewId) => ({
        url: `/applications/interviews/${interviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Interview", id: "LIST" }],
    }),

    // POST /applications/interviews/:interviewId/send-email - Envoyer l'email
    sendInterviewEmail: builder.mutation<{ success: boolean; message: string }, string>({
      query: (interviewId) => ({
        url: `/applications/interviews/${interviewId}/send-email`,
        method: "POST",
      }),
      invalidatesTags: (result, error, interviewId) => [{ type: "Interview", id: interviewId }],
    }),

    // PATCH /applications/interviews/:interviewId/status - Changer le statut
    changeInterviewStatus: builder.mutation<Interview, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/applications/interviews/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Interview", id },
        { type: "Interview", id: "LIST" },
      ],
    }),

    // POST /applications/interviews/:interviewId/send-modification-email - Envoyer email de modification
    sendModificationEmail: builder.mutation<{ success: boolean; message: string }, string>({
      query: (interviewId) => ({
        url: `/applications/interviews/${interviewId}/send-modification-email`,
        method: "POST",
      }),
      invalidatesTags: (result, error, interviewId) => [{ type: "Interview", id: interviewId }],
    }),

    // POST /applications/interviews/:interviewId/cancel - Annuler un entretien
    cancelInterview: builder.mutation<{ success: boolean; message: string }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/applications/interviews/${id}/cancel`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Interview", id },
        { type: "Interview", id: "LIST" },
      ],
    }),

    // PATCH /applications/interviews/:interviewId - Modifier les notes uniquement
    updateInterviewNotes: builder.mutation<Interview, { id: string; notes?: string; title?: string; internal_notes?: string }>({
      query: ({ id, ...data }) => ({
        url: `/applications/interviews/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Interview", id },
        { type: "Interview", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateInterviewMutation,
  useGetApplicationInterviewsQuery,
  useLazyGetApplicationInterviewsQuery,
  useGetInterviewsQuery,
  useGetAllInterviewsQuery,
  useLazyGetAllInterviewsQuery,
  useGetInterviewsByDateRangeQuery,
  useLazyGetInterviewsByDateRangeQuery,
  useGetInterviewByIdQuery,
  useLazyGetInterviewByIdQuery,
  useRescheduleInterviewMutation,
  useUpdateInterviewMutation,
  useDeleteInterviewMutation,
  useSendInterviewEmailMutation,
  useChangeInterviewStatusMutation,
  useSendModificationEmailMutation,
  useCancelInterviewMutation,
  useUpdateInterviewNotesMutation,
} = interviewApi;
