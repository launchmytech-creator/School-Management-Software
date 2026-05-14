import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/parentService';
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

export const useParentChildren = (parentId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['parent', { schoolId: user?.schoolId ?? null, parentId }, 'children'] as const,
    queryFn: async () => {
      try {
        return await parentService.getParentChildren(parentId);
      } catch (error) {
        handleServiceError(error, 'PARENT_CHILDREN', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!parentId,
    ...retryConfig,
  });
};
