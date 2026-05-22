import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examService, type Exam, type CreateExamDto, type AddExamSubjectDto } from '../../services/examService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';
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

export interface ExamFilters {
  classId?: number;
  academicYearId?: number;
}

export const useExams = (filters: ExamFilters = {}) => {
  const { user } = useAuth();

  return useQuery<Exam[]>({
    queryKey: queryKeys.exams.byFilters(user?.schoolId ?? null, filters),
    queryFn: async () => {
      try {
        return await examService.getExams(filters.classId, filters.academicYearId);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'FETCH');
        throw error;
      }
    },
    enabled: !!filters.classId,
    staleTime: QUERY_STALE_TIME.LISTS,
    ...retryConfig,
  });
};

export const useExamById = (id: number) => {
  const { user } = useAuth();

  return useQuery<Exam>({
    queryKey: ['exams', 'detail', { schoolId: user?.schoolId ?? null, id }] as const,
    queryFn: async () => {
      try {
        return await examService.getExamById(id);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExamDto) => {
      try {
        return await examService.createExam(data);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'CREATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateExamDto> }) => {
      try {
        return await examService.updateExam(id, data);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'UPDATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await examService.deleteExam(id);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'DELETE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useAddExamSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId, data }: { examId: number; data: AddExamSubjectDto }) => {
      try {
        return await examService.addExamSubject(examId, data);
      } catch (error) {
        handleServiceError(error, 'EXAMS', 'CREATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};
