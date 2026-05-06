import { useQuery } from '@tanstack/react-query';
import { teacherAttendanceService, type TeacherAttendance, type TeacherAttendanceSummary } from '../../services/teacherAttendanceService';
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

export interface TeacherAttendanceFilters {
  teacherId?: number;
  attendanceDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useTeacherAttendance = (filters?: TeacherAttendanceFilters) => {
  const { user } = useAuth();

  return useQuery<TeacherAttendance[]>({
    queryKey: queryKeys.teacherAttendance.byFilters(user?.schoolId ?? null, filters || {}),
    queryFn: async () => {
      try {
        return await teacherAttendanceService.getAttendance(filters);
      } catch (error) {
        handleServiceError(error, 'TEACHER_ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    ...retryConfig,
  });
};

export const useTeacherAttendanceByDate = (date: string) => {
  const { user } = useAuth();

  return useQuery<TeacherAttendance[]>({
    queryKey: queryKeys.teacherAttendance.byDate(user?.schoolId ?? null, date),
    queryFn: async () => {
      try {
        return await teacherAttendanceService.getAttendanceByDate(date);
      } catch (error) {
        handleServiceError(error, 'TEACHER_ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!date,
    ...retryConfig,
  });
};

export const useTeacherAttendanceSummary = (teacherId: number, filters?: { startDate?: string; endDate?: string }) => {
  return useQuery<TeacherAttendanceSummary>({
    queryKey: ['teacher-attendance', 'summary', teacherId, filters?.startDate, filters?.endDate] as const,
    queryFn: async () => {
      try {
        return await teacherAttendanceService.getTeacherSummary(teacherId, filters);
      } catch (error) {
        handleServiceError(error, 'TEACHER_ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!teacherId,
    ...retryConfig,
  });
};
