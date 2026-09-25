export type CodingDomain = "frontend" | "backend" | "fullstack" | "devops";
export type CodingLanguage = "javascript" | "python";
export type CodingDifficulty = "easy" | "medium" | "hard";

export interface CodingTestCase {
  input: string;
  expected_output: string;
}

export interface CodingChallenge {
  [key: string]: unknown;
  id: string;
  company_id: string | null;
  domain: CodingDomain;
  title: string;
  description: string;
  language: CodingLanguage;
  starter_code: string;
  test_cases: CodingTestCase[];
  difficulty: CodingDifficulty;
  is_active: boolean;
  created_at: string;
}

export interface CreateCodingChallengeRequest {
  domain: CodingDomain;
  title: string;
  description: string;
  language?: CodingLanguage;
  starter_code: string;
  test_cases: CodingTestCase[];
  difficulty?: CodingDifficulty;
  is_active?: boolean;
}

export type UpdateCodingChallengeRequest = Partial<CreateCodingChallengeRequest>;
