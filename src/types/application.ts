export interface Application {
  id: string;
  status: 'proposed' | 'pending' | 'interview' | 'qualified' | 'accepted' | 'rejected';
  workflow_status: 'draft' | 'active' | 'archived';
  proposed_at: string;
  recruiter_notes?: string;
  manager_notes?: string;
  client_feedback?: string;
  feedback_date?: string;
  is_anonymized: boolean;
  cv: {
    id: string;
    candidate_first_name: string;
    candidate_last_name: string;
    candidate_email: string;
    candidate_phone?: string;
    skills?: string;
    file_path?: string;
  };
  request: {
    id: string;
    title: string;
    reference: string;
    status: string;
    client: {
      id: string;
      name: string;
      email: string;
    };
  };
  recruiter: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    position?: string;
    role: {
      id: string;
      name: string;
      code: string;
    };
    company: {
      id: string;
      name: string;
    };
  };
  feedbacks: Array<{
    id: string;
    title: string;
    description: string;
    created_at: string;
    created_by: {
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
  }>;
}

export interface CreateApplicationRequest {
  cv_id: string;
  request_id: string;
  recruiter_notes?: string;
}

export interface UpdateApplicationRequest {
  status?: Application['status'];
  workflow_status?: Application['workflow_status'];
  recruiter_notes?: string;
  manager_notes?: string;
  client_feedback?: string;
}