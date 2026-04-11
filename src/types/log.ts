// Log Types for TalentStack

export interface LogUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Log {
  [key: string]: unknown;
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user: LogUser | null;
}

export interface LogPaginationParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  tableName?: string;
}
