import { useQuery } from '@tanstack/react-query';
import { subjectService, type Subject, type ClassSubject } from '../../services/subjectService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';

export const useSubjects = () => {
  return useQuery<Subject[]>({
    queryKey: queryKeys.subjects.all,
    queryFn: () => subjectService.getSubjects(),
    staleTime: QUERY_STALE_TIME.REFERENCE,
  });
};

export const useSubjectsByClass = (classId: number | string) => {
  return useQuery<ClassSubject[]>({
    queryKey: queryKeys.classSubjects.byClass(String(classId)),
    queryFn: () => subjectService.getSubjectsByClass(Number(classId)),
    staleTime: QUERY_STALE_TIME.REFERENCE,
    enabled: !!classId,
  });
};
