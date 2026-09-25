export type TestQuestionType = "technique" | "psychotechnique";
export type TestQuestionDifficulty = "easy" | "medium" | "hard";
export type TestQuestionDomain = "frontend" | "backend" | "fullstack" | "devops";

export interface TestQuestion {
  [key: string]: unknown;
  id: string;
  company_id: string | null;
  type: TestQuestionType;
  domain?: TestQuestionDomain | null;
  category: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty: TestQuestionDifficulty;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestQuestionsResponse {
  data: TestQuestion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTestQuestionRequest {
  type: TestQuestionType;
  domain?: TestQuestionDomain;
  category: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty?: TestQuestionDifficulty;
  is_active?: boolean;
}

export type UpdateTestQuestionRequest = Partial<CreateTestQuestionRequest>;
