import { useQuery } from '@tanstack/react-query';
import { feeStructureService } from '../../services/feeStructureService';
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

interface FeeStructureFilters {
  classId?: number;
  academicYearId?: number;
}

export const useFeeStructuresGrouped = (params: FeeStructureFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.feeStructures.grouped(user?.schoolId ?? null, params),
    queryFn: async () => {
      try {
        return await feeStructureService.getFeeStructuresGrouped(params);
      } catch (error) {
        handleServiceError(error, 'FEE_STRUCTURES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    ...retryConfig,
  });
};

export const useFeeStructures = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.feeStructures.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await feeStructureService.getFeeStructures();
      } catch (error) {
        handleServiceError(error, 'FEE_STRUCTURES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    ...retryConfig,
  });
};
