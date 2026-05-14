import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type AttendanceRecord, type MarkAttendanceDto } from '../../services/attendanceService';
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

interface AttendanceFilters {
  classId?: number;
  studentId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export const useAttendance = (params: AttendanceFilters = {}) => {
  const { user } = useAuth();
  
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance.byFilters(user?.schoolId ?? null, params),
    queryFn: async () => {
      try {
        return await attendanceService.getAttendance(params);
      } catch (error) {
        handleServiceError(error, 'ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    ...retryConfig,
  });
};

export const useClassAttendance = (classId: number, date: string) => {
  const { user } = useAuth();
  
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'class', { schoolId: user?.schoolId ?? null, classId, date }],
    queryFn: async () => {
      try {
        return await attendanceService.getClassAttendanceByDate(classId, date);
      } catch (error) {
        handleServiceError(error, 'ATTENDANCE', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!classId && !!date,
    ...retryConfig,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: MarkAttendanceDto) => {
      try {
        return await attendanceService.markAttendance(data);
      } catch (error) {
        handleServiceError(error, 'ATTENDANCE', 'SAVE');
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'class', { schoolId: user?.schoolId ?? null, classId: variables.classId, date: variables.attendanceDate }] 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byFilters(user?.schoolId ?? null, {}) });
    },
  });
};
