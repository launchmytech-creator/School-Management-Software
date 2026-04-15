import { useQuery } from '@tanstack/react-query';
import { subjectService, type Subject, type ClassSubject, type Chapter } from '../../services/subjectService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useSubjects = () => {
  const { user } = useAuth();
  
  return useQuery<Subject[]>({
    queryKey: queryKeys.subjects.all(user?.schoolId ?? null),
    queryFn: () => subjectService.getSubjects(),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useSubjectsByClass = (classId: number | string) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: queryKeys.classSubjects.byClass(user?.schoolId ?? null, String(classId)),
    queryFn: () => subjectService.getSubjectsByClass(Number(classId)),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId,
  });
};

export const useAllClassSubjects = (academicYearId: number) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', 'all', { schoolId: user?.schoolId ?? null, academicYearId }] as const,
    queryFn: () => subjectService.getAllClassSubjects(academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!academicYearId,
  });
};

export const useChapters = (subjectId: number) => {
  const { user } = useAuth();
  
  return useQuery<Chapter[]>({
    queryKey: ['chapters', { schoolId: user?.schoolId ?? null, subjectId }],
    queryFn: () => subjectService.getChaptersBySubject(subjectId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!subjectId,
  });
};

export const useCheckExistingAssignments = (classIds: number[], academicYearId: number) => {
  const { user } = useAuth();
  
  return useQuery<ClassSubject[]>({
    queryKey: ['class-subjects', 'check-existing', { schoolId: user?.schoolId ?? null, classIds, academicYearId }],
    queryFn: () => subjectService.checkExistingAssignments(classIds, academicYearId),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: classIds.length > 0 && !!academicYearId,
  });
};
