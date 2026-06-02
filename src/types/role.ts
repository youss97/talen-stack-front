// Role Types for TalentStack

export interface Action {
  id: string;
  name: string;
  code: string;
  description?: string;
  selected?: boolean;
}

export interface Page {
  id: string;
  name: string;
  path?: string;
  description?: string;
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

// Portée des données par ressource (true = toute l'entreprise, false/absent = ses propres éléments)
export interface RoleScopes {
  scope_applications_company?: boolean;
  scope_requests_company?: boolean;
  scope_cvs_company?: boolean;
  scope_clients_company?: boolean;
  scope_emails_company?: boolean;
  scope_integrations_company?: boolean;
}

export interface Role extends RoleScopes {
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

export interface RoleWithFeatures extends RoleScopes {
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

export interface CreateRoleRequest extends RoleScopes {
  name: string;
  description: string;
  code?: string;
}

export interface UpdateRoleRequest extends RoleScopes {
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
