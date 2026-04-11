// Role Types for TalentStack

export interface Action {
  id: string;
  name: string;
  code: string;
  selected?: boolean;
}

export interface Page {
  id: string;
  name: string;
  path?: string;
  selected?: boolean;
  actions?: Action[];
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  is_internal?: boolean;
  selected?: boolean;
  pages?: Page[];
}

export interface Role {
  [key: string]: unknown;
  id: string;
  name: string;
  description?: string;
  code?: string;
  level?: number;
  is_protected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleWithFeatures {
  id: string;
  name: string;
  code?: string;
  description?: string;
  level?: number;
  is_protected?: boolean;
  permissions?: string[];
  company_id?: string | null;
  createdAt?: string;
  updatedAt?: string;
  features: Feature[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  code?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  actionIds?: string[];
}

export interface AssignActionsRequest {
  actionIds: string[];
}

export interface RolePaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
