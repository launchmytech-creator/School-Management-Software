import { useQuery } from '@tanstack/react-query';
import { examResultService, type StudentResult, type ClassComparisonData, type ClassSubjectComparisonData, type ExamResult, type ClassPerformance } from '../../services/examResultService';
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

export const useExamResults = (filters: ExamResultsFilters = {}) => {
  const { user } = useAuth();

  return useQuery<ExamResult[]>({
    queryKey: ['exam-results', 'filters', { schoolId: user?.schoolId ?? null, ...filters }] as const,
    queryFn: () => examResultService.getResults(filters),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
  });
};

export const useExamResultsPerformance = (examId: number, academicYearId?: number) => {
  return useQuery<ClassPerformance[]>({
    queryKey: ['exam-results', 'performance', examId, academicYearId] as const,
    queryFn: () => examResultService.getClassPerformance(examId, academicYearId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!examId,
  });
};
