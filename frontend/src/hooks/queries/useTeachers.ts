import { useQuery } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import type { Teacher, TeacherAllocation } from '../../types/teacher';
import { queryKeys } from '../../lib/queryKeys';

export const useTeachers = () => {
  return useQuery<Teacher[]>({
    queryKey: queryKeys.teachers.all,
    queryFn: () => teacherService.getTeachers(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeacherById = (id: number) => {
  return useQuery<Teacher>({
    queryKey: queryKeys.teachers.byId(String(id)),
    queryFn: () => teacherService.getTeacherById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

export const useTeacherAllocations = (teacherId: number, academicYearId?: number) => {
  return useQuery<TeacherAllocation[]>({
    queryKey: queryKeys.teachers.allocations(teacherId, academicYearId || 0),
    queryFn: () => teacherService.getAllocationsByTeacher(teacherId, academicYearId),
    staleTime: 5 * 60 * 1000,
    enabled: !!teacherId,
  });
};

export const useAllAllocations = () => {
  return useQuery<TeacherAllocation[]>({
    queryKey: ['teacher-allocations', 'all'],
    queryFn: () => teacherService.getAllocations(),
    staleTime: 5 * 60 * 1000,
  });
};
