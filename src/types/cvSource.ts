export interface CvSource {
  id: string;
  company_id: string | null;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CvSourcesResponse {
  data: CvSource[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
