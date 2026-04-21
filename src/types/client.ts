// Client Types for TalentStack

export interface Client {
  [key: string]: unknown;
  id: string;
  name: string;
  ice?: string;
  siret?: string; // deprecated
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  email?: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_person: string | null;
  industry: string | null;
  company_size: string | null;
  logo?: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  linked_company_id?: string;
  vat_rate?: string;
  payment_terms?: string | null;
  // Company fields from linked company
  company_name?: string;
  company_ice?: string;
  company_siret?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  company_country?: string;
  company_phone?: string;
  company_email?: string;
  company_logo_path?: string;
  company_created_at?: string;
  company_updated_at?: string;
  // Managers
  managers?: Array<{
    id: string;
    client_id: string;
    manager_id: string;
    created_at: string;
    manager: {
      id: string;
      company_id: string;
      role_id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      position: string | null;
      status: "active" | "inactive";
      photo_path: string | null;
      created_at: string;
      updated_at: string;
    };
  }>;
}

export interface CreateClientRequest {
  name: string;
  ice?: string;
  siret?: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  contact_phone?: string;
  contact_email?: string;
  contact_person?: string;
  industry?: string;
  company_size?: string;
  logo?: string | File;
  status: "active" | "inactive";
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
  adminPosition?: string;
  adminPhoto?: string | File;
}

export interface UpdateClientRequest {
  name?: string;
  ice?: string;
  siret?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_person?: string;
  industry?: string;
  company_size?: string;
  logo?: string | File;
  status?: "active" | "inactive";
}

export interface ClientPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface Manager {
  [key: string]: unknown;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string | null;
  photo?: string;
  status?: string;
  displayName?: string;
}

export const COUNTRY_LIST = [
  "Maroc",
  "France",
  "Algérie",
  "Tunisie",
  "Libye",
  "Mauritanie",
  "Sénégal",
  "Côte d'Ivoire",
  "Espagne",
  "Italie",
  "Belgique",
  "Suisse",
  "Allemagne",
  "Pays-Bas",
  "Portugal",
  "Royaume-Uni",
  "Canada",
  "États-Unis",
  "Émirats arabes unis",
  "Arabie saoudite",
  "Qatar",
  "Turquie",
  "Égypte",
] as const;
