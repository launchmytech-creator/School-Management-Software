import { apiRequest } from './api';
import type { LoginCredentials, LoginResponse, AuthUser, BackendProfileResponse } from '../types/auth';
import type { UpdateProfileData } from '../types/school';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      data: credentials,
    });
    
    if (response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    }
    
    return response;
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await apiRequest<BackendProfileResponse>('/auth/profile');
    const mappedUser: AuthUser = {
      id: response.id,
      email: response.email,
      fullName: response.full_name,
      role: response.role,
      schoolId: response.school_id,
      schoolName: response.school_name,
      subscriptionPlanId: response.subscription_plan_id || null,
      subscriptionPlan: response.subscription_plan_name || null,
      subscriptionFeatures: response.subscription_features || null,
      subscriptionStatus: response.subscription_status || null,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    return mappedUser;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // window.location.href = '/login';
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  getUser: () => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  // [NEW] Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<AuthUser> => {
    const response = await apiRequest<BackendProfileResponse>('/auth/profile', {
      method: 'PATCH',
      data,
    });
    
    const mappedUser: AuthUser = {
      id: response.id,
      email: response.email,
      fullName: response.full_name,
      role: response.role,
      schoolId: response.school_id,
      schoolName: response.school_name,
      subscriptionPlanId: response.subscription_plan_id || null,
      subscriptionPlan: response.subscription_plan_name || null,
      subscriptionFeatures: response.subscription_features || null,
      subscriptionStatus: response.subscription_status || null,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    return mappedUser;
  },
};
