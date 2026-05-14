import { ERROR_MESSAGES } from './constants';
import { logger } from './logger';
import { ApiError } from '../services/api';

export type FetchServiceName = keyof typeof ERROR_MESSAGES.FETCH;
export type CreateServiceName = keyof typeof ERROR_MESSAGES.CREATE;
export type UpdateServiceName = keyof typeof ERROR_MESSAGES.UPDATE;
export type DeleteServiceName = keyof typeof ERROR_MESSAGES.DELETE;
export type SaveServiceName = keyof typeof ERROR_MESSAGES.SAVE;

export type ServiceName = FetchServiceName | CreateServiceName | UpdateServiceName | DeleteServiceName | SaveServiceName;

interface ErrorContext {
  service?: string;
  method?: string;
  params?: Record<string, unknown>;
}

export const getQueryErrorMessage = (
  error: unknown,
  serviceName: ServiceName,
  operation: 'FETCH' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SAVE' = 'FETCH'
): string => {
  const errorMessages = ERROR_MESSAGES[operation];
  
  if (error instanceof Error) {
    const contextualMessage = (errorMessages as Record<string, string>)[serviceName];
    
    if (contextualMessage) {
      return contextualMessage;
    }
    
    return 'An error occurred. Please try again.';
  }
  
  logger.error(`Unhandled error in ${serviceName} (${operation})`, { error });
  return (errorMessages as Record<string, string>)[serviceName] || 'An error occurred. Please try again.';
};

export const logServiceError = (
  error: unknown,
  context: ErrorContext
): void => {
  const errorDetails: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };
  
  if (context.service) {
    errorDetails.service = context.service;
  }
  
  if (context.method) {
    errorDetails.method = context.method;
  }
  
  if (context.params) {
    errorDetails.params = context.params;
  }
  
  if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
    
    if (error instanceof ApiError && error.statusCode) {
      errorDetails.statusCode = error.statusCode;
    }
  } else {
    errorDetails.error = String(error);
  }
  
  logger.error(`Service error: ${context.service || 'unknown'}`, errorDetails);
};

export const handleServiceError = (
  error: unknown,
  serviceName: ServiceName,
  operation: 'FETCH' | 'CREATE' | 'UPDATE' | 'DELETE' | 'SAVE' = 'FETCH'
): string => {
  logServiceError(error, { service: serviceName });
  return getQueryErrorMessage(error, serviceName, operation);
};

export const createErrorHandler = (defaultService: ServiceName) => {
  return (error: unknown) => handleServiceError(error, defaultService);
};