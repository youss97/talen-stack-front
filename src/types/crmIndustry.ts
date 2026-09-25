export interface CrmIndustry {
  [key: string]: unknown;
  id: string;
  company_id: string | null;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CrmIndustriesResponse {
  data: CrmIndustry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
