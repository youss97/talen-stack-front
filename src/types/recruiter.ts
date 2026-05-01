// Recruiter Types for TalentStack (Applications/Candidatures)

export type Currency = string; // Accepte tous les codes de devises de la bibliothèque
export type AvailabilityType = 'immediate' | 'less_than_one_month' | 'one_month' | 'two_months' | 'three_months' | 'other';
export type AvailabilityUnit = 'days' | 'months';
export type WorkflowStatus = 'draft' | 'active' | 'archived';

export interface LanguageSkill {
  language: string;
  level: number; // 1-5
}

export interface Recruiter {
  [key: string]: unknown;
  id: string;
  request_id?: string;
  cv_id?: string;
  recruiter_id?: string;
  status: "proposed" | "pending" | "interview" | "qualified" | "accepted" | "rejected" | "withdrawn";
  proposed_at?: string;
  
  // Workflow
  workflow_status?: WorkflowStatus;
  activated_at?: string;
  
  // Situation actuelle
  currently_employed?: boolean;
  current_contract_type?: string;
  
  // Rémunération
  current_salary?: number;
  daily_rate?: number;
  package_rate?: number;
  currency?: Currency;
  
  // Type de contrat de l'offre
  offer_contract_types?: string[];
  
  // Disponibilité
  availability_type?: AvailabilityType;
  availability_reason?: string;
  availability_days?: number;
  availability_custom_value?: number;
  availability_custom_unit?: AvailabilityUnit;
  availability_negotiable?: boolean;
  
  // Langues
  languages?: LanguageSkill[];
  
  // Qualification
  qualification_report?: string;
  recruiter_notes?: string;
  manager_notes?: string;
  client_feedback?: string;
  feedback_date?: string;
  recruiter_interview_date?: string;
  
  // Anonymisation et ajustements
  is_anonymized?: boolean;
  adjusted_experience?: number;
  
  // Visibilité
  hide_current_salary_for_recruiters?: boolean;
  
  // Feedbacks
  feedbacks?: ApplicationFeedback[];
  
  cv?: {
    id: string;
    candidate_first_name?: string;
    candidate_last_name?: string;
    candidate_email?: string;
    candidate_phone?: string;
    last_position?: string;
    profile_title?: string;
    total_experience?: number;
    skills?: string[];
    file_path?: string;
  };
  request?: {
    id: string;
    title: string;
    reference?: string;
    status?: string;
    contract_type?: string;
    languages?: string[];
    client?: {
      id: string;
      name: string;
      email?: string;
    };
  };
  recruiter?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    role?: {
      id: string;
      name: string;
      code: string;
    };
    company?: {
      id: string;
      name: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateRecruiterRequest {
  request_id: string;
  cv_id: string;
  
  // Workflow (default: draft)
  workflow_status?: WorkflowStatus | null;
  
  // Situation actuelle
  currently_employed?: boolean;
  current_contract_type?: string;
  
  // Rémunération
  current_salary?: number | null;
  daily_rate?: number | null;
  package_rate?: number | null;
  currency?: Currency;
  
  // Type de contrat de l'offre
  offer_contract_types?: (string | undefined)[];
  
  // Disponibilité
  availability_type?: AvailabilityType;
  availability_reason?: string | null;
  availability_days?: number | null;
  availability_custom_value?: number | null;
  availability_custom_unit?: AvailabilityUnit | null;
  availability_negotiable?: boolean;
  
  // Langues
  languages?: LanguageSkill[];
  
  // Qualification
  qualification_report?: string;
  recruiter_notes?: string | null;
  recruiter_interview_date?: string | null;
  
  // Anonymisation et ajustements
  is_anonymized?: boolean;
  adjusted_experience?: number | null;
}

export interface UpdateRecruiterRequest {
  request_id?: string;
  cv_id?: string;
  status?: "proposed" | "pending" | "interview" | "qualified" | "accepted" | "rejected" | "withdrawn";
  
  // Workflow
  workflow_status?: WorkflowStatus | null;
  
  // Situation actuelle
  currently_employed?: boolean;
  current_contract_type?: string;
  
  // Rémunération
  current_salary?: number | null;
  daily_rate?: number | null;
  package_rate?: number | null;
  currency?: Currency;
  
  // Type de contrat de l'offre
  offer_contract_types?: (string | undefined)[];
  
  // Disponibilité
  availability_type?: AvailabilityType;
  availability_reason?: string | null;
  availability_days?: number | null;
  availability_custom_value?: number | null;
  availability_custom_unit?: AvailabilityUnit | null;
  availability_negotiable?: boolean;
  
  // Langues
  languages?: LanguageSkill[];
  
  // Qualification
  qualification_report?: string;
  recruiter_notes?: string | null;
  recruiter_interview_date?: string | null;
  
  // Anonymisation et ajustements
  is_anonymized?: boolean;
  adjusted_experience?: number | null;
}

export interface RecruiterPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  request_id?: string;
  recruiter_id?: string;
  client_id?: string;
  workflow_status?: WorkflowStatus;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  changed_at: string;
  changed_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface ApplicationFeedback {
  id: string;
  application_id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: {
      id: string;
      name: string;
      code: string;
    };
  };
}
