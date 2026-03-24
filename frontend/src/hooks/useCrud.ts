import { useState, useCallback } from 'react';
import { ApiError } from '../services/api';
import { useNotification } from '../context/NotificationContext';

interface UseCrudOptions<T> {
  fetchFn: () => Promise<T[]>;
  createFn?: (data: unknown) => Promise<T>;
  updateFn?: (id: string | number, data: unknown) => Promise<T>;
  deleteFn?: (id: string | number) => Promise<void>;
  onSuccessMessage?: string;
}

interface UseCrudReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (data: unknown) => Promise<T | null>;
  update: (id: string | number, data: unknown) => Promise<T | null>;
  remove: (id: string | number) => Promise<boolean>;
  setData: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useCrud<T>({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  onSuccessMessage = 'Operation successful',
}: UseCrudOptions<T>): UseCrudReturn<T> {
  const { showNotification } = useNotification();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const create = useCallback(async (formData: unknown): Promise<T | null> => {
    if (!createFn) {
      showNotification('Create not supported', 'warning');
      return null;
    }

    setLoading(true);
    try {
      const result = await createFn(formData);
      setData(prev => [result, ...prev]);
      showNotification(onSuccessMessage, 'success');
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to create';
      showNotification(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [createFn, onSuccessMessage, showNotification]);

  const update = useCallback(async (id: string | number, formData: unknown): Promise<T | null> => {
    if (!updateFn) {
      showNotification('Update not supported', 'warning');
      return null;
    }

    setLoading(true);
    try {
      const result = await updateFn(id, formData);
      setData(prev => prev.map(item => 
        (item as { id: string | number }).id === id ? result : item
      ));
      showNotification(onSuccessMessage, 'success');
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update';
      showNotification(message, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateFn, onSuccessMessage, showNotification]);

  const remove = useCallback(async (id: string | number): Promise<boolean> => {
    if (!deleteFn) {
      showNotification('Delete not supported', 'warning');
      return false;
    }

    try {
      await deleteFn(id);
      setData(prev => prev.filter(item => 
        (item as { id: string | number }).id !== id
      ));
      showNotification(onSuccessMessage, 'success');
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete';
      showNotification(message, 'error');
      return false;
    }
  }, [deleteFn, onSuccessMessage, showNotification]);

  return {
    data,
    loading,
    error,
    fetch,
    create,
    update,
    remove,
    setData,
  };
}
