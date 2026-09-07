import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  PublicJobOffer,
  PublicApplication,
  PublicJobOfferStats,
  CreatePublicJobOfferData,
  CreatePublicApplicationData,
  ResponsibleUser,
} from '@/types/publicJobOffer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const publicJobOfferApi = createApi({
  reducerPath: 'publicJobOfferApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/applications`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PublicJobOffer', 'PublicApplication', 'ApplicationRequest'],
  endpoints: (builder) => ({
    // Admin endpoints - Utilise maintenant recruitment_requests
    getPublicJobOffers: builder.query<{ data: PublicJobOffer[]; pagination: { page: number; limit: number; total: number; totalPages: number } }, { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "ASC" | "DESC" }>({
      query: ({ page = 1, limit = 5, search, sortBy, sortOrder } = {}) => ({
        url: '/requests/public/all',
        params: { page, limit, ...(search && { search }), ...(sortBy && { sortBy }), ...(sortOrder && { sortOrder }) }
      }),
      providesTags: ['PublicJobOffer'],
    }),

    getPublicJobOfferById: builder.query<PublicJobOffer, string>({
      query: (id) => `/requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'PublicJobOffer', id }],
    }),

    // Candidatures d'offre publique d'une demande (séparées des candidatures)
    getPublicApplicationsByRequest: builder.query<PublicApplication[], { requestId: string; referrerId?: string }>({
      query: ({ requestId, referrerId }) => ({
        url: `/requests/${requestId}/public-applications`,
        params: referrerId ? { referrerId } : undefined,
      }),
      providesTags: (result, error, { requestId }) => [{ type: 'PublicApplication', id: requestId }],
    }),

    // Personnes assignées/responsables d'une demande — alimente le filtre "recruteur référent"
    getRequestResponsibleUsers: builder.query<ResponsibleUser[], string>({
      query: (requestId) => `/requests/${requestId}/responsible-users`,
    }),

    // Configurer l'affichage d'une offre publique (champs visibles)
    updatePublicOfferConfig: builder.mutation<PublicJobOffer, { id: string; data: { public_visible_fields?: string[] } }>({
      query: ({ id, data }) => ({
        url: `/requests/${id}/public-config`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'PublicJobOffer', id }, 'PublicJobOffer'],
    }),

    // Transformer une candidature publique en vraie candidature (ancien flux direct)
    convertPublicApplication: builder.mutation<{ application_id: string; cv_id: string; extraction_warning: string | null }, { id: string; requestId: string }>({
      query: ({ id }) => ({
        url: `/public-applications/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'PublicApplication', id: requestId }],
    }),

    // Nouveau flux "Candidature" — étape 1 : prépare/complète le CV vivier sans marquer la
    // candidature publique comme convertie (sert à préremplir le formulaire de candidature).
    prepareCvForPublicApplication: builder.mutation<{ cv_id: string; is_new_cv: boolean; extraction_warning: string | null }, string>({
      query: (id) => ({
        url: `/public-applications/${id}/prepare-cv`,
        method: 'POST',
      }),
    }),

    // Nouveau flux "Candidature" — étape 2 : marque la candidature publique comme convertie
    // une fois la vraie candidature créée depuis le formulaire pré-rempli.
    finalizePublicApplicationConversion: builder.mutation<void, { id: string; requestId: string; cv_id: string; application_id: string }>({
      query: ({ id, cv_id, application_id }) => ({
        url: `/public-applications/${id}/finalize-conversion`,
        method: 'POST',
        body: { cv_id, application_id },
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'PublicApplication', id: requestId }],
    }),

    // Supprimer une candidature d'offre publique (non transformée)
    deletePublicApplication: builder.mutation<void, { id: string; requestId: string; templateId?: string; subject?: string; body_html?: string; skipEmail?: boolean }>({
      query: ({ id, templateId, subject, body_html, skipEmail }) => ({
        url: `/public-applications/${id}`,
        method: 'DELETE',
        body: { templateId, subject, body_html, skipEmail },
      }),
      invalidatesTags: (result, error, { requestId }) => [{ type: 'PublicApplication', id: requestId }],
    }),

    // Candidatures SPONTANÉES (sans offre) de la société, pas encore ajoutées au vivier
    getSpontaneousApplications: builder.query<PublicApplication[], void>({
      query: () => `/spontaneous-applications`,
      providesTags: ['PublicApplication'],
    }),

    // Ajouter une candidature spontanée au vivier de talents
    convertSpontaneousApplication: builder.mutation<{ cv_id: string; extraction_warning: string | null }, string>({
      query: (id) => ({
        url: `/spontaneous-applications/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: ['PublicApplication'],
    }),

    // Supprimer une candidature spontanée (non ajoutée au vivier)
    deleteSpontaneousApplication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/spontaneous-applications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PublicApplication'],
    }),

    togglePublicJobOfferActive: builder.mutation<PublicJobOffer, string>({
      query: (id) => ({
        url: `/requests/${id}/toggle-public`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'PublicJobOffer', id }, 
        'PublicJobOffer',
      ],
    }),

    deletePublicJobOffer: builder.mutation<void, string>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PublicJobOffer'],
    }),

    // Public endpoints (no auth) - Utilise une baseUrl différente
    getPublicJobOfferBySlug: builder.query<PublicJobOffer, string>({
      query: (slug) => ({
        url: `${API_URL}/public/applications/offers/slug/${slug}`,
      }),
    }),

    submitPublicApplication: builder.mutation<PublicApplication, { slug: string; data: FormData }>({
      query: ({ slug, data }) => ({
        url: `${API_URL}/public/applications/offers/${slug}/apply`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetPublicJobOffersQuery,
  useGetPublicJobOfferByIdQuery,
  useGetPublicApplicationsByRequestQuery,
  useGetRequestResponsibleUsersQuery,
  useUpdatePublicOfferConfigMutation,
  useConvertPublicApplicationMutation,
  usePrepareCvForPublicApplicationMutation,
  useFinalizePublicApplicationConversionMutation,
  useDeletePublicApplicationMutation,
  useGetSpontaneousApplicationsQuery,
  useConvertSpontaneousApplicationMutation,
  useDeleteSpontaneousApplicationMutation,
  useTogglePublicJobOfferActiveMutation,
  useDeletePublicJobOfferMutation,
  useGetPublicJobOfferBySlugQuery,
  useSubmitPublicApplicationMutation,
} = publicJobOfferApi;
