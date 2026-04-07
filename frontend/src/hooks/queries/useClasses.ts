import { useQuery } from '@tanstack/react-query';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useClasses = (academicYearId?: string | number) => {
  return useQuery<Class[]>({
    queryKey: queryKeys.classes.byYear(academicYearId ? String(academicYearId) : undefined),
    queryFn: () => classService.getClasses(academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useClassById = (id: string | number) => {
  return useQuery<Class>({
    queryKey: ['classes', String(id)],
    queryFn: () => classService.getClassById(id),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
  });
};
