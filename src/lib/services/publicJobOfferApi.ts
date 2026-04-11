import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  PublicJobOffer,
  PublicApplication,
  PublicJobOfferStats,
  CreatePublicJobOfferData,
  CreatePublicApplicationData,
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
    getPublicJobOffers: builder.query<{ data: PublicJobOffer[]; meta: { page: number; limit: number; total: number; totalPages: number } }, { page?: number; limit?: number; search?: string }>({
      query: ({ page = 1, limit = 5, search } = {}) => ({
        url: '/requests/public/all',
        params: { page, limit, ...(search && { search }) }
      }),
      providesTags: ['PublicJobOffer'],
    }),

    getPublicJobOfferById: builder.query<PublicJobOffer, string>({
      query: (id) => `/requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'PublicJobOffer', id }],
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
  useTogglePublicJobOfferActiveMutation,
  useDeletePublicJobOfferMutation,
  useGetPublicJobOfferBySlugQuery,
  useSubmitPublicApplicationMutation,
} = publicJobOfferApi;
