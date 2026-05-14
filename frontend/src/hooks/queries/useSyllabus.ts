import { useQuery } from '@tanstack/react-query';
import { syllabusService, type SubjectProgress, type ChapterWithStatus, type AllClassesProgress } from '../../services/syllabusService';
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

export const useClassProgress = (classId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<SubjectProgress[]>({
    queryKey: ['syllabus', 'progress', 'class', String(classId), { schoolId: user?.schoolId ?? null }],
    queryFn: async () => {
      try {
        return await syllabusService.getClassProgress(Number(classId));
      } catch (error) {
        handleServiceError(error, 'SYLLABUS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId,
    ...retryConfig,
  });
};

export const useSubjectChapters = (classId: number | string, subjectId: number | string, academicYearId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<ChapterWithStatus[]>({
    queryKey: ['syllabus', 'chapters', String(classId), String(subjectId), { schoolId: user?.schoolId ?? null, academicYearId: String(academicYearId) }],
    queryFn: async () => {
      try {
        return await syllabusService.getChaptersWithStatusDirect(Number(classId), Number(subjectId), Number(academicYearId));
      } catch (error) {
        handleServiceError(error, 'SYLLABUS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!subjectId && !!academicYearId,
    ...retryConfig,
  });
};

export const useAllClassesProgress = () => {
  const { user } = useAuth();
  
  return useQuery<AllClassesProgress>({
    queryKey: queryKeys.syllabus.allProgress(user?.schoolId ?? null),
    queryFn: async () => {
      try {
        return await syllabusService.getAllClassesProgress();
      } catch (error) {
        handleServiceError(error, 'SYLLABUS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    ...retryConfig,
  });
};
