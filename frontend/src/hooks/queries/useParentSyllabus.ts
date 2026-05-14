import { useQuery } from '@tanstack/react-query';
import { syllabusService, type ChapterWithStatus } from '../../services/syllabusService';
import { subjectService } from '../../services/subjectService';
import { studentService } from '../../services/studentService';
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

export interface ParentSubjectProgress {
  classSubjectId: number;
  subjectId: number;
  subjectName: string;
  teacherName?: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  chapters: ChapterWithStatus[];
}

export const useStudentClass = (studentId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.students.byId(user?.schoolId ?? null, studentId),
    queryFn: async () => {
      try {
        return await studentService.getStudentById(studentId);
      } catch (error) {
        handleServiceError(error, 'STUDENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!studentId,
    ...retryConfig,
  });
};

export const useParentSubjects = (classId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.classSubjects.byClass(user?.schoolId ?? null, String(classId)),
    queryFn: async () => {
      try {
        const rawSubjects = await subjectService.getSubjectsByClass(classId);
        return rawSubjects;
      } catch (error) {
        handleServiceError(error, 'SUBJECTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!academicYearId,
    ...retryConfig,
  });
};

export const useParentSubjectProgress = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<ChapterWithStatus[]>({
    queryKey: ['parent', 'syllabus', 'progress', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
    queryFn: async () => {
      try {
        return await syllabusService.getChaptersWithStatusDirect(classId, subjectId, academicYearId);
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
