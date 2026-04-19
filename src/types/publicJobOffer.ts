export interface PublicJobOffer {
  id: string;
  title: string;
  reference?: string;
  description: string;
  required_skills?: string[];
  min_experience?: number;
  contract_type: string;
  contract_duration?: string;
  min_salary?: number;
  max_salary?: number;
  location: string;
  remote_possible?: boolean;
  urgency?: string;
  status?: string;
  deadline?: string;
  desired_start_date?: string;
  
  // Champs publics
  is_public: boolean;
  public_slug?: string;
  public_views_count?: number;
  public_background_image?: string;
  public_brand_color?: string;
  published_at?: string;
  
  // Champs additionnels retournés par l'API publique
  company_name?: string;
  skills?: string[];
  salary?: string;
  experience_required?: string;
  company?: {
    id?: string;
    name?: string;
    logo?: string;
  };

  // Relations
  client?: {
    id: string;
    name: string;
    industry?: string;
  };
  manager?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  created_at: string;
  updated_at?: string;
}

export interface PublicApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cv_path?: string;
  message?: string;
  source: 'qr' | 'direct' | 'linkedin' | 'other';
  job_offer_id: string;
  created_at: string;
}

export interface PublicJobOfferStats {
  views: number;
  applications: number;
  conversionRate: string;
  sourceStats: Record<string, number>;
}

export interface CreatePublicJobOfferData {
  title: string;
  description: string;
  company_name: string;
  location: string;
  contract_type: string;
  salary?: string;
  experience_required?: string;
  skills?: string[];
  deadline?: string;
  background_image?: string;
  brand_color?: string;
  company_id: string;
}

export interface CreatePublicApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message?: string;
  source?: 'qr' | 'direct' | 'linkedin' | 'other';
}
