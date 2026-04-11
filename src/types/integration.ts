export enum IntegrationStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TrialPeriodStatus {
  IN_PROGRESS = 'in_progress',
  VALIDATED = 'validated',
  NOT_VALIDATED = 'not_validated',
}

export enum ContractType {
  CDI = 'cdi',
  CDD = 'cdd',
  FREELANCE = 'freelance',
  INTERIM = 'interim',
  STAGE = 'stage',
  ALTERNANCE = 'alternance',
}

export interface Integration {
  id: string;
  application_id: string;
  client_id: string;
  hr_manager_id?: string;
  position: string;
  integration_date: string;
  salary?: number;
  daily_rate?: number;
  currency: string;
  contract_type: ContractType;
  trial_period_duration?: number;
  trial_period_end_date?: string;
  trial_period_status: TrialPeriodStatus;
  trial_period_validation_date?: string;
  trial_period_notes?: string;
  status: IntegrationStatus;
  notes?: string;
  departure_date?: string;
  departure_reason?: string;
  final_rating?: number;
  final_evaluation?: string;
  contract_file_path?: string;
  document_paths?: string[];
  
  // Nouveaux champs pour le renouvellement
  is_renewed?: boolean;
  renewal_date?: string;
  renewal_period_months?: number;
  renewal_notes?: string;
  original_end_date?: string;
  new_end_date?: string;
  
  // Nouveaux champs pour l'évaluation
  evaluation_notes?: string;
  performance_rating?: number;
  evaluation_date?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  application?: {
    id: string;
    cv?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      candidate_first_name?: string;
      candidate_last_name?: string;
      candidate_email?: string;
    };
    request?: {
      id: string;
      title: string;
    };
  };
  client?: {
    id: string;
    name: string;
  };
  hr_manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateIntegrationDto {
  application_id: string;
  client_id: string;
  hr_manager_id?: string;
  position: string;
  integration_date: string;
  salary?: number;
  daily_rate?: number;
  currency?: string;
  contract_type: ContractType;
  trial_period_duration?: number;
  trial_period_end_date?: string;
  notes?: string;
}

export interface UpdateIntegrationDto {
  position?: string;
  integration_date?: string;
  salary?: number;
  daily_rate?: number;
  currency?: string;
  contract_type?: ContractType;
  trial_period_duration?: number;
  trial_period_end_date?: string;
  trial_period_status?: TrialPeriodStatus;
  trial_period_notes?: string;
  status?: IntegrationStatus;
  notes?: string;
  hr_manager_id?: string;
}

export interface IntegrationStatistics {
  total: number;
  by_status: {
    in_progress: number;
    completed: number;
    failed: number;
  };
  trial_period: {
    validated: number;
    not_validated: number;
    success_rate: string;
  };
}
