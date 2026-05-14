import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { holidayService, type Holiday } from '../../services/holidayService';
import type { AttendanceRecord } from '../../services/attendanceService';
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

export const useParentAttendance = (studentId: number, startDate: string, endDate: string) => {
  const { user } = useAuth();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['parent', 'attendance', { schoolId: user?.schoolId ?? null, studentId, startDate, endDate }],
    queryFn: async () => {
      try {
        return await attendanceService.getAttendance({
          studentId,
          startDate,
          endDate,
        });
      } catch (error) {
        handleServiceError(error, 'ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId && !!startDate && !!endDate,
    ...retryConfig,
  });
};

export const useParentHolidays = (year: number) => {
  const { user } = useAuth();

  return useQuery<Holiday[]>({
    queryKey: ['holidays', { schoolId: user?.schoolId ?? null, year }] as const,
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

export const useSchoolOpenDays = (year: number, month: number) => {
  const { user } = useAuth();

  return useQuery<number>({
    queryKey: ['school', 'open-days', { schoolId: user?.schoolId ?? null, year, month }],
    queryFn: async () => {
      try {
        return await attendanceService.getSchoolOpenDays(year, month);
      } catch (error) {
        handleServiceError(error, 'ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};
