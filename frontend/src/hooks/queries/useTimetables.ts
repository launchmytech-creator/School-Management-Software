import { useQuery } from '@tanstack/react-query';
import { timetableService, type TimetableEntry } from '../../services/timetableService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface TimetableFilters {
  classId?: number;
  academicYearId?: number;
  dayOfWeek?: number;
  teacherId?: number;
}

export const useTimetables = (filters?: TimetableFilters, enabled = true) => {
  const { user } = useAuth();

  return useQuery<TimetableEntry[]>({
    queryKey: [...queryKeys.timetables.all(user?.schoolId ?? null), filters] as const,
    queryFn: () => timetableService.getTimetables(filters),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled,
  });
};

export const useTimetableById = (id: number) => {
  return useQuery<TimetableEntry>({
    queryKey: ['timetables', id] as const,
    queryFn: () => timetableService.getTimetableById(id),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
  });
};
