// Manager Types for TalentStack

export interface ManagerRole {
  id: string;
  name: string;
  code: string;
  level: number;
}

export interface ManagerCompany {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
}

export interface ManagerDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  position?: string | null;
  status: "active" | "inactive";
  last_login?: string | null;
  created_at: string;
  role: ManagerRole;
  company: ManagerCompany;
}

export interface Manager {
  id: string;
  assigned_at: string;
  manager: ManagerDetails;
}

export interface ClientInfo {
  id: string;
  name: string;
  industry?: string | null;
  status: string;
}

export interface CreateManagerRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  position?: string;
  photo?: File | null;
}

export interface ManagerPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedManagerResponse {
  client: ClientInfo;
  managers: Manager[];
  total_managers: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
