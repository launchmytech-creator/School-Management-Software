import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { StudentHistory } from '../../types/student';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export const useStudentHistory = (studentId: number) => {
  const { user } = useAuth();

  return useQuery<StudentHistory>({
    queryKey: queryKeys.studentHistory.byStudent(user?.schoolId ?? null, studentId),
    queryFn: () => studentService.getStudentHistory(studentId),
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId,
  });
};
