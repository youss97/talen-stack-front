// CV Types for TalentStack

export interface CvExperience {
  company: string;
  title: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description?: string;
}

export interface CvFormation {
  institution: string;
  degree: string;
  field?: string;
  start_date?: string;
  end_date?: string;
}

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  FREELANCE = 'FREELANCE',
}

export interface CV {
  [key: string]: unknown;
  id: string;
  company_id?: string;
  candidate_email?: string;
  candidate_phone?: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  profile_title?: string;
  skills?: string[];
  additional_skills?: string[];
  languages?: string[];
  total_experience?: number;
  last_education?: string;
  last_position?: string;
  industry_experience?: string;
  geographic_mobility?: string[];
  contract_type_preferences?: string[];
  remote_preferred?: boolean;
  experiences?: CvExperience[];
  formations?: CvFormation[];
  cv_document?: unknown;
  file_name?: string;
  file_path?: string;
  cloudinary_url?: string;
  file_size?: number;
  mime_type?: string;
  full_information?: {
    name?: string;
    email?: string;
    notes?: string;
    phone?: string | null;
    skills?: string[];
    summary?: string;
    industry?: string;
    education?: string;
    languages?: string[];
    locations?: string[];
    current_position?: string;
    experience_years?: number;
    experiences?: CvExperience[];
    formations?: CvFormation[];
    contract_type_preferences?: string[];
    user_provided_data?: Record<string, unknown>;
  };
  status?: "new" | "reviewed" | "shortlisted" | "interviewed" | "hired" | "rejected" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface CreateCVRequest {
  file: File;
  candidate_email?: string;
  candidate_phone?: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  additional_skills?: string[];
  languages?: string[];
  total_experience?: number;
  last_education?: string;
  last_position?: string;
  industry_experience?: string;
  geographic_mobility?: string[];
  contract_type_preferences?: string[];
  remote_preferred?: boolean;
  status?: string;
  experiences?: CvExperience[];
  formations?: CvFormation[];
}

export interface UpdateCVRequest {
  candidate_email?: string;
  candidate_phone?: string;
  candidate_first_name?: string;
  candidate_last_name?: string;
  additional_skills?: string[];
  languages?: string[];
  total_experience?: number;
  last_education?: string;
  last_position?: string;
  industry_experience?: string;
  geographic_mobility?: string[];
  contract_type_preferences?: string[];
  remote_preferred?: boolean;
  status?: string;
  experiences?: CvExperience[];
  formations?: CvFormation[];
}

export interface CVPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  skills?: string;
  min_experience?: number;
  max_experience?: number;
  industry?: string;
  email?: string;
  contract_type?: string;
}
