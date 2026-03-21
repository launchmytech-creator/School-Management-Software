export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'accountant';

export interface AuthUser {
  id: string | number;
  email: string;
  fullName: string;
  role: UserRole;
  schoolId: number | null;
  schoolName: string | null;
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
}
