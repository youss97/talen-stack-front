// Email Types for TalentStack

export enum BulkEmailType {
  MANUAL = 'manual',
  USERS = 'users',
  CLIENTS = 'clients',
  CANDIDATES = 'candidates',
  MANAGERS = 'managers',
}

export interface EmailSender {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Email {
  id: string;
  subject: string;
  recipients: string[];
  cc: string[];
  bcc: string[];
  body: string;
  status: "draft" | "sent" | "failed" | "scheduled";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  sender: EmailSender;
}

export interface SendEmailRequest {
  subject: string;
  body: string;
  type: BulkEmailType;
  recipients: string[];
}

export interface EmailPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sender_email?: string;
}

