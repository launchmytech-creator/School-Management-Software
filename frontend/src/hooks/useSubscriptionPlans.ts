import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscriptionService';
import type { SubscriptionPlan, CreatePlanRequest } from '../types/school';
import { toast } from 'sonner';
import { handleServiceError } from '../lib/queryErrorHandler';
import { queryKeys } from '../lib/queryKeys';

export const useAllPlans = () => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: queryKeys.subscriptionPlans.all(null),
    queryFn: async () => {
      try {
        return await subscriptionService.getAllPlans();
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION_PLANS', 'FETCH');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAvailablePlans = () => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription-plans', 'available'],
    queryFn: async () => {
      try {
        return await subscriptionService.getAvailablePlans();
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION_PLANS', 'FETCH');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePlanPricing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: Record<string, number> }) =>
      subscriptionService.updatePlanPricing(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionPlans.all(null) });
      toast.success('Plan pricing updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update plan pricing');
    },
  });
};
