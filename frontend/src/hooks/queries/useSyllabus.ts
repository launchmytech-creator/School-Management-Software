import { useQuery } from '@tanstack/react-query';
import { syllabusService, type SubjectProgress, type ChapterWithStatus } from '../../services/syllabusService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useClassProgress = (classId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<SubjectProgress[]>({
    queryKey: ['syllabus', 'progress', 'class', String(classId), { schoolId: user?.schoolId ?? null }],
    queryFn: () => syllabusService.getClassProgress(Number(classId)),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId,
  });
};

export const useSubjectChapters = (classId: number | string, subjectId: number | string, academicYearId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<ChapterWithStatus[]>({
    queryKey: ['syllabus', 'chapters', String(classId), String(subjectId), { schoolId: user?.schoolId ?? null, academicYearId: String(academicYearId) }],
    queryFn: () => syllabusService.getChaptersWithStatusDirect(Number(classId), Number(subjectId), Number(academicYearId)),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId && !!subjectId && !!academicYearId,
  });
};
