import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { Student, StudentFilters } from '../../types/student';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useStudents = (filters: StudentFilters = {}, enabled = true) => {
  return useQuery<Student[]>({
    queryKey: queryKeys.students.filtered(filters),
    queryFn: () => studentService.getStudents(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: enabled && !!filters.classId,
  });
};

export const useAllStudents = (filters: StudentFilters = {}, enabled = true) => {
  return useQuery<Student[]>({
    queryKey: queryKeys.students.filtered(filters),
    queryFn: () => studentService.getStudents(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled,
  });
};

export const useStudentById = (id: number) => {
  return useQuery<Student>({
    queryKey: queryKeys.students.byId(id),
    queryFn: () => studentService.getStudentById(id),
    staleTime: 1 * 60 * 1000,
    enabled: !!id,
  });
};
