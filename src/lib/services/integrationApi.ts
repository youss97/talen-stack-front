import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';
import {
  Integration,
  CreateIntegrationDto,
  UpdateIntegrationDto,
  IntegrationStatistics,
  IntegrationStatus,
  TrialPeriodStatus,
} from '@/types/integration';

export const integrationApi = createApi({
  reducerPath: 'integrationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Integration', 'IntegrationStats'],
  endpoints: (builder) => ({
    // Récupérer toutes les intégrations pour l'agenda
    getAllIntegrations: builder.query<Integration[], void>({
      query: () => '/integrations/all',
      providesTags: ['Integration'],
    }),

    // Récupérer les intégrations par période (optimisé agenda)
    getIntegrationsByDateRange: builder.query<Integration[], {
      startDate: string;
      endDate: string;
      status?: IntegrationStatus | 'all'
    }>({
      query: ({ startDate, endDate, status }) => ({
        url: '/integrations/by-date-range',
        params: {
          startDate,
          endDate,
          ...(status && status !== 'all' && { status }),
        },
      }),
      providesTags: ['Integration'],
    }),

    // Récupérer toutes les intégrations
    getIntegrations: builder.query<
      {
        data: Integration[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      },
      {
        page?: number;
        limit?: number;
        status?: IntegrationStatus;
        trialPeriodStatus?: TrialPeriodStatus;
        clientId?: string;
      }
    >({
      query: (params) => ({
        url: '/integrations',
        params,
      }),
      providesTags: ['Integration'],
    }),

    // Récupérer une intégration par ID
    getIntegrationById: builder.query<Integration, string>({
      query: (id) => `/integrations/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Integration', id }],
    }),

    // Créer une intégration
    createIntegration: builder.mutation<Integration, CreateIntegrationDto>({
      query: (data) => ({
        url: '/integrations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Integration', 'IntegrationStats'],
    }),

    // Mettre à jour une intégration
    updateIntegration: builder.mutation<
      Integration,
      { id: string; data: UpdateIntegrationDto }
    >({
      query: ({ id, data }) => ({
        url: `/integrations/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Supprimer une intégration
    deleteIntegration: builder.mutation<void, string>({
      query: (id) => ({
        url: `/integrations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Integration', 'IntegrationStats'],
    }),

    // Valider/invalider la période d'essai
    validateTrialPeriod: builder.mutation<
      Integration,
      { id: string; validated: boolean; notes?: string }
    >({
      query: ({ id, validated, notes }) => ({
        url: `/integrations/${id}/validate-trial`,
        method: 'POST',
        body: { validated, notes },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Marquer comme terminée
    completeIntegration: builder.mutation<
      Integration,
      { id: string; finalRating?: number; finalEvaluation?: string }
    >({
      query: ({ id, finalRating, finalEvaluation }) => ({
        url: `/integrations/${id}/complete`,
        method: 'POST',
        body: { finalRating, finalEvaluation },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Enregistrer un départ
    recordDeparture: builder.mutation<
      Integration,
      { id: string; departureDate: string; reason?: string }
    >({
      query: ({ id, departureDate, reason }) => ({
        url: `/integrations/${id}/departure`,
        method: 'POST',
        body: { departureDate, reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Renouveler une intégration
    renewIntegration: builder.mutation<
      Integration,
      { 
        id: string; 
        new_end_date: string;
        renewal_period_months: number;
        renewal_notes?: string;
      }
    >({
      query: ({ id, new_end_date, renewal_period_months, renewal_notes }) => ({
        url: `/integrations/${id}/renew`,
        method: 'POST',
        body: { new_end_date, renewal_period_months, renewal_notes },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Mettre à jour les notes d'évaluation
    updateEvaluationNotes: builder.mutation<
      Integration,
      { 
        id: string; 
        evaluation_notes: string;
        performance_rating?: number;
        evaluation_date?: string;
      }
    >({
      query: ({ id, evaluation_notes, performance_rating, evaluation_date }) => ({
        url: `/integrations/${id}/evaluation-notes`,
        method: 'POST',
        body: { evaluation_notes, performance_rating, evaluation_date },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Integration', id },
        'Integration',
        'IntegrationStats',
      ],
    }),

    // Récupérer les statistiques
    getStatistics: builder.query<IntegrationStatistics, void>({
      query: () => '/integrations/statistics',
      providesTags: ['IntegrationStats'],
    }),
  }),
});

export const {
  useGetAllIntegrationsQuery,
  useGetIntegrationsByDateRangeQuery,
  useLazyGetIntegrationsByDateRangeQuery,
  useGetIntegrationsQuery,
  useGetIntegrationByIdQuery,
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  useValidateTrialPeriodMutation,
  useCompleteIntegrationMutation,
  useRecordDepartureMutation,
  useRenewIntegrationMutation,
  useUpdateEvaluationNotesMutation,
  useGetStatisticsQuery,
} = integrationApi;
