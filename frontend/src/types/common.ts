export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | undefined;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface BreadcrumbLink {
  label: string;
  href?: string;
  active?: boolean;
}

export interface PageHeaderAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';
