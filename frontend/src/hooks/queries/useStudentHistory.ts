import { useQuery } from '@tanstack/react-query';
import { studentService } from '../../services/studentService';
import type { StudentHistory } from '../../types/student';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
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

export const useStudentHistory = (studentId: number) => {
  const { user } = useAuth();

  return useQuery<StudentHistory>({
    queryKey: queryKeys.studentHistory.byStudent(user?.schoolId ?? null, studentId),
    queryFn: async () => {
      try {
        return await studentService.getStudentHistory(studentId);
      } catch (error) {
        handleServiceError(error, 'STUDENT_HISTORY', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId,
    ...retryConfig,
  });
};
