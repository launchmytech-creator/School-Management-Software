import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { Student, StudentFilters } from '../../types/student';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_STALE_TIME = 30 * 60 * 1000; // 30 minutes

export const useStudents = (filters: StudentFilters = {}, enabled = true) => {
  const { user } = useAuth();
  
  return useQuery<Student[]>({
    queryKey: queryKeys.students.filtered(user?.schoolId ?? null, filters),
    queryFn: () => studentService.getStudents(filters),
    staleTime: DEFAULT_STALE_TIME,
    enabled: enabled && !!filters.classId,
  });
};

export const useAllStudents = (enabled = true) => {
  const { user } = useAuth();
  
  return useQuery<Student[]>({
    queryKey: queryKeys.students.all(user?.schoolId ?? null),
    queryFn: () => studentService.getStudents({}),
    staleTime: DEFAULT_STALE_TIME,
    enabled,
  });
};

export const useStudentById = (id: number) => {
  const { user } = useAuth();
  
  return useQuery<Student>({
    queryKey: queryKeys.students.byId(user?.schoolId ?? null, id),
    queryFn: () => studentService.getStudentById(id),
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!id,
  });
};

export const useInvalidateStudents = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };
};
