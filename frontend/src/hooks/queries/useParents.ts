import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';
import type { Parent } from '../../types/parent';
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

export const useParents = (enabled = true) => {
  const { user } = useAuth();

  return useQuery<Parent[]>({
    queryKey: queryKeys.parents.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await parentService.getParents();
      } catch (error) {
        handleServiceError(error, 'PARENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
    ...retryConfig,
  });
};

export const useParentById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Parent>({
    queryKey: queryKeys.parents.byId(user?.schoolId ?? null, id),
    queryFn: async () => {
      try {
        return await parentService.getParentById(id);
      } catch (error) {
        handleServiceError(error, 'PARENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
    ...retryConfig,
  });
};
