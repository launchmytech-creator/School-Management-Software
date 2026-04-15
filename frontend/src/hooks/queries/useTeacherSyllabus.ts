import { useQuery } from '@tanstack/react-query';
import { syllabusService, type ChapterWithStatus } from '../../services/syllabusService';
import { teacherService } from '../../services/teacherService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';

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
    queryFn: () => teacherService.getAllocationsByTeacher(teacherId, academicYearId!),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!teacherId && !!academicYearId,
  });
};

export const useTeacherSubjectProgress = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<TeacherSubjectProgress[]>({
    queryKey: ['teacher', 'syllabus', 'progress', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
    queryFn: async () => {
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
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!subjectId && !!academicYearId,
  });
};

export const useSubjectChaptersDirect = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<ChapterWithStatus[]>({
    queryKey: ['syllabus', 'chapters', 'direct', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
    queryFn: () => syllabusService.getChaptersWithStatusDirect(classId, subjectId, academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!subjectId && !!academicYearId,
  });
};
