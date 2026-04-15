import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService, type AttendanceRecord, type MarkAttendanceDto } from '../../services/attendanceService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

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
    queryFn: () => attendanceService.getAttendance(params),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useClassAttendance = (classId: number, date: string) => {
  const { user } = useAuth();
  
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'class', { schoolId: user?.schoolId ?? null, classId, date }],
    queryFn: () => attendanceService.getClassAttendanceByDate(classId, date),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!classId && !!date,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (data: MarkAttendanceDto) => attendanceService.markAttendance(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['attendance', 'class', { schoolId: user?.schoolId ?? null, classId: variables.classId, date: variables.attendanceDate }] 
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byFilters(user?.schoolId ?? null, {}) });
    },
  });
};
