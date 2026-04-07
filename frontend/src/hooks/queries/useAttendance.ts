import { useQuery } from '@tanstack/react-query';
import { attendanceService, type AttendanceRecord } from '../../services/attendanceService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

interface AttendanceFilters {
  classId?: number;
  studentId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export const useAttendance = (params: AttendanceFilters = {}) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: queryKeys.attendance.byFilters(params),
    queryFn: () => attendanceService.getAttendance(params),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useClassAttendance = (classId: number, date: string) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'class', classId, date],
    queryFn: () => attendanceService.getClassAttendanceByDate(classId, date),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!classId && !!date,
  });
};
