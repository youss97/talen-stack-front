export interface SkillWithLevel {
  name: string;
  level: number;
}

export type SkillItem = string | SkillWithLevel;

export function getSkillName(skill: SkillItem): string {
  return typeof skill === "string" ? skill : skill.name;
}

export function getSkillLevel(skill: SkillItem): number {
  return typeof skill === "string" ? 0 : skill.level;
}

export interface ApplicationRequest {
  [key: string]: unknown;
  id: string;
  client_id: string;
  manager_id: string;
  title: string;
  reference: string;
  description: string;
  required_skills: SkillItem[];
  
  // Expérience
  min_experience?: number;
  max_experience?: number;
  
  // Type de contrat
  contract_type: string;
  contract_types?: string[];

  // Freelance
  mission_duration_months?: number;
  mission_renewable?: boolean;

  // Budget
  min_salary?: number;
  max_salary?: number;
  daily_rate_min?: number;
  daily_rate_max?: number;

  // Localisation
  location?: string;
  country?: string;
  
  // Type de travail
  work_type: "on_site" | "remote" | "hybrid";
  remote_days_per_week?: number;
  remote_possible?: boolean;
  
  // Langues
  languages: Array<string | { language: string; level?: number }>;

  // Workflow / étapes (1.2)
  workflow_steps?: Array<{ name: string; order: number }>;

  // Champs visibles sur l'offre publique (vide = tout)
  public_visible_fields?: string[];

  // Softskills
  soft_skills?: string[];

  // Avantages
  benefits?: string;
  bonuses?: string;
  variables?: string;

  // Priorité
  priority: "low" | "normal" | "high" | "urgent";

  // Statut
  status: "in_progress" | "standby" | "abandoned" | "filled" | "open" | "archived";

  // Package (pour demandes manager)
  package_current?: number;
  package_desired?: number;
  
  // Offres publiques
  is_public?: boolean;
  public_slug?: string;
  public_views_count?: number;
  published_at?: string;
  public_background_image?: string;
  public_brand_color?: string;
  
  // Dates
  desired_start_date?: string;
  
  // Nombre de profils
  number_of_profiles: number;
  
  // Pièce jointe
  attachment_path?: string;
  attachment_filename?: string;
  
  // Notes
  note_client?: string;
  note_interne?: string;

  // Anciens champs (conservés pour compatibilité)
  urgency?: "low" | "medium" | "high" | "critical";
  deadline?: string;
  experience_level?: string;
  
  client?: {
    id: string;
    company_id?: string;
    linked_company_id?: string;
    name: string;
    industry?: string;
    company_size?: string;
    address?: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    vat_rate?: string;
    payment_terms?: string;
    status?: string;
    created_at?: string;
  };
  manager?: {
    id: string;
    company_id?: string;
    role_id?: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    position?: string;
    status?: string;
    last_login?: string;
    photo_path?: string;
    created_at?: string;
    updated_at?: string;
    role?: {
      id: string;
      name: string;
      code: string;
      description?: string;
      level?: number;
      permissions?: unknown[];
      createdAt?: string;
      updatedAt?: string;
      company_id?: string;
    };
    company?: {
      id: string;
      name: string;
      siret?: string;
      address?: string;
      city?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
      email?: string;
      status?: string;
      parent_company_id?: string;
      logo_path?: string;
      created_at?: string;
      updated_at?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
  responsible_id?: string | null;
  responsible?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

export interface CreateApplicationRequestRequest {
  client_id: string;
  manager_id: string;
  title: string;
  description: string;
  required_skills: SkillItem[];
  
  // Expérience
  min_experience?: number;
  max_experience?: number;
  
  // Type de contrat
  contract_type: string;
  contract_types?: string[];

  // Freelance
  mission_duration_months?: number;
  mission_renewable?: boolean;

  // Budget
  min_salary?: number;
  max_salary?: number;
  daily_rate_min?: number;
  daily_rate_max?: number;

  // Localisation
  location: string;
  country: string;

  // Type de travail
  work_type: "on_site" | "remote" | "hybrid";
  remote_days_per_week?: number;
  remote_possible?: boolean;

  // Langues
  languages: Array<string | { language: string; level?: number }>;

  // Workflow / étapes (1.2)
  workflow_steps?: Array<{ name: string; order: number }>;

  // Champs visibles sur l'offre publique (vide = tout)
  public_visible_fields?: string[];

  // Softskills
  soft_skills?: string[];

  // Avantages
  benefits?: string;
  bonuses?: string;
  variables?: string;

  // Priorité
  priority: "low" | "normal" | "high" | "urgent";
  
  // Statut
  status?: "in_progress" | "standby" | "abandoned" | "filled";
  
  // Dates
  desired_start_date?: string;
  
  // Nombre de profils
  number_of_profiles: number;

  // Devise
  currency?: string;

  // Notes
  note_client?: string;
  note_interne?: string;

  // Pièce jointe
  attachment?: File;
}

export interface UpdateApplicationRequestRequest {
  title?: string;
  description?: string;
  required_skills?: string[];
  min_experience?: number;
  max_experience?: number;
  contract_type?: string;
  contract_types?: string[];
  mission_duration_months?: number;
  mission_renewable?: boolean;
  min_salary?: number;
  max_salary?: number;
  daily_rate_min?: number;
  daily_rate_max?: number;
  location?: string;
  country?: string;
  work_type?: "on_site" | "remote" | "hybrid";
  remote_days_per_week?: number;
  remote_possible?: boolean;
  languages?: Array<string | { language: string; level?: number }>;
  benefits?: string;
  bonuses?: string;
  variables?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  status?: "in_progress" | "standby" | "abandoned" | "filled" | "archived";
  desired_start_date?: string;
  number_of_profiles?: number;
  currency?: string;
  package_current?: number;
  package_desired?: number;
}

export interface ApplicationRequestPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  required_skills?: string;
  experience_level?: string;
  contract_type?: string;
  location?: string;
  responsible_id?: string;
  unassigned?: boolean;
}

export interface PaginatedApplicationRequestResponse {
  data: ApplicationRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
