// User Types for TalentStack

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  position?: string | null;
  photo?: string | null;
  photo_path?: string | null;
  image?: string | null; // URL Cloudinary
  status: "active" | "inactive";
  role_id: string;
  company_id: string;
  role?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
  };
  last_login?: string | null;
  reset_token?: string | null;
  reset_token_expires?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  photo?: string;
  role_id: string;
  company_id: string;
  status: "active" | "inactive";
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  photo?: string;
  role_id?: string;
  company_id?: string;
  status?: "active" | "inactive";
}

export interface UserPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  position?: string;
  current_password?: string;
  new_password?: string;
  photo?: File | string;
}
