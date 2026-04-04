import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  studentService,
  type CreateStudentDto,
  type UpdateStudentDto,
} from '../../services/studentService';
import { queryKeys } from '../../lib/queryKeys';
import { useNotification } from '../../context/NotificationContext';

export const useCreateStudent = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => studentService.createStudent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.classes.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin });
      showNotification('Student created successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to create student', 'error');
    },
  });
};

export const useUpdateStudent = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentDto }) =>
      studentService.updateStudent(id, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.students.byId(variables.id) });
      showNotification('Student updated successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to update student', 'error');
    },
  });
};

export const useDeleteStudent = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: number) => studentService.deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all });
      qc.invalidateQueries({ queryKey: queryKeys.classes.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.admin });
      showNotification('Student deleted successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to delete student', 'error');
    },
  });
};
