import { apiRequest } from './api';
import { logger } from '../lib/logger';
import type { LoginCredentials, LoginResponse, AuthUser, BackendProfileResponse, ForgotPasswordResponse, ResetPasswordResponse } from '../types/auth';
import type { UpdateProfileData } from '../types/school';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const mapBackendToAuthUser = (response: BackendProfileResponse): AuthUser => ({
  id: response.id,
  email: response.email,
  fullName: response.full_name,
  role: response.role,
  schoolId: response.school_id,
  schoolName: response.school_name,
  subscriptionPlanId: response.subscription_plan_id ?? null,
  subscriptionPlan: response.subscription_plan_name ?? null,
  subscriptionFeatures: response.subscription_features ?? null,
  subscriptionStatus: response.subscription_status ?? null,
  subscriptionEndDate: response.subscription_end_date ?? null,
  feeTerms: response.fee_terms ?? null,
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      data: credentials,
    });
    
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      } catch (error) {
        logger.error('Failed to serialize user data', { error });
      }
    }
    
    return response;
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await apiRequest<BackendProfileResponse>('/auth/profile');
    const mappedUser = mapBackendToAuthUser(response);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    } catch (error) {
      logger.error('Failed to serialize user data', { error });
    }
    return mappedUser;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  getUser: (): AuthUser | null => {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  updateProfile: async (data: UpdateProfileData): Promise<AuthUser> => {
    const response = await apiRequest<BackendProfileResponse>('/auth/profile', {
      method: 'PATCH',
      data,
    });
    
    const mappedUser = mapBackendToAuthUser(response);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    } catch (error) {
      logger.error('Failed to serialize user data', { error });
    }
    return mappedUser;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await apiRequest<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });
    return response;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
    const response = await apiRequest<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      data: { token, newPassword },
    });
    return response;
  },
};
