import { useQuery } from '@tanstack/react-query';
import { holidayService, type Holiday, type WorkingDays } from '../../services/holidayService';
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

export const useHolidays = (year?: number) => {
  const { user } = useAuth();

  return useQuery<Holiday[]>({
    queryKey: [...queryKeys.holidays.all(user?.schoolId ?? null), year] as const,
    queryFn: async () => {
      try {
        return await holidayService.getHolidays(year);
      } catch (error) {
        handleServiceError(error, 'HOLIDAYS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};

export const useHolidayById = (id: number) => {
  return useQuery<Holiday>({
    queryKey: ['holidays', id] as const,
    queryFn: async () => {
      try {
        return await holidayService.getHolidayById(id);
      } catch (error) {
        handleServiceError(error, 'HOLIDAYS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useAcademicCalendar = (year?: number) => {
  const { user } = useAuth();

  return useQuery<{
    holidays: Holiday[];
    totalDays: number;
    workingDays: number;
    monthlyBreakdown: { month: string; holidays: number; workingDays: number }[];
  }>({
    queryKey: [...queryKeys.holidays.all(user?.schoolId ?? null), 'calendar', year] as const,
    queryFn: async () => {
      try {
        return await holidayService.getAcademicCalendar(year);
      } catch (error) {
        handleServiceError(error, 'HOLIDAYS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};

export const useWorkingDays = (startDate?: string, endDate?: string) => {
  return useQuery<WorkingDays>({
    queryKey: ['holidays', 'working-days', startDate, endDate] as const,
    queryFn: async () => {
      try {
        return await holidayService.getWorkingDays(startDate, endDate);
      } catch (error) {
        handleServiceError(error, 'HOLIDAYS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};
