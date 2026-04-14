import { useQuery } from '@tanstack/react-query';
import { schoolService } from '../../services/schoolService';
import type { SubscriptionPlan } from '../../types/school';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useAvailablePlans = (schoolId: string) => {
  return useQuery<SubscriptionPlan[]>({
    queryKey: queryKeys.subscriptionPlans.all(Number(schoolId)),
    queryFn: () => schoolService.getAvailablePlans(schoolId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!schoolId,
  });
};
