import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { handleServiceError, type ServiceName } from '../lib/queryErrorHandler';
import { logger } from '../lib/logger';

export interface BaseQueryOptions<TData>
  extends Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, 'queryFn'> {
  serviceName: ServiceName;
  operation?: 'FETCH';
}

export interface BaseMutationOptions<TData, TVariables, TContext = unknown>
  extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, 'mutationFn'> {
  serviceName: ServiceName;
  operation?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SAVE';
  onSuccessMessage?: string;
}

export function useBaseQuery<TData>(
  options: BaseQueryOptions<TData> & { queryFn: () => Promise<TData> }
) {
  const { serviceName, operation = 'FETCH', ...queryOptions } = options;
  
  return useQuery<TData, Error>({
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
  options: BaseMutationOptions<TData, TVariables, TContext> & { mutationFn: (variables: TVariables) => Promise<TData> }
) {
  const { serviceName, operation = 'CREATE', onSuccessMessage, ...mutationOptions } = options;
  const queryClient = useQueryClient();
  void queryClient;
  
  const originalOnError = mutationOptions.onError as ((error: Error, variables: TVariables, context: TContext | undefined) => void) | undefined;
  const originalOnSuccess = mutationOptions.onSuccess as ((data: TData, variables: TVariables, context: TContext | undefined) => void) | undefined;
  
  return useMutation<TData, Error, TVariables, TContext>({
    ...mutationOptions,
    onError: (error, variables, context) => {
      handleServiceError(error, serviceName, operation);
      
      if (originalOnError) {
        originalOnError(error, variables, context);
      }
      
      logger.warn(`Mutation failed in ${serviceName}: ${(error as Error).message}`);
    },
    onSuccess: (data, variables, context) => {
      if (onSuccessMessage) {
        logger.debug(`Mutation succeeded in ${serviceName}: ${onSuccessMessage}`);
      }
      
      if (originalOnSuccess) {
        originalOnSuccess(data, variables, context);
      }
    },
    mutationFn: async (variables) => {
      try {
        return await options.mutationFn(variables);
      } catch (error) {
        const message = handleServiceError(error, serviceName, operation);
        logger.debug(`Mutation error in ${serviceName}: ${message}`);
        throw error;
      }
    },
  });
}

export default useBaseQuery;
