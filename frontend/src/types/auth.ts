export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'accountant';

export interface AuthUser {
  id: string | number;
  email: string;
  fullName: string;
  role: UserRole;
  schoolId: number | null;
  schoolName: string | null;
  subscriptionPlanId: number | null;
  subscriptionPlan: string | null;
  subscriptionFeatures: Record<string, boolean> | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  feeTerms: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface BackendProfileResponse {
  id: string | number;
  email: string;
  full_name: string;
  role: UserRole;
  school_id: number | null;
  school_name: string | null;
  phone?: string;
  address?: string;
  subscription_plan_id?: number | null;
  subscription_plan_name?: string | null;
  subscription_features?: Record<string, boolean> | null;
  subscription_status?: string | null;
  subscription_end_date?: string | null;
  fee_terms?: number | null;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}
