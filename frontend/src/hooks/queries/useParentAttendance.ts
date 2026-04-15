import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { holidayService, type Holiday } from '../../services/holidayService';
import type { AttendanceRecord } from '../../services/attendanceService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useParentAttendance = (studentId: number, startDate: string, endDate: string) => {
  const { user } = useAuth();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['parent', 'attendance', { schoolId: user?.schoolId ?? null, studentId, startDate, endDate }],
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
  const { user } = useAuth();

  return useQuery<Holiday[]>({
    queryKey: ['holidays', { schoolId: user?.schoolId ?? null, year }] as const,
    queryFn: () => holidayService.getHolidays(year),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useSchoolOpenDays = (year: number, month: number) => {
  const { user } = useAuth();

  return useQuery<number>({
    queryKey: ['school', 'open-days', { schoolId: user?.schoolId ?? null, year, month }],
    queryFn: () => attendanceService.getSchoolOpenDays(year, month),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};
