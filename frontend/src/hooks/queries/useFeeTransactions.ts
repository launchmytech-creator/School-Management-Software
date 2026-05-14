import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  feeService,
  type FeeTransaction,
  type FeeDefaulter,
} from '../../services/feeService';
import type { PaginatedResponse } from '../../types/common';
import { queryKeys } from '../../lib/queryKeys';
import { QUERY_STALE_TIME } from '../../lib/constants';
import { useAuth } from '../../context/AuthContext';
import { handleServiceError } from '../../lib/queryErrorHandler';

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

interface FeeTransactionFilters {
  classId?: number;
  studentId?: number;
  academicYearId?: number;
  status?: string;
}

export interface UseFeeTransactionsReturn {
  data: FeeTransaction[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  page: number;
  setPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refetch: () => void;
}

export const useFeeTransactions = (
  baseParams: FeeTransactionFilters = {},
): UseFeeTransactionsReturn => {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const params = {
    ...baseParams,
    page,
    limit: 20,
    search: searchTerm || undefined,
  };

  const query = useQuery<PaginatedResponse<FeeTransaction>>({
    queryKey: queryKeys.feeTransactions.byFilters(user?.schoolId ?? null, params),
    queryFn: async () => {
      try {
        return await feeService.getFeeTransactions(params);
      } catch (error) {
        handleServiceError(error, 'FEE_TRANSACTIONS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    ...retryConfig,
  });

  const handleSetPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    pagination: query.data?.pagination ?? null,
    page,
    setPage: handleSetPage,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    refetch: query.refetch,
  };
};

export const useStudentFees = (studentId: number) => {
  const { user } = useAuth();
  
  return useQuery<FeeTransaction[]>({
    queryKey: queryKeys.feeTransactions.byStudent(user?.schoolId ?? null, studentId),
    queryFn: async () => {
      try {
        return await feeService.getStudentFeeTransactions(studentId);
      } catch (error) {
        handleServiceError(error, 'FEE_TRANSACTIONS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    enabled: !!studentId,
    ...retryConfig,
  });
};

export interface UseFeeDefaultersReturn {
  data: FeeDefaulter[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null;
  page: number;
  setPage: (page: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refetch: () => void;
}

export const useFeeDefaulters = (
  baseParams: { classId?: number; academicYearId?: number } = {},
): UseFeeDefaultersReturn => {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const params = {
    ...baseParams,
    page,
    limit: 20,
    search: searchTerm || undefined,
  };

  const query = useQuery<PaginatedResponse<FeeDefaulter>>({
    queryKey: queryKeys.feeDefaulters.byFilters(user?.schoolId ?? null, params),
    queryFn: async () => {
      try {
        return await feeService.getFeeDefaulters(params);
      } catch (error) {
        handleServiceError(error, 'FEE_TRANSACTIONS', 'FETCH');
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.OPERATIONAL,
    ...retryConfig,
  });

  const handleSetPage = useCallback((p: number) => {
    setPage(p);
  }, []);

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
  }, []);

  return {
    data: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    pagination: query.data?.pagination ?? null,
    page,
    setPage: handleSetPage,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    refetch: query.refetch,
  };
};
