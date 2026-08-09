export type EmailTemplateType =
  | "NOTIFY"
  | "TRACKING"
  | "APPLICATION_MANUAL"
  | "INTERVIEW_INVITATION_CANDIDATE"
  | "INTERVIEW_INVITATION_INVITEE"
  | "INTERVIEW_RESCHEDULE_CANDIDATE"
  | "INTERVIEW_RESCHEDULE_INVITEE"
  | "INTERVIEW_MODIFICATION_CANDIDATE"
  | "INTERVIEW_MODIFICATION_INVITEE"
  | "INTERVIEW_CANCELLATION_CANDIDATE"
  | "INTERVIEW_CANCELLATION_INVITEE"
  | "PUBLIC_APPLICATION_DELETED";

export interface EmailTemplate {
  [key: string]: unknown;
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  is_default: boolean;
}

export interface EmailTemplateVariableInfo {
  type: EmailTemplateType;
  label: string;
  description: string;
  variables: string[];
}

export interface CreateEmailTemplateRequest {
  type: EmailTemplateType;
  name: string;
  subject: string;
  body_html: string;
}

export interface UpdateEmailTemplateRequest {
  name?: string;
  subject?: string;
  body_html?: string;
}

export interface DefaultEmailTemplateContent {
  subject: string;
  body_html: string;
}

export interface PreviewEmailTemplateResponse {
  subject: string;
  html: string;
}
