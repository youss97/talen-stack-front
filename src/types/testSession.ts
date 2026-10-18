// 'technique' = QCM technique ; 'talopsia' = évaluation TALOPSIA Profile (80 Likert + 20 choix forcés)
export type TestSessionType = "technique" | "talopsia";
export type TestSessionStatus = "pending" | "in_progress" | "completed" | "expired";
export type ForcedChoiceAnswer = "A" | "B";

/** Codes stables des 15 dimensions TALOPSIA (clés i18n `tests.talopsia.dimensions.<code>`). */
export type TalopsiaDimensionCode =
  | "Openness"
  | "Conscientiousness"
  | "Extraversion"
  | "Agreeableness"
  | "EmotionalStability"
  | "Results"
  | "Organization"
  | "Autonomy"
  | "Adaptability"
  | "DecisionMaking"
  | "Influence"
  | "Cooperation"
  | "Leadership"
  | "Rigor"
  | "Pressure";

export interface TalopsiaScoreEntry {
  raw: number;
  level: number; // 1 = Très faible … 5 = Très élevé
}

export interface TalopsiaPatternResult {
  code: string;
  label: string;
  matched: boolean;
}

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
  application_id?: string | null;
  recruitment_request_id?: string | null;
  candidate_first_name: string;
  candidate_last_name: string;
  candidate_email: string;
  candidate_phone?: string | null;
  type: TestSessionType;
  category?: string | null;
  difficulty?: string | null;
  question_ids: string[];
  answers?: number[] | null;
  category_scores?: Record<string, { correct: number; total: number }> | null;
  talopsia_item_ids?: string[] | null;
  talopsia_likert_answers?: number[] | null;
  forced_choice_block_ids?: string[] | null;
  forced_choice_answers?: ForcedChoiceAnswer[] | null;
  talopsia_facet_scores?: Record<string, TalopsiaScoreEntry> | null;
  talopsia_dimension_scores?: Record<string, TalopsiaScoreEntry> | null;
  talopsia_pattern_results?: TalopsiaPatternResult[] | null;
  scoring_version?: string | null;
  score?: number | null;
  mcq_score?: number | null;
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
  application_id?: string;
  recruitment_request_id?: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  type: TestSessionType;
  domain?: TestQuestionDomain;
  category?: string;
  difficulty?: string;
  question_count?: number;
  time_per_question_seconds?: number;
}

export interface PublicTestQuestion {
  id: string;
  type: string;
  category: string;
  question: string;
  options: string[];
}

export interface PublicLikertItem {
  id: string;
  statement: string;
}

export interface PublicForcedChoiceBlock {
  id: string;
  a: string;
  b: string;
}

export interface PublicTestSession {
  status: TestSessionStatus;
  type?: TestSessionType;
  candidateName?: string;
  timePerQuestionSeconds?: number | null;
  questions?: PublicTestQuestion[];
  likertItems?: PublicLikertItem[];
  forcedChoiceBlocks?: PublicForcedChoiceBlock[];
}

export interface SubmitTestRequest {
  answers?: number[];
  likert_answers?: number[];
  forced_choice_answers?: ForcedChoiceAnswer[];
  cheatingDetected?: boolean;
  tabSwitchCount?: number;
}

/** Test technique : score renvoyé ; TALOPSIA : aucun score renvoyé au candidat. */
export interface SubmitTestResult {
  status?: "completed";
  score?: number;
  mcqScore?: number | null;
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

export interface TestSessionDetail extends TestSession {
  questions?: TestSessionDetailQuestion[];
}

// ---- Profil TALOPSIA (GET /test-sessions/:id/talopsia-profile) ----
export interface TalopsiaProfileFacet {
  code: string;
  name: string;
  display_order: number;
  raw: number | null;
  level: number | null;
}

export interface TalopsiaProfileDimension {
  code: TalopsiaDimensionCode;
  name: string;
  category: "personality" | "professional_behavior";
  display_order: number;
  raw: number | null;
  level: number | null;
  facets: TalopsiaProfileFacet[];
}

export interface TalopsiaRankedPattern {
  code: string;
  label: string;
  criteriaCount: number;
}

// ---- Job Profile (GET/POST/PATCH /applications/requests/:id/talopsia-profile) ----
/** 0 = non évalué … 4 = très important. Une importance n'est PAS un score minimum. */
export type TalopsiaJobImportance = 0 | 1 | 2 | 3 | 4;

export interface TalopsiaJobProfileEntry {
  dimension_code: TalopsiaDimensionCode;
  importance: TalopsiaJobImportance;
}

export interface TalopsiaJobProfile {
  recruitment_request_id: string;
  configured: boolean;
  entries: Array<
    TalopsiaJobProfileEntry & { name: string; category: "personality" | "professional_behavior"; display_order: number }
  >;
}

// ---- Alignement (ALIGNMENT_V1) — libellés qualitatifs uniquement, jamais de % ----
export type TalopsiaAlignmentLabel = "Très aligné" | "Aligné" | "Partiellement aligné" | "À examiner";

export interface TalopsiaInterviewTopic {
  source: "alignment" | "pattern" | "profile";
  ref: string;
  dimensions: string[];
  text: string;
}

export interface TalopsiaAlignmentDimension {
  dimension_code: TalopsiaDimensionCode;
  dimension_name: string;
  category: "personality" | "professional_behavior";
  importance: TalopsiaJobImportance;
  importance_label: string;
  reference_level: number;
  level: number | null;
  level_label: string;
  alignment: TalopsiaAlignmentLabel;
  explanation: string | null;
}

export type TalopsiaAlignment =
  | {
      available: true;
      recruitmentRequestId: string;
      version: string;
      disclaimer: string;
      dimensions: TalopsiaAlignmentDimension[];
      summary: Record<TalopsiaAlignmentLabel, number>;
      interview_topics: TalopsiaInterviewTopic[];
    }
  | { available: false; reason: "NOT_COMPLETED" | "NO_RECRUITMENT_REQUEST" | "NO_JOB_PROFILE"; message: string };

// ---- Rapports différenciés (GET /test-sessions/:id/report/{candidate|recruiter|client}) ----
export type TalopsiaReportVariant = "candidate" | "recruiter" | "client";

export interface TalopsiaReportDimensionLevel {
  code: TalopsiaDimensionCode;
  name: string;
  category: "personality" | "professional_behavior";
  display_order: number;
  level: number | null;
  intensity: string;
}

export interface TalopsiaCandidateReport {
  variant: "candidate";
  sessionId: string;
  completedAt: string | null;
  candidate: { firstName: string };
  disclaimer: string;
  dimensions: TalopsiaReportDimensionLevel[];
  topPatterns: Array<{ code: string; label: string }>;
  attentionPoints: string[];
}

export type TalopsiaClientAlignment =
  | {
      available: true;
      version: string;
      disclaimer: string;
      dimensions: Array<{
        dimension_code: TalopsiaDimensionCode;
        dimension_name: string;
        category: "personality" | "professional_behavior";
        alignment: TalopsiaAlignmentLabel;
        explanation: string | null;
      }>;
      summary: Record<TalopsiaAlignmentLabel, number>;
    }
  | { available: false; reason: string; message: string };

export interface TalopsiaClientReport {
  variant: "client";
  sessionId: string;
  completedAt: string | null;
  disclaimer: string;
  summary: string;
  highlights: string[];
  pointsToExplore: string[];
  dimensions: TalopsiaReportDimensionLevel[];
  topPatterns: Array<{ code: string; label: string }>;
  alignment: TalopsiaClientAlignment;
  interviewTopics: string[];
}

export interface TalopsiaRecruiterReport extends TalopsiaProfile {
  variant: "recruiter";
  jobProfile: TalopsiaJobProfileEntry[] | null;
  alignment: TalopsiaAlignment;
  interviewGuide: { version: string; topics: TalopsiaInterviewTopic[] };
  responses: {
    likert: Array<{ item_code: string; statement: string; facet_code: string | null; polarity: string; response: number | null }>;
    forcedChoice: Array<{ block_code: string; a: string; b: string; choice: ForcedChoiceAnswer | null }>;
  };
  metadata: {
    alignmentVersion: string;
    interviewGuideVersion: string;
    cheatingDetected: boolean;
    tabSwitchCount: number;
    createdAt: string;
    startedAt: string | null;
  };
}

export type TalopsiaReport = TalopsiaCandidateReport | TalopsiaRecruiterReport | TalopsiaClientReport;

export type TalopsiaManagerClientReport = { available: true; report: TalopsiaClientReport } | { available: false };

export interface TalopsiaProfile {
  sessionId: string;
  status: TestSessionStatus;
  scoringVersion: string;
  completedAt: string | null;
  candidate: { firstName: string; lastName: string; email: string };
  applicationId: string | null;
  recruitmentRequestId: string | null;
  dimensions: TalopsiaProfileDimension[];
  topPatterns: TalopsiaRankedPattern[];
  allPatterns: TalopsiaPatternResult[] | null;
  forcedChoicePreferences: {
    dimensionPreferences: Record<string, number>;
    facetPreferences: Record<string, number>;
  } | null;
}
