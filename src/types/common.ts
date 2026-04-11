// Common Types for TalentStack

// Pagination response with nested pagination object
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Pagination response with nested meta object
export interface PaginatedResponseWithMeta<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Pagination response with direct properties (no nesting)
export interface PaginatedResponseDirect<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Generic pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Toast notification types
export interface ToastItem {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

// Confirm modal state
export interface ConfirmModalState<T> {
  isOpen: boolean;
  item: T | null;
}
