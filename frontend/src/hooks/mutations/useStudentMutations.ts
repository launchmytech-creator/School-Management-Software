import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  studentService,
  type CreateStudentDto,
  type UpdateStudentDto,
} from '../../services/studentService';
import { useNotification } from '../../context/NotificationContext';

export const useCreateStudent = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => studentService.createStudent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
    onSuccess: (_result, _variables) => {
      qc.invalidateQueries({ queryKey: ['students'] });
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
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showNotification('Student deleted successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to delete student', 'error');
    },
  });
};
