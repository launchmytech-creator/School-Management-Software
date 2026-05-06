import { useQuery } from '@tanstack/react-query';
import { subjectService, type Subject, type ClassSubject, type Chapter } from '../../services/subjectService';
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

export const useSubjects = () => {
  const { user } = useAuth();
  
  return useQuery<Subject[]>({
    queryKey: queryKeys.subjects.all(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await subjectService.getSubjects();
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};

export const useSubjectsByClass = (classId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: queryKeys.classSubjects.byClass(user?.schoolId ?? null, String(classId)),
    queryFn: async () => {
      try {
        return await subjectService.getSubjectsByClass(Number(classId));
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId,
    ...retryConfig,
  });
};

export const useAllClassSubjects = (academicYearId: number) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', 'all', { schoolId: user?.schoolId ?? null, academicYearId }] as const,
    queryFn: async () => {
      try {
        return await subjectService.getAllClassSubjects(academicYearId);
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!academicYearId,
    ...retryConfig,
  });
};

export const useChapters = (subjectId: number) => {
  const { user } = useAuth();
  
  return useQuery<Chapter[]>({
    queryKey: ['chapters', { schoolId: user?.schoolId ?? null, subjectId }],
    queryFn: async () => {
      try {
        return await subjectService.getChaptersBySubject(subjectId);
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!subjectId,
    ...retryConfig,
  });
};

export const useCheckExistingAssignments = (classIds: number[], academicYearId: number) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', 'check-existing', { schoolId: user?.schoolId ?? null, classIds, academicYearId }],
    queryFn: async () => {
      try {
        return await subjectService.checkExistingAssignments(classIds, academicYearId);
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: classIds.length > 0 && !!academicYearId,
    ...retryConfig,
  });
};
