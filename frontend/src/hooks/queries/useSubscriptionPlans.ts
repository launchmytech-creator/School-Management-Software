import { useQuery } from '@tanstack/react-query';
import { schoolService } from '../../services/schoolService';
import type { SubscriptionPlan } from '../../types/school';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { handleServiceError } from '../../lib/queryErrorHandler';

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

export const useAvailablePlans = (schoolId: string) => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: queryKeys.subscriptionPlans.all(Number(schoolId)),
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      try {
        const data = await schoolService.getAvailablePlansWithPricing();
        return data as unknown as SubscriptionPlan[];
      } catch (error) {
        handleServiceError(error, 'SUBSCRIPTION_PLANS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!schoolId,
    ...retryConfig,
  });
};
