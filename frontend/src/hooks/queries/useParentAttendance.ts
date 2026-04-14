import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { holidayService, type Holiday } from '../../services/holidayService';
import type { AttendanceRecord } from '../../services/attendanceService';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useParentAttendance = (studentId: number, startDate: string, endDate: string) => {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['parent', 'attendance', studentId, startDate, endDate],
    queryFn: () => attendanceService.getAttendance({
      studentId,
      startDate,
      endDate,
    }),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId && !!startDate && !!endDate,
  });
};

export const useParentHolidays = (year: number) => {
  return useQuery<Holiday[]>({
    queryKey: ['holidays', year],
    queryFn: () => holidayService.getHolidays(year),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useSchoolOpenDays = (year: number, month: number) => {
  return useQuery<number>({
    queryKey: ['school', 'open-days', year, month],
    queryFn: () => attendanceService.getSchoolOpenDays(year, month),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};
