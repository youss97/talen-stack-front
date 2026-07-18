import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface PricingPlan { name: string; price: string; currency?: string; cycle?: string; period?: string; features: string[]; highlighted?: boolean; ctaText?: string }
export interface Testimonial { name: string; role?: string; company?: string; text: string; rating?: number; avatar?: string }
export interface FeatureItem { title: string; text?: string }
export interface Partner { name?: string; logoUrl: string }

export type LandingLocale = "fr" | "en" | "ar";

/** Contenu éditorial traduisible (dupliqué par langue) */
export interface LandingLocalizedContent {
  hero?: { title?: string; subtitle?: string; ctaText?: string; ctaLink?: string };
  about?: { title?: string; text?: string };
  features?: FeatureItem[];
  pricing?: PricingPlan[];
  testimonials?: Testimonial[];
  partners?: Partner[];
  contact?: { email?: string; phone?: string; address?: string; linkedin?: string; instagram?: string };
}

export interface LandingData {
  // Identité — commune à toutes les langues
  logoUrl?: string;
  siteName?: string;
  brandColor?: string;
  // Contenu éditorial par langue
  locales?: Partial<Record<LandingLocale, LandingLocalizedContent>>;
}
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const landingApi = createApi({
  reducerPath: "landingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Landing", "ContactMessages"],
  endpoints: (builder) => ({
    getLanding: builder.query<LandingData, void>({
      query: () => ({ url: "/landing", method: "GET" }),
      providesTags: ["Landing"],
    }),
    updateLanding: builder.mutation<LandingData, LandingData>({
      query: (data) => ({ url: "/landing", method: "PUT", body: data }),
      invalidatesTags: ["Landing"],
    }),
    getContactMessages: builder.query<{ data: ContactMessage[]; total: number; totalPages: number }, { page?: number } | void>({
      query: (params) => ({ url: "/landing/messages", method: "GET", params: { page: params?.page || 1, limit: 20 } }),
      providesTags: ["ContactMessages"],
    }),
    markMessageRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/landing/messages/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["ContactMessages"],
    }),
  }),
});

export const {
  useGetLandingQuery,
  useUpdateLandingMutation,
  useGetContactMessagesQuery,
  useMarkMessageReadMutation,
} = landingApi;
