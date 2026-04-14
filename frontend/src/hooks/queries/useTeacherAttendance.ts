import { useQuery } from '@tanstack/react-query';
import { teacherAttendanceService, type TeacherAttendance, type TeacherAttendanceSummary } from '../../services/teacherAttendanceService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

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
    queryFn: () => teacherAttendanceService.getAttendance(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useTeacherAttendanceByDate = (date: string) => {
  const { user } = useAuth();

  return useQuery<TeacherAttendance[]>({
    queryKey: queryKeys.teacherAttendance.byDate(user?.schoolId ?? null, date),
    queryFn: () => teacherAttendanceService.getAttendanceByDate(date),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!date,
  });
};

export const useTeacherAttendanceSummary = (teacherId: number, filters?: { startDate?: string; endDate?: string }) => {
  return useQuery<TeacherAttendanceSummary>({
    queryKey: ['teacher-attendance', 'summary', teacherId, filters?.startDate, filters?.endDate] as const,
    queryFn: () => teacherAttendanceService.getTeacherSummary(teacherId, filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!teacherId,
  });
};
