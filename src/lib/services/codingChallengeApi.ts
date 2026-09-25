import { createApi } from "@reduxjs/toolkit/query/react";
import type { CodingChallenge, CreateCodingChallengeRequest, UpdateCodingChallengeRequest, CodingDomain, CodingDifficulty } from "@/types/codingChallenge";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export interface CodingChallengesResponse {
  data: CodingChallenge[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface CodingChallengesParams {
  page?: number;
  limit?: number;
  search?: string;
  domain?: CodingDomain;
  difficulty?: CodingDifficulty;
  is_active?: boolean;
}

export const codingChallengeApi = createApi({
  reducerPath: "codingChallengeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CodingChallenge"],
  endpoints: (builder) => ({
    getCodingChallenges: builder.query<CodingChallengesResponse, CodingChallengesParams | void>({
      query: (params) => {
        const { page = 1, limit = 20, search, domain, difficulty, is_active } = params || {};
        const query: Record<string, string> = { page: page.toString(), limit: limit.toString() };
        if (search) query.search = search;
        if (domain) query.domain = domain;
        if (difficulty) query.difficulty = difficulty;
        if (is_active !== undefined) query.is_active = is_active.toString();
        return { url: "/coding-challenges", method: "GET", params: query };
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "CodingChallenge" as const, id })), { type: "CodingChallenge", id: "LIST" }]
          : [{ type: "CodingChallenge", id: "LIST" }],
    }),
    createCodingChallenge: builder.mutation<CodingChallenge, CreateCodingChallengeRequest>({
      query: (data) => ({ url: "/coding-challenges", method: "POST", body: data }),
      invalidatesTags: [{ type: "CodingChallenge", id: "LIST" }],
    }),
    updateCodingChallenge: builder.mutation<CodingChallenge, { id: string; data: UpdateCodingChallengeRequest }>({
      query: ({ id, data }) => ({ url: `/coding-challenges/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "CodingChallenge", id }, { type: "CodingChallenge", id: "LIST" }],
    }),
    deleteCodingChallenge: builder.mutation<void, string>({
      query: (id) => ({ url: `/coding-challenges/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "CodingChallenge", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCodingChallengesQuery,
  useCreateCodingChallengeMutation,
  useUpdateCodingChallengeMutation,
  useDeleteCodingChallengeMutation,
} = codingChallengeApi;
