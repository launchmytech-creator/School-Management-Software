import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examService, type Exam, type CreateExamDto, type AddExamSubjectDto } from '../../services/examService';
import { QUERY_STALE_TIME } from '../../lib/constants';

export interface ExamFilters {
  classId?: number;
  academicYearId?: number;
}

export const useExams = (filters: ExamFilters = {}) => {
  return useQuery<Exam[]>({
    queryKey: ['exams', filters],
    queryFn: () => examService.getExams(filters.classId),
    staleTime: QUERY_STALE_TIME.LISTS,
  });
};

export const useExamById = (id: number) => {
  return useQuery<Exam>({
    queryKey: ['exams', id],
    queryFn: () => examService.getExamById(id),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExamDto) => examService.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateExamDto> }) =>
      examService.updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useDeleteExam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => examService.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};

export const useAddExamSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ examId, data }: { examId: number; data: AddExamSubjectDto }) =>
      examService.addExamSubject(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
};
