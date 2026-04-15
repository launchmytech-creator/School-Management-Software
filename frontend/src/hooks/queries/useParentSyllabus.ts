import { useQuery } from '@tanstack/react-query';
import { syllabusService, type ChapterWithStatus } from '../../services/syllabusService';
import { subjectService } from '../../services/subjectService';
import { studentService } from '../../services/studentService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';

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
    queryFn: () => studentService.getStudentById(studentId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!studentId,
  });
};

export const useParentSubjects = (classId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.classSubjects.byClass(user?.schoolId ?? null, String(classId)),
    queryFn: async () => {
      const rawSubjects = await subjectService.getSubjectsByClass(classId);
      return rawSubjects;
    },
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!academicYearId,
  });
};

export const useParentSubjectProgress = (classId: number, subjectId: number, academicYearId: number) => {
  const { user } = useAuth();

  return useQuery<ChapterWithStatus[]>({
    queryKey: ['parent', 'syllabus', 'progress', { schoolId: user?.schoolId ?? null, classId, subjectId, academicYearId }],
    queryFn: () => syllabusService.getChaptersWithStatusDirect(classId, subjectId, academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!subjectId && !!academicYearId,
  });
};
