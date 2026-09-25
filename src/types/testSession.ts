export type TestSessionType = "technique" | "psychotechnique" | "both" | "personality";
export type TestSessionStatus = "pending" | "in_progress" | "completed" | "expired";

export type PersonalityDimension =
  | "openness"
  | "conscientiousness"
  | "extraversion"
  | "agreeableness"
  | "neuroticism"
  | "pace"
  | "leadership"
  | "detail_orientation"
  | "authority_relation"
  | "results_orientation";

export type PersonalityDimensionScores = Partial<Record<PersonalityDimension, { average: number; count: number }>>;

export interface TestSessionUserRef {
  id: string;
  first_name?: string;
  last_name?: string;
}

export interface TestSession {
  [key: string]: unknown;
  id: string;
  company_id: string;
  cv_id?: string | null;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_phone?: string | null;
  type: TestSessionType;
  category?: string | null;
  difficulty?: string | null;
  question_ids: string[];
  coding_challenge_ids?: string[] | null;
  personality_item_ids?: string[] | null;
  answers?: number[] | null;
  personality_answers?: number[] | null;
  category_scores?: Record<string, { correct: number; total: number }> | null;
  coding_results?: Array<{ challengeId: string; title: string; passed: number; total: number; code: string }> | null;
  personality_dimension_scores?: PersonalityDimensionScores | null;
  score?: number | null;
  mcq_score?: number | null;
  coding_score?: number | null;
  status: TestSessionStatus;
  time_per_question_seconds?: number | null;
  cheating_detected?: boolean;
  tab_switch_count?: number;
  token: string;
  publicLink: string;
  created_by?: string | null;
  creator?: TestSessionUserRef | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export type TestQuestionDomain = "frontend" | "backend" | "fullstack" | "devops";

export interface CreateTestSessionRequest {
  cv_id?: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  type: TestSessionType;
  domain?: TestQuestionDomain;
  category?: string;
  difficulty?: string;
  question_count?: number;
  include_coding?: boolean;
  coding_challenge_count?: number;
  time_per_question_seconds?: number;
}

export interface PublicTestQuestion {
  id: string;
  type: string;
  category: string;
  question: string;
  options: string[];
}

export interface PublicCodingChallenge {
  id: string;
  domain: string;
  title: string;
  description: string;
  language: string;
  starter_code: string;
}

export interface PublicPersonalityItem {
  id: string;
  statement: string;
}

export interface PublicTestSession {
  status: TestSessionStatus;
  candidateName?: string;
  timePerQuestionSeconds?: number | null;
  questions?: PublicTestQuestion[];
  codingChallenges?: PublicCodingChallenge[];
  personalityItems?: PublicPersonalityItem[];
}

export interface SubmitTestResult {
  score: number;
  mcqScore: number | null;
  codingScore: number | null;
  personalityDimensionScores?: PersonalityDimensionScores | null;
  cheatingDetected?: boolean;
}

export interface TestSessionDetailQuestion {
  id: string;
  type: string;
  category: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  difficulty: string;
}

export interface TestSessionDetailCodingChallenge {
  id: string;
  domain: string;
  title: string;
  description: string;
  language: string;
  starter_code: string;
  difficulty: string;
}

export interface TestSessionDetail extends TestSession {
  questions?: TestSessionDetailQuestion[];
  codingChallenges?: TestSessionDetailCodingChallenge[];
}
