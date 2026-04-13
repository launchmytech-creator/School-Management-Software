import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, type Assignment, type CreateAssignmentDto, type AssignmentSubmission } from '../../services/assignmentService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';

export interface AssignmentFilters {
  classId?: number;
  subjectId?: number;
  academicYearId?: number;
  teacherId?: number;
  assignmentType?: string;
}

export const useAssignments = (filters: AssignmentFilters = {}, enabled = true) => {
  const { user } = useAuth();
  
  return useQuery<Assignment[]>({
    queryKey: queryKeys.assignments.byFilters(user?.schoolId ?? null, filters),
    queryFn: () => assignmentService.getAssignments(filters),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
  });
};

export const useAssignmentById = (id: number) => {
  const { user } = useAuth();
  
  return useQuery<Assignment>({
    queryKey: ['assignments', { schoolId: user?.schoolId ?? null, id }],
    queryFn: () => assignmentService.getAssignmentById(id),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentDto) => assignmentService.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAssignmentDto> }) =>
      assignmentService.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => assignmentService.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};

export const useAssignmentSubmissions = (assignmentId: number) => {
  const { user } = useAuth();
  
  return useQuery<AssignmentSubmission[]>({
    queryKey: ['assignments', { schoolId: user?.schoolId ?? null, assignmentId }, 'submissions'],
    queryFn: () => assignmentService.getSubmissions(assignmentId),
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!assignmentId,
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, data }: { submissionId: number; data: { marksObtained: number; feedback?: string } }) =>
      assignmentService.gradeSubmission(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
