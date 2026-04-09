import { useQuery, useQueryClient } from '@tanstack/react-query';
import { academicYearService } from '../../services/academicYearService';
import type { AcademicYear } from '../../types/academicYear';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useAcademicYears = () => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear[]>({
    queryKey: queryKeys.academicYears.all(user?.schoolId ?? null),
    queryFn: () => academicYearService.getAllYears(),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    retry: 2,
    refetchOnWindowFocus: true,
    enabled: !!user?.schoolId,
  });
};

export const useCurrentAcademicYear = () => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear | null>({
    queryKey: queryKeys.academicYears.current(user?.schoolId ?? null),
    queryFn: () => academicYearService.getCurrentYear(),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    retry: 2,
    refetchOnWindowFocus: true,
    enabled: !!user?.schoolId,
  });
};

export const useAcademicYearById = (id: string | number) => {
  const { user } = useAuth();
  
  return useQuery<AcademicYear>({
    queryKey: ['academic-years', { schoolId: user?.schoolId ?? null, id: String(id) }],
    queryFn: () => academicYearService.getYearById(String(id)),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    retry: 2,
    enabled: !!user?.schoolId && !!id,
  });
};

export const useRefreshAcademicYears = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return () => {
    if (user?.schoolId) {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.academicYears.all(user.schoolId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.academicYears.current(user.schoolId) 
      });
    }
  };
};
