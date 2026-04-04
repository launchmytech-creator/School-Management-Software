import { useQuery } from '@tanstack/react-query';
import { attendanceService, type AttendanceRecord } from '../../services/attendanceService';
import { queryKeys } from '../../lib/queryKeys';

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
    staleTime: 1 * 60 * 1000,
  });
};

export const useClassAttendance = (classId: number, date: string) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', 'class', classId, date],
    queryFn: () => attendanceService.getClassAttendanceByDate(classId, date),
    staleTime: 1 * 60 * 1000,
    enabled: !!classId && !!date,
  });
};
