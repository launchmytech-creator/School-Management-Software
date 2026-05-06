import { useQuery } from '@tanstack/react-query';
import { timetableService, type TimetableEntry } from '../../services/timetableService';
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

export interface TimetableFilters {
  classId?: number;
  academicYearId?: number;
  dayOfWeek?: number;
  teacherId?: number;
}

export const useTimetables = (filters?: TimetableFilters, enabled = true) => {
  const { user } = useAuth();

  return useQuery<TimetableEntry[]>({
    queryKey: [...queryKeys.timetables.all(user?.schoolId ?? null), filters] as const,
    queryFn: async () => {
      try {
        return await timetableService.getTimetables(filters);
      } catch (error) {
        handleServiceError(error, 'TIMETABLES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled,
    ...retryConfig,
  });
};

export const useTimetableById = (id: number) => {
  return useQuery<TimetableEntry>({
    queryKey: ['timetables', id] as const,
    queryFn: async () => {
      try {
        return await timetableService.getTimetableById(id);
      } catch (error) {
        handleServiceError(error, 'TIMETABLES', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
    ...retryConfig,
  });
};
