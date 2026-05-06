import { useQuery } from '@tanstack/react-query';
import { syllabusService, type ChapterWithStatus } from '../../services/syllabusService';
import { teacherService } from '../../services/teacherService';
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

export interface TeacherSubjectProgress {
  allocationId: number;
  classId: number;
  className: string;
  classSection?: string;
  subjectId: number;
  subjectName: string;
  totalChapters: number;
  completedChapters: number;
  inProgressChapters: number;
  pendingChapters: number;
  progressPercentage: number;
}

export const useTeacherAllocationsForSyllabus = (teacherId: number, academicYearId?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.teachers.allocations(user?.schoolId ?? null, teacherId, academicYearId || 0),
    queryFn: async () => {
      try {
        return await teacherService.getAllocationsByTeacher(teacherId, academicYearId!);
      } catch (error) {
        handleServiceError(error, 'SYLLABUS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!teacherId && !!academicYearId,
    ...retryConfig,
  });
};

export const useTeacherSubjectProgress = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<TeacherSubjectProgress[]>({
    queryKey: ['teacher', 'syllabus', 'progress', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
    queryFn: async () => {
      try {
        const chapters = await syllabusService.getChaptersWithStatusDirect(classId, subjectId, academicYearId);
        const completedChapters = chapters.filter(c => c.status === 'completed').length;
        const inProgressChapters = chapters.filter(c => c.status === 'in-progress').length;
        const totalChapters = chapters.length;
        const progressPercentage = totalChapters > 0 
          ? Math.round((completedChapters / totalChapters) * 100) 
          : 0;
        
        return [{
          allocationId: 0,
          classId,
          className: '',
          subjectName: '',
          subjectId,
          totalChapters,
          completedChapters,
          inProgressChapters,
          pendingChapters: totalChapters - completedChapters - inProgressChapters,
          progressPercentage,
        }];
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

export const useSubjectChaptersDirect = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<ChapterWithStatus[]>({
    queryKey: ['syllabus', 'chapters', 'direct', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
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
