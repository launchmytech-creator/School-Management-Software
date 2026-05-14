import { useQuery } from '@tanstack/react-query';
import { accountantService, type Accountant } from '../../services/accountantService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
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

export const useAccountants = (enabled = true) => {
  const { user } = useAuth();

  return useQuery<Accountant[]>({
    queryKey: queryKeys.accountant.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await accountantService.getAccountants();
      } catch (error) {
        handleServiceError(error, 'ACCOUNTANTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
    ...retryConfig,
  });
};

export const useAccountantById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Accountant>({
    queryKey: queryKeys.accountant.byId(user?.schoolId ?? null, id),
    queryFn: async () => {
      try {
        return await accountantService.getAccountantById(id);
      } catch (error) {
        handleServiceError(error, 'ACCOUNTANTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
    ...retryConfig,
  });
};
