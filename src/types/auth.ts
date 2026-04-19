// Auth Types for TalentStack

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  level: number;
  permissions?: string[];
}

export interface UserAction {
  id: string;
  name: string;
  code: string;
}

export interface UserPage {
  id: string;
  name: string;
  path: string;
  actions: UserAction[];
}

export interface UserFeature {
  id: string;
  name: string;
  pages: UserPage[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  photo_path?: string | null;
  image?: string | null; // URL Cloudinary
  phone?: string | null;
  position?: string | null;
  bio?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  country?: string | null;
  city?: string | null;
  postal_code?: string | null;
  tax_id?: string | null;
  role: Role;
  company: any;
  features: UserFeature[];
}

// Legacy Feature type for backward compatibility
export interface Feature {
  id: string;
  name: string;
  code: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface VerifyUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  photo_path?: string | null;
  role: Role;
  company: any;
  features: UserFeature[];
  access_token: string;
}

export interface AuthState {
  isAuth: boolean | null;
  user: User | null;
  token: string | null;
  refresh_token: string | null;
  permissionsReady: boolean;
}

export interface ApiError {
  status: number;
  data: {
    message: string;
    errors?: Record<string, string[]>;
  };
}
