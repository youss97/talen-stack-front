import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  TestQuestion,
  TestQuestionsResponse,
  CreateTestQuestionRequest,
  UpdateTestQuestionRequest,
  TestQuestionType,
  TestQuestionDifficulty,
} from "@/types/testQuestion";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

interface TestQuestionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TestQuestionType;
  category?: string;
  difficulty?: TestQuestionDifficulty;
  is_active?: boolean;
}

export const testQuestionApi = createApi({
  reducerPath: "testQuestionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TestQuestion"],
  endpoints: (builder) => ({
    getTestQuestions: builder.query<TestQuestionsResponse, TestQuestionsParams | void>({
      query: (params) => {
        const { page = 1, limit = 20, search, type, category, difficulty, is_active } = params || {};
        const query: Record<string, string> = { page: page.toString(), limit: limit.toString() };
        if (search) query.search = search;
        if (type) query.type = type;
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (is_active !== undefined) query.is_active = is_active.toString();
        return { url: "/test-questions", method: "GET", params: query };
      },
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: "TestQuestion" as const, id })), { type: "TestQuestion", id: "LIST" }]
          : [{ type: "TestQuestion", id: "LIST" }],
    }),
    getTestQuestionCategories: builder.query<{ type: string; category: string }[], void>({
      query: () => ({ url: "/test-questions/categories", method: "GET" }),
    }),
    createTestQuestion: builder.mutation<TestQuestion, CreateTestQuestionRequest>({
      query: (data) => ({ url: "/test-questions", method: "POST", body: data }),
      invalidatesTags: [{ type: "TestQuestion", id: "LIST" }],
    }),
    updateTestQuestion: builder.mutation<TestQuestion, { id: string; data: UpdateTestQuestionRequest }>({
      query: ({ id, data }) => ({ url: `/test-questions/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "TestQuestion", id }, { type: "TestQuestion", id: "LIST" }],
    }),
    deleteTestQuestion: builder.mutation<void, string>({
      query: (id) => ({ url: `/test-questions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "TestQuestion", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTestQuestionsQuery,
  useGetTestQuestionCategoriesQuery,
  useCreateTestQuestionMutation,
  useUpdateTestQuestionMutation,
  useDeleteTestQuestionMutation,
} = testQuestionApi;
