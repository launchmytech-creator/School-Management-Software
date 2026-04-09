import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useAuth } from '../context/AuthContext';

export const useStudentCache = () => {
  const queryClient = useQueryClient();
  const { selectedYear } = useAcademicYear();
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedYear?.id || !user?.schoolId) return;

    const schoolId = Number(user.schoolId);
    const academicYearId = selectedYear.id;

    queryClient.prefetchQuery({
      queryKey: ['students', 'all', { schoolId }],
      queryFn: () => studentService.getStudents({ academicYear: academicYearId }),
      staleTime: 30 * 60 * 1000,
    });
  }, [selectedYear?.id, user?.schoolId, queryClient]);
};

export default useStudentCache;