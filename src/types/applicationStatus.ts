export interface ApplicationStatus {
  id: string;
  company_id: string | null;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  is_final: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStatusesResponse {
  data: ApplicationStatus[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
