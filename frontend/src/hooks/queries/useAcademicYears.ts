import { useQuery, useQueryClient } from '@tanstack/react-query';
import { academicYearService } from '../../services/academicYearService';
import type { AcademicYear } from '../../types/academicYear';
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

export const useAcademicYears = () => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear[]>({
    queryKey: queryKeys.academicYears.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await academicYearService.getAllYears();
      } catch (error) {
        handleServiceError(error, 'ACADEMIC_YEARS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
    refetchOnWindowFocus: true,
    enabled: !!user?.schoolId,
  });
};

export const useCurrentAcademicYear = () => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear | null>({
    queryKey: queryKeys.academicYears.current(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await academicYearService.getCurrentYear();
      } catch (error) {
        handleServiceError(error, 'ACADEMIC_YEARS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
    refetchOnWindowFocus: true,
    enabled: !!user?.schoolId,
  });
};

export const useAcademicYearById = (id: string | number) => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear>({
    queryKey: ['academic-years', { schoolId: user?.schoolId ?? null, id: String(id) }],
    queryFn: async () => {
      try {
        return await academicYearService.getYearById(String(id));
      } catch (error) {
        handleServiceError(error, 'ACADEMIC_YEARS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
    enabled: !!user?.schoolId && !!id,
  });
};

export const useRefreshAcademicYears = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return () => {
    if (user?.schoolId) {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.academicYears.all(user.schoolId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.academicYears.current(user.schoolId) 
      });
    }
  };
};
