import { useState, useCallback } from 'react';

interface UseLoadingStateReturn {
  isLoading: boolean;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
  startLoading: () => void;
  stopLoading: () => void;
}

export function useLoadingState(): UseLoadingStateReturn {
  const [isLoading, setIsLoading] = useState(false);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    setIsLoading(true);
    try {
      return await promise;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return { isLoading, withLoading, startLoading, stopLoading };
}
