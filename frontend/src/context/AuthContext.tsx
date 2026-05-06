import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type { AuthUser, LoginCredentials } from '../types/auth';
import { clearQueryCache, queryClient } from '../lib/queryClient';
import { queryKeys } from '../lib/queryKeys';

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
  hasFeature: (feature: string) => boolean;
  refetchUser: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  userLoading: boolean;
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
  const [userLoading, setUserLoading] = useState(false);

  // Use React Query for profile fetching - provides caching and deduplication
  const { data: profileData } = useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: authService.getProfile,
    staleTime: 15 * 60 * 1000, // 15 minutes - profile doesn't change often
    enabled: authService.isAuthenticated(),
    retry: false, // Don't retry on auth failures
  });

  // Sync profile data to state when available
  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
    // Set loading to false once we have the profile or if auth check is complete
    if (profileData || !authService.isAuthenticated()) {
      setLoading(false);
    }
  }, [profileData]);

  // Handle 401 errors by logging out
  useEffect(() => {
    const handleAuthError = () => {
      authService.logout();
      setUser(null);
      setLoading(false);
    };
    
    window.addEventListener('auth:error', handleAuthError);
    return () => window.removeEventListener('auth:error', handleAuthError);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    clearQueryCache();
    const response = await authService.login(credentials);
    setUser(response.user);
    queryClient.setQueryData(queryKeys.user.current(), response.user);
    setLoading(false);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    clearQueryCache();
    authService.logout();
    setUser(null);
    queryClient.removeQueries({ queryKey: queryKeys.user.current() });
  }, []);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!user?.subscriptionFeatures) return false;
    return user.subscriptionFeatures[feature] === true;
  }, [user?.subscriptionFeatures]);

  const refetchUser = useCallback(async () => {
    setUserLoading(true);
    try {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.current() });
      const profile = await queryClient.fetchQuery({ 
        queryKey: queryKeys.user.current(),
        queryFn: authService.getProfile 
      });
      setUser(profile);
    } catch (error) {
      console.error('Failed to refetch user:', error);
    } finally {
      setUserLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData: AuthUser) => {
    setUser(userData);
    queryClient.setQueryData(queryKeys.user.current(), userData);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasFeature,
    refetchUser,
    updateUser,
    userLoading,
  }), [user, loading, hasFeature, refetchUser, updateUser, userLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
