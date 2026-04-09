import { useQuery } from '@tanstack/react-query';
import { subjectService, type Subject, type ClassSubject } from '../../services/subjectService';
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
