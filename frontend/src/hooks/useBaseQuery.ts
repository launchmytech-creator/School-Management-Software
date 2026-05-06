import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { handleServiceError, type ServiceName } from '../lib/queryErrorHandler';
import { logger } from '../lib/logger';

export interface BaseQueryOptions<TData, TError, TQueryKey extends readonly unknown[]>
  extends Omit<UseQueryOptions<TData, TError, TData, TQueryKey>, 'queryFn'> {
  serviceName: ServiceName;
  operation?: 'FETCH';
}

export interface BaseMutationOptions<TData, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  serviceName: ServiceName;
  operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SAVE';
  onSuccessMessage?: string;
}

export function useBaseQuery<TData, TError = unknown, TQueryKey extends readonly unknown[] = readonly unknown[]>(
  options: BaseQueryOptions<TData, TError, TQueryKey>
) {
  const { serviceName, operation = 'FETCH', ...queryOptions } = options;
  
  return useQuery<TData, TError>({
    ...queryOptions,
    queryFn: async () => {
      try {
        return await options.queryFn();
      } catch (error) {
        const message = handleServiceError(error, serviceName, operation);
        logger.debug(`Query error in ${serviceName}: ${message}`);
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return false;
        }
        if (error.message.includes('404') || error.message.includes('Not found')) {
          return false;
        }
      }
      
      return true;
    },
  });
}

export function useBaseMutation<TData, TVariables, TContext = unknown>(
  options: BaseMutationOptions<TData, TVariables, TContext>
) {
  const { serviceName, operation = 'CREATE', onSuccessMessage, onError, onSuccess, ...mutationOptions } = options;
  const queryClient = useQueryClient();
  
  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    mutationFn: async (variables) => {
      try {
        return await options.mutationFn(variables);
      } catch (error) {
        const message = handleServiceError(error, serviceName, operation);
        logger.debug(`Mutation error in ${serviceName}: ${message}`);
        throw error;
      }
    },
    onError: (error, variables, context) => {
      const errorMessage = handleServiceError(error, serviceName, operation);
      
      if (onError) {
        return onError(error, variables, context);
      }
      
      logger.warn(`Mutation failed in ${serviceName}: ${errorMessage}`);
    },
    onSuccess: (data, variables, context) => {
      if (onSuccessMessage) {
        logger.debug(`Mutation succeeded in ${serviceName}: ${onSuccessMessage}`);
      }
      
      if (onSuccess) {
        return onSuccess(data, variables, context);
      }
    },
    // Note: Removed global invalidation - let individual mutations handle cache updates
    // This prevents unnecessary refetches across the entire app
  });
}

export default useBaseQuery;