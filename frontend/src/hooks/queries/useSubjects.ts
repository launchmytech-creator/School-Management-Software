import { useQuery } from '@tanstack/react-query';
import { subjectService, type Subject, type ClassSubject } from '../../services/subjectService';
import { queryKeys } from '../../lib/queryKeys';

export const useSubjects = () => {
  return useQuery<Subject[]>({
    queryKey: queryKeys.subjects.all,
    queryFn: () => subjectService.getSubjects(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubjectsByClass = (classId: number | string) => {
  return useQuery<ClassSubject[]>({
    queryKey: queryKeys.classSubjects.byClass(String(classId)),
    queryFn: () => subjectService.getSubjectsByClass(Number(classId)),
    staleTime: 5 * 60 * 1000,
    enabled: !!classId,
  });
};
