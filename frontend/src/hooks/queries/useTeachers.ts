import { useQuery } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import type { Teacher, TeacherAllocation } from '../../types/teacher';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface TeacherFilters {
  search?: string;
  status?: string;
}

export const useTeachers = (enabled = true) => {
  const { user } = useAuth();
  
  return useQuery<Teacher[]>({
    queryKey: queryKeys.teachers.all(user?.schoolId ?? null),
    queryFn: () => teacherService.getTeachers(),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
  });
};

export const useTeacherById = (id: number) => {
  const { user } = useAuth();
  
  return useQuery<Teacher>({
    queryKey: queryKeys.teachers.byId(user?.schoolId ?? null, String(id)),
    queryFn: () => teacherService.getTeacherById(id),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};

export const useTeacherAllocations = (teacherId: number, academicYearId?: number) => {
  const { user } = useAuth();
  
  return useQuery<TeacherAllocation[]>({
    queryKey: queryKeys.teachers.allocations(user?.schoolId ?? null, teacherId, academicYearId || 0),
    queryFn: () => teacherService.getAllocationsByTeacher(teacherId, academicYearId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!teacherId,
  });
};

export const useAllAllocations = () => {
  const { user } = useAuth();
  
  return useQuery<TeacherAllocation[]>({
    queryKey: ['teacher-allocations', 'all', { schoolId: user?.schoolId ?? null }],
    queryFn: () => teacherService.getAllocations(),
    staleTime: QUERY_STALE_TIME.LISTS,
  });
};
