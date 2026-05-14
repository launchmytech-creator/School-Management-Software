import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { Student, StudentFilters } from '../../types/student';
import type { PaginatedResponse } from '../../types/common';
import { queryKeys } from '../../lib/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { handleServiceError } from '../../lib/queryErrorHandler';
import { logger } from '../../lib/logger';

const DEFAULT_STALE_TIME = 30 * 60 * 1000;

export interface UseStudentsReturn {
  data: Student[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  page: number;
  setPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refetch: () => void;
}

export const useStudents = (
  baseFilters: Omit<StudentFilters, 'page' | 'limit' | 'search'> = {},
  enabled = true,
): UseStudentsReturn => {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filters: StudentFilters = {
    ...baseFilters,
    page,
    limit: 20,
    search: searchTerm || undefined,
  };

  const query = useQuery<PaginatedResponse<Student>>({
    queryKey: queryKeys.students.filtered(user?.schoolId ?? null, filters),
    queryFn: async () => {
      try {
        return await studentService.getStudents(filters);
      } catch (error) {
        const message = handleServiceError(error, 'STUDENTS', 'FETCH');
        logger.debug(`useStudents error: ${message}`);
        throw error;
      }
    },
    staleTime: DEFAULT_STALE_TIME,
    enabled: enabled && !!baseFilters.classId,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
        return false;
      }
      return true;
    },
  });

  const handleSetPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    pagination: query.data?.pagination ?? null,
    page,
    setPage: handleSetPage,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    refetch: query.refetch,
  };
};

export const useAllStudents = (enabled = true) => {
  const { user } = useAuth();

  return useQuery<Student[]>({
    queryKey: queryKeys.students.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        const response = await studentService.getStudents({});
        return response.data;
      } catch (error) {
        const message = handleServiceError(error, 'STUDENTS', 'FETCH');
        logger.debug(`useAllStudents error: ${message}`);
        throw error;
      }
    },
    staleTime: DEFAULT_STALE_TIME,
    enabled,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
        return false;
      }
      return true;
    },
  });
};

export const useStudentById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Student>({
    queryKey: queryKeys.students.byId(user?.schoolId ?? null, id),
    queryFn: async () => {
      try {
        return await studentService.getStudentById(id);
      } catch (error) {
        const message = handleServiceError(error, 'STUDENTS', 'FETCH');
        logger.debug(`useStudentById error: ${message}`);
        throw error;
      }
    },
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!id,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('404')) {
        return false;
      }
      return true;
    },
  });
};

export const useInvalidateStudents = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };
};
