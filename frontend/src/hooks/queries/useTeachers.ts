import { useQuery } from '@tanstack/react-query';
import { teacherService } from '../../services/teacherService';
import type { Teacher, TeacherAllocation } from '../../types/teacher';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { handleServiceError } from '../../lib/queryErrorHandler';

const retryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    if (failureCount >= 3) return false;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
      return false;
    }
    return true;
  },
};

export interface TeacherFilters {
  search?: string;
  status?: string;
}

export const useTeachers = (enabled = true) => {
  const { user } = useAuth();
  
  return useQuery<Teacher[]>({
    queryKey: queryKeys.teachers.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await teacherService.getTeachers();
      } catch (error) {
        handleServiceError(error, 'TEACHERS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
    ...retryConfig,
  });
};

export const useTeacherById = (id: number) => {
  const { user } = useAuth();
  
  return useQuery<Teacher>({
    queryKey: queryKeys.teachers.byId(user?.schoolId ?? null, String(id)),
    queryFn: async () => {
      try {
        return await teacherService.getTeacherById(id);
      } catch (error) {
        handleServiceError(error, 'TEACHERS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useTeacherAllocations = (teacherId: number, academicYearId?: number) => {
  const { user } = useAuth();
  
  return useQuery<TeacherAllocation[]>({
    queryKey: queryKeys.teachers.allocations(user?.schoolId ?? null, teacherId, academicYearId || 0),
    queryFn: async () => {
      try {
        return await teacherService.getAllocationsByTeacher(teacherId, academicYearId);
      } catch (error) {
        handleServiceError(error, 'TEACHERS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!teacherId,
    ...retryConfig,
  });
};

export const useAllAllocations = () => {
  const { user } = useAuth();
  
  return useQuery<TeacherAllocation[]>({
    queryKey: ['teacher-allocations', 'all', { schoolId: user?.schoolId ?? null }],
    queryFn: async () => {
      try {
        return await teacherService.getAllocations();
      } catch (error) {
        handleServiceError(error, 'TEACHERS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    ...retryConfig,
  });
};
