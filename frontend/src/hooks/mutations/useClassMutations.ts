import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classService } from '../../services/classService';
import type { CreateClassDto, UpdateClassDto } from '../../types/class';
import { useNotification } from '../../context/NotificationContext';

export const useCreateClass = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (data: CreateClassDto) => classService.createClass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showNotification('Class created successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to create class', 'error');
    },
  });
};

export const useUpdateClass = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateClassDto }) =>
      classService.updateClass(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      showNotification('Class updated successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to update class', 'error');
    },
  });
};

export const useDeleteClass = () => {
  const qc = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: string | number) => classService.deleteClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      showNotification('Class deleted successfully', 'success');
    },
    onError: (err: Error) => {
      showNotification(err.message || 'Failed to delete class', 'error');
    },
  });
};
