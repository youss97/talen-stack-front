// Company Types for TalentStack

export interface CompanyUser {
  id: string;
  company_id: string;
  role_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  position?: string | null;
  status: string;
  last_login?: string | null;
  reset_token?: string | null;
  reset_token_expires?: string | null;
  photo_path?: string | null;
  photo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: string;
  name: string;
  siret?: string;
  ice?: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  logo?: string;
  logo_path?: string;
  status: "active" | "inactive";
  parent_company_id?: string | null;
  users?: CompanyUser[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyRequest {
  name: string;
  siret: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  logo?: string;
  status: "active" | "inactive";
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhoto?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  siret?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  logo?: string;
  status?: "active" | "inactive";
}

export interface CompanyPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
