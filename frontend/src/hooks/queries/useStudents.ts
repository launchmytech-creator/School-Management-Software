import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { Student, StudentFilters } from '../../types/student';
import { queryKeys } from '../../lib/queryKeys';

export const useStudents = (filters: StudentFilters = {}, enabled = true) => {
  return useQuery<Student[]>({
    queryKey: queryKeys.students.byClass(filters.classId || 'all'),
    queryFn: () => studentService.getStudents(filters),
    staleTime: 1 * 60 * 1000, // 1 minute — students can change more frequently
    enabled: enabled && !!filters.classId,
  });
};

export const useAllStudents = (filters: StudentFilters = {}) => {
  return useQuery<Student[]>({
    queryKey: ['students', 'filtered', filters],
    queryFn: () => studentService.getStudents(filters),
    staleTime: 1 * 60 * 1000,
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
