export type CrmCompanyStage = "prospect" | "client" | "perdu";
export type CrmDealStatus = "open" | "won" | "lost";

export interface CrmUserRef {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface CrmContact {
  id: string;
  crm_company_id: string;
  first_name: string;
  last_name: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  is_primary: boolean;
  created_at?: string;
}

export interface CrmCompany {
  [key: string]: unknown;
  id: string;
  company_id: string;
  name: string;
  industry?: string | null;
  size?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  source?: string | null;
  stage: CrmCompanyStage;
  website?: string | null;
  pole?: string | null;
  lead_status?: string;
  pipeline_stage?: string;
  last_contact_date?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  priority?: string;
  converted_client_id?: string | null;
  internal_note?: string | null;
  created_by?: string | null;
  creator?: CrmUserRef | null;
  responsible_id?: string | null;
  responsible?: CrmUserRef | null;
  responsible_ids?: string[];
  contacts?: CrmContact[];
  deals?: CrmDeal[];
  created_at?: string;
  updated_at?: string;
}

export interface CrmDeal {
  id: string;
  company_id: string;
  crm_company_id: string;
  crmCompany?: CrmCompany;
  contacts?: CrmContact[];
  title: string;
  description?: string | null;
  estimated_value?: number | null;
  currency: string;
  current_stage: string;
  expected_close_date?: string | null;
  status: CrmDealStatus;
  lost_reason?: string | null;
  created_by?: string | null;
  creator?: CrmUserRef | null;
  responsible_id?: string | null;
  responsible?: CrmUserRef | null;
  responsible_ids?: string[];
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
}

export interface CrmPipelineStage {
  name: string;
  order: number;
}

export interface CreateCrmCompanyRequest {
  name: string;
  industry?: string;
  size?: string;
  address?: string;
  city?: string;
  country?: string;
  source?: string;
  stage?: CrmCompanyStage;
  website?: string;
  pole?: string;
  lead_status?: string;
  pipeline_stage?: string;
  last_contact_date?: string;
  next_action?: string;
  next_action_date?: string;
  priority?: string;
  internal_note?: string;
  responsible_id?: string;
}

export type UpdateCrmCompanyRequest = Partial<CreateCrmCompanyRequest>;

export interface CreateCrmContactRequest {
  first_name: string;
  last_name: string;
  position?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  is_primary?: boolean;
}

export type UpdateCrmContactRequest = Partial<CreateCrmContactRequest>;

export interface CreateCrmDealRequest {
  crm_company_id: string;
  title: string;
  description?: string;
  estimated_value?: number;
  currency?: string;
  current_stage?: string;
  expected_close_date?: string;
  responsible_id?: string;
  contact_ids?: string[];
}

export interface UpdateCrmDealRequest extends Partial<CreateCrmDealRequest> {
  status?: CrmDealStatus;
  lost_reason?: string;
}

export interface ConvertToClientRequest {
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
}

export interface CrmCompanyPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  industry?: string;
  responsible_id?: string;
  lead_status?: string;
  pipeline_stage?: string;
  priority?: string;
  pole?: string;
}

export type CrmActivityType = "call" | "email" | "meeting" | "note";
export type CrmTaskStatus = "pending" | "done" | "cancelled";

export interface CrmActivity {
  id: string;
  crm_company_id: string;
  crm_deal_id?: string | null;
  contact_id?: string | null;
  contact?: CrmContact | null;
  type: CrmActivityType;
  summary: string;
  outcome?: string | null;
  occurred_at: string;
  created_by?: string | null;
  creator?: CrmUserRef | null;
  created_at?: string;
}

export interface CrmTask {
  id: string;
  company_id: string;
  crm_company_id?: string | null;
  crm_deal_id?: string | null;
  title: string;
  due_date: string;
  assigned_to: string;
  assignee?: CrmUserRef | null;
  status: CrmTaskStatus;
  reminder_sent: boolean;
  created_by?: string | null;
  creator?: CrmUserRef | null;
  created_at?: string;
}

export interface CreateCrmActivityRequest {
  crm_company_id: string;
  crm_deal_id?: string;
  contact_id?: string;
  type: CrmActivityType;
  summary: string;
  outcome?: string;
  occurred_at?: string;
}

export interface CreateCrmTaskRequest {
  crm_company_id?: string;
  crm_deal_id?: string;
  title: string;
  due_date: string;
  assigned_to?: string;
}

export interface UpdateCrmTaskRequest extends Partial<CreateCrmTaskRequest> {
  status?: CrmTaskStatus;
}

export interface CrmDashboardStageBucket {
  stage: string;
  count: number;
  value: number;
}

export interface CrmDashboardTopResponsible {
  name: string;
  wonCount: number;
  wonValue: number;
}

export interface CrmPoleStatusRow {
  pole: string; // '' = sans pôle
  counts: Record<string, number>;
  total: number;
}

export interface CrmDashboard {
  poleStatusMatrix?: CrmPoleStatusRow[];
  byStage: CrmDashboardStageBucket[];
  totalOpenCount: number;
  totalOpenValue: number;
  avgDealSize: number;
  wonCount: number;
  lostCount: number;
  wonValue: number;
  lostValue: number;
  conversionRate: number;
  avgSalesCycleDays: number;
  totalProspects: number;
  totalClients: number;
  newProspectsThisMonth: number;
  activitiesThisMonthCount: number;
  overdueTasksCount: number;
  pendingTasksCount: number;
  topResponsibles: CrmDashboardTopResponsible[];
}

export interface SendCrmFollowupEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  message: string;
  contact_id?: string;
  crm_deal_id?: string;
}
