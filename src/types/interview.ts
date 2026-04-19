export interface Interview {
  id: string;
  application_id: string;
  organizer_id: string;
  scheduled_date: string;
  duration_minutes: number;
  type: 'presential' | 'online';
  location?: string;
  meeting_link?: string;
  notes?: string;
  title?: string;
  internal_notes?: string;
  invitees_emails: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  email_sent_to_candidate: boolean;
  email_sent_to_invitees: boolean;
  send_email_automatically: boolean;
  original_scheduled_date?: string;
  created_at: string;
  updated_at: string;
  organizer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: {
      id: string;
      name: string;
      code: string;
    };
  };
  application?: {
    id: string;
    cv: {
      candidate_first_name: string;
      candidate_last_name: string;
      candidate_email: string;
      candidate_phone?: string;
    };
    request: {
      title: string;
      reference: string;
    };
  };
}

export interface CreateInterviewRequest {
  scheduled_date: string;
  duration_minutes: number;
  type: 'presential' | 'online';
  location?: string;
  meeting_link?: string;
  notes?: string;
  title?: string;
  internal_notes?: string;
  invitees_emails?: string[];
  send_email_automatically?: boolean;
}

export interface UpdateInterviewRequest {
  scheduled_date?: string;
  duration_minutes?: number;
  type?: 'presential' | 'online';
  location?: string;
  meeting_link?: string;
  notes?: string;
  title?: string;
  internal_notes?: string;
  invitees_emails?: string[];
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}
