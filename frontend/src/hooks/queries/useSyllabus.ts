import { useQuery } from '@tanstack/react-query';
import { syllabusService, type SubjectProgress, type ChapterWithStatus, type AllClassesProgress } from '../../services/syllabusService';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { queryKeys } from '../../lib/queryKeys';

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

export const useAllClassesProgress = () => {
  const { user } = useAuth();
  
  return useQuery<AllClassesProgress>({
    queryKey: queryKeys.syllabus.allProgress(user?.schoolId ?? null),
    queryFn: () => syllabusService.getAllClassesProgress(),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};
