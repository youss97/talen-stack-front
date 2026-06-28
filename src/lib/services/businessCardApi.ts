import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface BusinessCard {
  id: string;
  company_id?: string;
  owner_type: string;
  owner_user_id?: string | null;
  full_name: string;
  position?: string;
  company_label?: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  socials?: Record<string, string>;
  custom_fields?: { type: string; label: string; value: string }[];
  branding?: Record<string, string>;
  is_active: boolean;
  created_at?: string;
}

export const businessCardApi = createApi({
  reducerPath: "businessCardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["BusinessCard"],
  endpoints: (builder) => ({
    getBusinessCards: builder.query<BusinessCard[], void>({
      query: () => ({ url: "/business-cards", method: "GET" }),
      providesTags: ["BusinessCard"],
    }),
    createBusinessCard: builder.mutation<BusinessCard, Partial<BusinessCard>>({
      query: (body) => ({ url: "/business-cards", method: "POST", body }),
      invalidatesTags: ["BusinessCard"],
    }),
    updateBusinessCard: builder.mutation<BusinessCard, { id: string; data: Partial<BusinessCard> }>({
      query: ({ id, data }) => ({ url: `/business-cards/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["BusinessCard"],
    }),
    deleteBusinessCard: builder.mutation<void, string>({
      query: (id) => ({ url: `/business-cards/${id}`, method: "DELETE" }),
      invalidatesTags: ["BusinessCard"],
    }),
  }),
});

export const {
  useGetBusinessCardsQuery,
  useCreateBusinessCardMutation,
  useUpdateBusinessCardMutation,
  useDeleteBusinessCardMutation,
} = businessCardApi;
