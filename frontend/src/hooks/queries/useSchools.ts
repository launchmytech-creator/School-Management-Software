import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolService } from '../../services/schoolService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import type { School, CreateSchoolRequest, SchoolUpdateData, SubscriptionPlan, SchoolAdmin } from '../../types/school';
import { handleServiceError } from '../../lib/queryErrorHandler';
import { toast } from 'sonner';

const retryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    if (failureCount >= 3) return false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
      return false;
    }
    return true;
  },
};

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  status?: string;
}

export interface SchoolStats {
  total: number;
  active: number;
  inactive: number;
  basicPlans: number;
  premiumPlans: number;
  businessPlans: number;
  trial: number;
  activeSubscription: number;
  suspended: number;
  expired: number;
}

export const useSchools = (filters: SchoolFilters = {}, enabled = true) => {
  return useQuery<School[]>({
    queryKey: queryKeys.schools.filtered(filters),
    queryFn: async () => {
      try {
        return await schoolService.getSchools(filters);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
    ...retryConfig,
  });
};

export const useSchoolById = (id: string) => {
  return useQuery<School>({
    queryKey: ['schools', id],
    queryFn: async () => {
      try {
        return await schoolService.getSchoolById(id);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.DEFAULT,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useSchoolStats = () => {
  const { data: schools, ...rest } = useSchools();

  const stats: SchoolStats = {
    total: 0,
    active: 0,
    inactive: 0,
    basicPlans: 0,
    premiumPlans: 0,
    businessPlans: 0,
    trial: 0,
    activeSubscription: 0,
    suspended: 0,
    expired: 0,
  };

  if (schools) {
    stats.total = schools.length;
    schools.forEach(s => {
      if (s.status) stats.active++;
      else stats.inactive++;
      if (s.plan === 'BASIC') stats.basicPlans++;
      if (s.plan === 'PREMIUM') stats.premiumPlans++;
      if (s.plan === 'BUSINESS') stats.businessPlans++;
      const subStatus = s.subscriptionStatus?.toLowerCase();
      if (subStatus === 'trial') stats.trial++;
      if (subStatus === 'active') stats.activeSubscription++;
      if (subStatus === 'suspended') stats.suspended++;
      if (subStatus === 'expired') stats.expired++;
    });
  }

  return {
    data: schools,
    stats,
    ...rest,
  };
};

export const useRecentSchools = (limit = 5) => {
  const { data: schools, ...rest } = useSchools({ limit: 100 });

  const recentSchools = schools?.slice(0, limit) || [];

  return {
    data: recentSchools,
    ...rest,
  };
};

export const useCreateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSchoolRequest) => {
      try {
        return await schoolService.createSchool(data);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'CREATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success('School created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create school');
    },
  });
};

export const useUpdateSchool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SchoolUpdateData }) => {
      try {
        return await schoolService.updateSchool(id, data);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'UPDATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success('School updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school');
    },
  });
};

export const useToggleSchoolStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      try {
        return await schoolService.toggleSchoolStatus(id, status);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'UPDATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      toast.success('School status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school status');
    },
  });
};

export const useSchoolDetail = (id: string) => {
  return useQuery<School>({
    queryKey: queryKeys.schools.byId(id),
    queryFn: async () => {
      try {
        return await schoolService.getSchoolById(id);
      } catch (error) {
        handleServiceError(error, 'SCHOOLS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.DEFAULT,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useAvailablePlansWithPricing = () => {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ['subscription-plans', 'with-pricing'],
    queryFn: async () => {
      try {
        return await schoolService.getAvailablePlansWithPricing();
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION_PLANS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LONG,
    ...retryConfig,
  });
};

export const useSubscriptionHistory = (schoolId: string) => {
  return useQuery<Record<string, unknown>[]>({
    queryKey: ['subscription-history', schoolId],
    queryFn: async () => {
      try {
        return await schoolService.getSubscriptionHistory(schoolId);
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION_HISTORY', 'FETCH');
        throw error;
      }
    },
    enabled: !!schoolId,
    ...retryConfig,
  });
};

export const useCalculateUpgrade = () => {
  return useMutation({
    mutationFn: async ({ schoolId, data }: { schoolId: string; data: { planId: number; feeTerm: string } }) => {
      try {
        return await schoolService.calculateUpgrade(schoolId, data);
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION', 'CALCULATE');
        throw error;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to calculate upgrade pricing');
    },
  });
};

export const usePurchaseSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, data }: { schoolId: string; data: { planId: number; feeTerm: string; feeTermNumeric: number; paymentMode?: string; transactionReference?: string } }) => {
      try {
        return await schoolService.purchaseSubscription(schoolId, data);
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION', 'PURCHASE');
        throw error;
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      const resp = result as Record<string, unknown> | undefined;
      if (resp?.type === 'downgrade') {
        toast.success((resp.message as string) || 'Downgrade scheduled successfully');
      } else {
        toast.success('Subscription purchased successfully');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to purchase subscription');
    },
  });
};

export const useSchoolAdmin = (schoolId: string) => {
  return useQuery<SchoolAdmin>({
    queryKey: ['school-admin', schoolId],
    queryFn: async () => {
      try {
        return await schoolService.getSchoolAdmin(schoolId);
      } catch (error) {
        handleServiceError(error, 'SCHOOL_ADMIN', 'FETCH');
        throw error;
      }
    },
    enabled: !!schoolId,
    ...retryConfig,
  });
};

export const useUpdateSchoolAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ schoolId, data }: { schoolId: string; data: { fullName?: string; email?: string; phone?: string; password?: string } }) => {
      try {
        return await schoolService.updateSchoolAdmin(schoolId, data);
      } catch (error) {
        handleServiceError(error, 'SCHOOL_ADMIN', 'UPDATE');
        throw error;
      }
    },
    onSuccess: (_, { schoolId }) => {
      queryClient.invalidateQueries({ queryKey: ['school-admin', schoolId] });
      toast.success('School admin updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update school admin');
    },
  });
};
