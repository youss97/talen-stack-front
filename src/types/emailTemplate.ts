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
  | "INTERVIEW_CANCELLATION_INVITEE";

export interface EmailTemplate {
  type: EmailTemplateType;
  subject: string;
  body_html: string;
  is_custom: boolean;
  variables: string[];
}

export interface EmailTemplateVariableInfo {
  type: EmailTemplateType;
  label: string;
  description: string;
  variables: string[];
}

export interface UpdateEmailTemplateRequest {
  subject: string;
  body_html: string;
}

export interface PreviewEmailTemplateResponse {
  subject: string;
  html: string;
}
