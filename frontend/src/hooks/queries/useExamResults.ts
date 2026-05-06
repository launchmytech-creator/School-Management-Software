import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examResultService, type StudentResult, type ClassComparisonData, type ClassSubjectComparisonData, type ExamResult, type ClassPerformance, type ExamSubjectResult } from '../../services/examResultService';
import type { PaginatedResponse } from '../../types/common';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface ExamResultsFilters {
  studentId?: number;
  examId?: number;
  classId?: number;
  subjectId?: number;
  academicYearId?: number;
}

export interface StudentResultsFilters {
  academicYearId?: number;
  examType?: string;
}

export interface UseExamResultsReturn {
  data: ExamResult[];
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

export const useStudentResults = (studentId: number, filters?: StudentResultsFilters) => {
  const { user } = useAuth();

  return useQuery<StudentResult[]>({
    queryKey: queryKeys.examResults.byStudent(user?.schoolId ?? null, studentId, filters),
    queryFn: () => examResultService.getStudentResults(studentId, filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId,
  });
};

export const useClassComparison = (
  classIds: number[],
  academicYearId?: number,
  examType?: string,
  enabled = true
) => {
  const { user } = useAuth();

  return useQuery<ClassComparisonData>({
    queryKey: [...queryKeys.examResults.classComparison(user?.schoolId ?? null, classIds, academicYearId), examType] as const,
    queryFn: () => examResultService.getClassComparison(classIds, academicYearId, examType),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: enabled && classIds.length > 0,
  });
};

export const useClassSubjectComparison = (
  classIds: number[],
  academicYearId?: number,
  enabled = true
) => {
  const { user } = useAuth();

  return useQuery<ClassSubjectComparisonData>({
    queryKey: queryKeys.examResults.classSubjectComparison(user?.schoolId ?? null, classIds, academicYearId),
    queryFn: () => examResultService.getClassSubjectComparison(classIds, academicYearId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: enabled && classIds.length > 0,
  });
};

export const useClassesForComparison = (
  className: string,
  academicYearId?: number,
  enabled = true
) => {
  const { user } = useAuth();

  return useQuery<{ id: number; name: string; section: string | null }[]>({
    queryKey: queryKeys.examResults.classesForComparison(user?.schoolId ?? null, className, academicYearId),
    queryFn: () => examResultService.getClassesForComparison(className, academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: enabled && !!className,
  });
};

export const useExamResults = (
  baseFilters: ExamResultsFilters = {},
): UseExamResultsReturn => {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filters = {
    ...baseFilters,
    page,
    limit: 20,
    search: searchTerm || undefined,
  };

  const query = useQuery<PaginatedResponse<ExamResult>>({
    queryKey: ['exam-results', 'filters', { schoolId: user?.schoolId ?? null, ...filters }] as const,
    queryFn: () => examResultService.getResults(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
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

export const useExamResultsPerformance = (examId: number, academicYearId?: number) => {
  return useQuery<ClassPerformance[]>({
    queryKey: ['exam-results', 'performance', examId, academicYearId] as const,
    queryFn: () => examResultService.getClassPerformance(examId, academicYearId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!examId,
  });
};

export const useExamSubjectResults = (examSubjectId: number) => {
  const { user } = useAuth();

  return useQuery<ExamSubjectResult[]>({
    queryKey: ['exam-results', 'subject', { schoolId: user?.schoolId ?? null, examSubjectId }] as const,
    queryFn: () => examResultService.getExamSubjectResults(examSubjectId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!examSubjectId,
  });
};

export const useEnterMarks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { examSubjectId: number; results: { studentId: number; marksObtained?: number; grade?: string; isAbsent: boolean }[] }) => {
      return await examResultService.enterMarks(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
    },
  });
};
