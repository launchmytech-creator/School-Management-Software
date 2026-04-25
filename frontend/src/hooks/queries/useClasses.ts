import { useQuery } from '@tanstack/react-query';
import { classService } from '../../services/classService';
import type { Class } from '../../types/class';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useClasses = (academicYearId?: string | number) => {
  const { user } = useAuth();
  
  return useQuery<Class[]>({
    queryKey: queryKeys.classes.byYear(user?.schoolId ?? null, academicYearId ? String(academicYearId) : undefined),
    queryFn: () => classService.getClasses(academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useClassById = (id: string | number) => {
  const { user } = useAuth();

  return useQuery<Class>({
    queryKey: ['classes', { schoolId: user?.schoolId ?? null, id: String(id) }],
    queryFn: () => classService.getClassById(id),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!id,
  });
};

export const useClassesByIncharge = (teacherId: number, academicYearId?: string | number) => {
  return useQuery<Class[]>({
    queryKey: ['classes', 'incharge', teacherId, academicYearId],
    queryFn: () => classService.getClassesByIncharge(teacherId, academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!teacherId,
  });
};
