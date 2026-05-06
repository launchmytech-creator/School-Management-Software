import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService, type Assignment, type CreateAssignmentDto, type AssignmentSubmission } from '../../services/assignmentService';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { handleServiceError } from '../../lib/queryErrorHandler';
import { toast } from 'sonner';

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
    queryFn: async () => {
      try {
        return await assignmentService.getAssignments(filters);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled,
    ...retryConfig,
  });
};

export const useAssignmentById = (id: number) => {
  const { user } = useAuth();
  
  return useQuery<Assignment>({
    queryKey: ['assignments', { schoolId: user?.schoolId ?? null, id }],
    queryFn: async () => {
      try {
        return await assignmentService.getAssignmentById(id);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!id,
    ...retryConfig,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentDto) => {
      try {
        return await assignmentService.createAssignment(data);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'CREATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateAssignmentDto> }) => {
      try {
        return await assignmentService.updateAssignment(id, data);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'UPDATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update assignment');
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      try {
        return await assignmentService.deleteAssignment(id);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'DELETE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete assignment');
    },
  });
};

export const useAssignmentSubmissions = (assignmentId: number) => {
  const { user } = useAuth();
  
  return useQuery<AssignmentSubmission[]>({
    queryKey: ['assignments', { schoolId: user?.schoolId ?? null, assignmentId }, 'submissions'],
    queryFn: async () => {
      try {
        return await assignmentService.getSubmissions(assignmentId);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LISTS,
    enabled: !!assignmentId,
    ...retryConfig,
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, data }: { submissionId: number; data: { marksObtained: number; feedback?: string } }) => {
      try {
        return await assignmentService.gradeSubmission(submissionId, data);
      } catch (error) {
        handleServiceError(error, 'ASSIGNMENTS', 'UPDATE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Submission graded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to grade submission');
    },
  });
};
