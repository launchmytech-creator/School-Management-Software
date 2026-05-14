import { useQuery } from '@tanstack/react-query';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
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

export const useClasses = (academicYearId?: string | number) => {
  const { user } = useAuth();
  
  return useQuery<Class[]>({
    queryKey: queryKeys.classes.byYear(user?.schoolId ?? null, academicYearId ? String(academicYearId) : undefined),
    queryFn: async () => {
      try {
        return await classService.getClasses(academicYearId);
      } catch (error) {
        handleServiceError(error, 'CLASSES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};

export const useClassById = (id: string | number) => {
  const { user } = useAuth();

  return useQuery<Class>({
    queryKey: ['classes', { schoolId: user?.schoolId ?? null, id: String(id) }],
    queryFn: async () => {
      try {
        return await classService.getClassById(id);
      } catch (error) {
        handleServiceError(error, 'CLASSES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useClassesByIncharge = (teacherId: number, academicYearId?: string | number) => {
  return useQuery<Class[]>({
    queryKey: ['classes', 'incharge', teacherId, academicYearId],
    queryFn: async () => {
      try {
        return await classService.getClassesByIncharge(teacherId, academicYearId);
      } catch (error) {
        handleServiceError(error, 'CLASSES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!teacherId,
    ...retryConfig,
  });
};
