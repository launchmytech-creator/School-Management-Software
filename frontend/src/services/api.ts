import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import { STORAGE_KEYS, API_TIMEOUT, NOTIFICATION_MESSAGES } from '../lib/constants';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiError extends Error {
  statusCode?: number;
  code?: string;
  
  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return NOTIFICATION_MESSAGES.ERROR.NETWORK;
    }
    
    const data = error.response.data as { message?: string; error?: string };
    
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    
    switch (error.response.status) {
      case 400: return 'Invalid request';
      case 401: return NOTIFICATION_MESSAGES.ERROR.UNAUTHORIZED;
      case 403: return 'Access denied';
      case 404: return NOTIFICATION_MESSAGES.ERROR.NOT_FOUND;
      case 422: return 'Validation failed';
      case 500: return 'Server error. Please try again later.';
      default: return error.message || NOTIFICATION_MESSAGES.ERROR.GENERIC;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return NOTIFICATION_MESSAGES.ERROR.GENERIC;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> => {
  try {
    const response = await api({
      url: endpoint,
      ...options,
    });
    
    const responseData = response.data;
    
    if (responseData?.success && responseData?.data !== undefined) {
      return responseData.data as T;
    }
    
    return responseData as T;
  } catch (error) {
    const message = extractErrorMessage(error);
    throw new ApiError(message);
  }
};

export { ApiError };
export default api;
