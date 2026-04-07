import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import type { AuthUser, LoginCredentials } from '../types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
  hasFeature: (feature: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(authService.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const profile = await authService.getProfile();
          setUser(profile);
        }
      } catch {
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setLoading(false);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!user?.subscriptionFeatures) return false;
    return user.subscriptionFeatures[feature] === true;
  }, [user?.subscriptionFeatures]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasFeature,
  }), [user, loading, hasFeature]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
