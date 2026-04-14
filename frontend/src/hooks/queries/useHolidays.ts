import { useQuery } from '@tanstack/react-query';
import { holidayService, type Holiday, type WorkingDays } from '../../services/holidayService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useHolidays = (year?: number) => {
  const { user } = useAuth();

  return useQuery<Holiday[]>({
    queryKey: [...queryKeys.holidays.all(user?.schoolId ?? null), year] as const,
    queryFn: () => holidayService.getHolidays(year),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useHolidayById = (id: number) => {
  return useQuery<Holiday>({
    queryKey: ['holidays', id] as const,
    queryFn: () => holidayService.getHolidayById(id),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
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
    queryFn: () => holidayService.getAcademicCalendar(year),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useWorkingDays = (startDate?: string, endDate?: string) => {
  return useQuery<WorkingDays>({
    queryKey: ['holidays', 'working-days', startDate, endDate] as const,
    queryFn: () => holidayService.getWorkingDays(startDate, endDate),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};
