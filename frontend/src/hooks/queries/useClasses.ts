import { useQuery } from '@tanstack/react-query';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { queryKeys } from '../../lib/queryKeys';

export const useClasses = (academicYearId?: string | number) => {
  return useQuery<Class[]>({
    queryKey: queryKeys.classes.byYear(academicYearId ? String(academicYearId) : undefined),
    queryFn: () => classService.getClasses(academicYearId),
    staleTime: 5 * 60 * 1000, // 5 minutes — classes rarely change mid-session
  });
};

export const useClassById = (id: string | number) => {
  return useQuery<Class>({
    queryKey: ['classes', String(id)],
    queryFn: () => classService.getClassById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};
